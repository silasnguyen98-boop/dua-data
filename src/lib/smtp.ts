import net from "net";
import tls from "tls";

interface SmtpMailOptions {
  to: string;
  cc?: string;
  bcc?: string;
  subject: string;
  text: string;
  html?: string;
  profile?: "noreply" | "hello";
}

interface SmtpConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
}

type SmtpResponse = {
  code: number;
  message: string;
};

function encodeMimeWord(value: string) {
  return `=?UTF-8?B?${Buffer.from(value, "utf8").toString("base64")}?=`;
}

function wrapBase64(value: string, lineLength = 76) {
  const chunks: string[] = [];
  for (let i = 0; i < value.length; i += lineLength) {
    chunks.push(value.slice(i, i + lineLength));
  }
  return chunks.join("\r\n");
}

function toBase64Body(value: string) {
  return wrapBase64(Buffer.from(value, "utf8").toString("base64"));
}

function getConfig(profile: "noreply" | "hello" = "noreply"): SmtpConfig | null {
  const isHello = profile === "hello";
  const host = process.env.SMTP_HOST?.trim() || "";
  const port = Number(process.env.SMTP_PORT || 0);
  const user = (isHello ? process.env.SMTP_USER_HELLO : process.env.SMTP_USER)?.trim() || "";
  const pass = (isHello ? process.env.SMTP_PASS_HELLO : process.env.SMTP_PASS) || "";
  const from = (isHello ? process.env.SMTP_FROM_HELLO : process.env.SMTP_FROM)?.trim() || "";

  if (!host || !port || !user || !pass || !from) {
    return null;
  }

  return { host, port, user, pass, from };
}

class SmtpSession {
  private socket: net.Socket | tls.TLSSocket;
  private buffer = "";

  constructor(socket: net.Socket | tls.TLSSocket) {
    this.socket = socket;
  }

  private async waitForData() {
    const chunk = await new Promise<Buffer>((resolve, reject) => {
      const onData = (data: Buffer) => {
        cleanup();
        resolve(data);
      };
      const onError = (error: Error) => {
        cleanup();
        reject(error);
      };
      const onClose = () => {
        cleanup();
        reject(new Error("SMTP connection closed"));
      };
      const cleanup = () => {
        this.socket.off("data", onData);
        this.socket.off("error", onError);
        this.socket.off("close", onClose);
      };
      this.socket.once("data", onData);
      this.socket.once("error", onError);
      this.socket.once("close", onClose);
    });

    this.buffer += chunk.toString("utf8");
  }

  private parseResponse(): SmtpResponse | null {
    const lines = this.buffer.split(/\r?\n/).filter(Boolean);
    if (lines.length === 0) return null;

    const lastLine = lines[lines.length - 1];
    const match = lastLine.match(/^(\d{3})([ -])(.*)$/);
    if (!match) return null;
    if (match[2] === "-") return null;

    const code = Number(match[1]);
    const message = lines.join("\n");
    this.buffer = "";
    return { code, message };
  }

  async readResponse(timeoutMs = 15000): Promise<SmtpResponse> {
    const started = Date.now();
    while (Date.now() - started < timeoutMs) {
      const parsed = this.parseResponse();
      if (parsed) return parsed;
      await this.waitForData();
    }
    throw new Error("SMTP response timeout");
  }

  write(line: string) {
    this.socket.write(`${line}\r\n`);
  }

  async expect(code: number, timeoutMs?: number) {
    const response = await this.readResponse(timeoutMs);
    if (response.code !== code) {
      throw new Error(`SMTP expected ${code} but got ${response.code}: ${response.message}`);
    }
    return response;
  }

  async sendCommand(command: string, expected: number, timeoutMs?: number) {
    this.write(command);
    return this.expect(expected, timeoutMs);
  }

  close() {
    this.socket.end();
  }
}

async function startSession(config: SmtpConfig) {
  const useStartTls = config.port === 587;

  const socket = useStartTls
    ? net.createConnection({ host: config.host, port: config.port })
    : tls.connect({ host: config.host, port: config.port, servername: config.host });

  socket.setTimeout(15000);

  const session = new SmtpSession(socket);
  await session.expect(220);
  await session.sendCommand(`EHLO ${process.env.SMTP_HELO_DOMAIN || "duadata.net"}`, 250);

  if (useStartTls) {
    await session.sendCommand("STARTTLS", 220);

    const secureSocket = tls.connect({
      socket,
      servername: config.host,
    });
    secureSocket.setTimeout(15000);

    await new Promise<void>((resolve) => {
      secureSocket.once("secureConnect", () => resolve());
    });

    const secureSession = new SmtpSession(secureSocket);
    await secureSession.sendCommand(`EHLO ${process.env.SMTP_HELO_DOMAIN || "duadata.net"}`, 250);
    return secureSession;
  }

  return session;
}

async function withSmtpStep<T>(step: string, fn: () => Promise<T>) {
  try {
    return await fn();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err || "Unknown SMTP error");
    throw new Error(`${step}: ${message}`);
  }
}

function buildMessage(config: SmtpConfig, options: SmtpMailOptions) {
  const { to, cc, subject, text, html } = options;
  const boundary = `duadata_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;
  const fromMatch = config.from.match(/^(.*)<([^>]+)>$/);
  const encodedFrom = fromMatch
    ? `${encodeMimeWord(fromMatch[1].trim().replace(/\s+$/g, ""))} <${fromMatch[2].trim()}>`
    : config.from;
  const lines = [
    `From: ${encodedFrom}`,
    `To: ${to}`,
  ];
  
  if (cc) lines.push(`Cc: ${cc}`);
  
  lines.push(`Subject: ${encodeMimeWord(subject)}`);
  lines.push(`Date: ${new Date().toUTCString()}`);
  lines.push(`Message-ID: <${Date.now()}.${Math.random().toString(36).slice(2)}@${process.env.SMTP_HELO_DOMAIN || "duadata.net"}>`);
  lines.push("MIME-Version: 1.0");

  if (html) {
    lines.push(`Content-Type: multipart/alternative; boundary="${boundary}"`);
    lines.push("");
    lines.push(`--${boundary}`);
    lines.push("Content-Type: text/plain; charset=UTF-8");
    lines.push("Content-Transfer-Encoding: base64");
    lines.push("");
    lines.push(toBase64Body(text));
    lines.push("");
    lines.push(`--${boundary}`);
    lines.push("Content-Type: text/html; charset=UTF-8");
    lines.push("Content-Transfer-Encoding: base64");
    lines.push("");
    lines.push(toBase64Body(html));
    lines.push("");
    lines.push(`--${boundary}--`);
  } else {
    lines.push("Content-Type: text/plain; charset=UTF-8");
    lines.push("Content-Transfer-Encoding: base64");
    lines.push("");
    lines.push(toBase64Body(text));
  }

  return lines.join("\r\n");
}

export async function sendMail(options: SmtpMailOptions) {
  const config = getConfig(options.profile || "noreply");
  if (!config) {
    throw new Error(`Missing SMTP configuration for profile: ${options.profile || "default"}`);
  }

  const session = await startSession(config);
  try {
    await withSmtpStep("AUTH LOGIN", () => session.sendCommand("AUTH LOGIN", 334));
    await withSmtpStep("AUTH username", () =>
      session.sendCommand(Buffer.from(config.user, "utf8").toString("base64"), 334)
    );
    await withSmtpStep("AUTH password", () =>
      session.sendCommand(Buffer.from(config.pass, "utf8").toString("base64"), 235)
    );
    await withSmtpStep("MAIL FROM", () =>
      session.sendCommand(`MAIL FROM:<${config.from.match(/<([^>]+)>/)?.[1] || config.from}>`, 250)
    );
    
    const recipients = [options.to];
    if (options.cc) options.cc.split(",").forEach(r => recipients.push(r.trim()));
    if (options.bcc) options.bcc.split(",").forEach(r => recipients.push(r.trim()));

    for (const recipient of recipients.filter(Boolean)) {
      await withSmtpStep(`RCPT TO:${recipient}`, () =>
        session.sendCommand(`RCPT TO:<${recipient}>`, 250)
      );
    }

    await withSmtpStep("DATA", () => session.sendCommand("DATA", 354));

    const message = buildMessage(config, options);
    await withSmtpStep("MESSAGE BODY", async () => {
      session.write(`${message}\r\n.`);
      await session.expect(250);
    });
    await withSmtpStep("QUIT", () => session.sendCommand("QUIT", 221));
  } finally {
    session.close();
  }
}
