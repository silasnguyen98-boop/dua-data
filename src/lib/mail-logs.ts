import { query } from "@/lib/db";
import { sendMail } from "@/lib/smtp";
import type { MailLogStatus } from "@/types/mail";

export interface SendLoggedMailOptions {
  registrationId?: string | null;
  recipientEmail: string;
  mailType: string;
  subject: string;
  text: string;
  html?: string;
  body?: string;
}

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function toMailBody(options: SendLoggedMailOptions) {
  return options.body || options.html || options.text || "";
}

async function createMailLogEntry(options: SendLoggedMailOptions, status: MailLogStatus = "pending") {
  const now = new Date().toISOString();
  
  const columns = [
    "registration_id", "recipient_email", "mail_type", "subject", 
    "status", "error_message", "sent_at", "body", "created_at"
  ];
  const values = [
    options.registrationId || null,
    normalizeText(options.recipientEmail),
    normalizeText(options.mailType),
    normalizeText(options.subject),
    status,
    null,
    null,
    toMailBody(options),
    now
  ];
  const placeholders = values.map((_, i) => `$${i + 1}`).join(", ");

  const { rows } = await query(
    `INSERT INTO mail_logs (${columns.join(", ")}) VALUES (${placeholders}) RETURNING *`,
    values
  );

  return rows[0] as Record<string, unknown>;
}

async function updateMailLogEntry(
  id: string,
  patch: Partial<{
    status: MailLogStatus;
    errorMessage: string | null;
    sentAt: string | null;
  }>,
) {
  const updates: string[] = [];
  const values: any[] = [id];

  if (patch.status !== undefined) {
    updates.push(`status = $${values.length + 1}`);
    values.push(patch.status);
  }
  if (patch.errorMessage !== undefined) {
    updates.push(`error_message = $${values.length + 1}`);
    values.push(patch.errorMessage);
  }
  if (patch.sentAt !== undefined) {
    updates.push(`sent_at = $${values.length + 1}`);
    values.push(patch.sentAt);
  }

  if (updates.length === 0) return;

  await query(
    `UPDATE mail_logs SET ${updates.join(", ")} WHERE id = $1`,
    values
  );
}

export async function sendLoggedMail(options: SendLoggedMailOptions) {
  const logRow = await createMailLogEntry(options, "pending");
  const logId = String(logRow.id || "");

  try {
    await sendMail({
      to: options.recipientEmail,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });

    const sentAt = new Date().toISOString();
    await updateMailLogEntry(logId, {
      status: "sent",
      sentAt,
      errorMessage: null,
    });

    return { logId, status: "sent" as const, sentAt };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Không thể gửi mail";
    await updateMailLogEntry(logId, {
      status: "failed",
      errorMessage,
      sentAt: null,
    }).catch(() => {
      // Ignore logging update errors.
    });
    throw new Error(errorMessage);
  }
}

export async function markMailLogStatus(id: string, status: MailLogStatus, errorMessage?: string | null) {
  await updateMailLogEntry(id, {
    status,
    errorMessage: errorMessage ?? null,
    sentAt: status === "sent" ? new Date().toISOString() : null,
  });
}
