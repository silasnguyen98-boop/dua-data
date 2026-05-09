import { createAdminWriteClient } from "@/lib/supabase-server";
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
  const supabase = createAdminWriteClient();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("mail_logs")
    .insert({
      registration_id: options.registrationId || null,
      recipient_email: normalizeText(options.recipientEmail),
      mail_type: normalizeText(options.mailType),
      subject: normalizeText(options.subject),
      status,
      error_message: null,
      sent_at: null,
      body: toMailBody(options),
      created_at: now,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message || "Không thể tạo log mail");
  }

  return data as Record<string, unknown>;
}

async function updateMailLogEntry(
  id: string,
  patch: Partial<{
    status: MailLogStatus;
    errorMessage: string | null;
    sentAt: string | null;
  }>,
) {
  const supabase = createAdminWriteClient();
  const payload: Record<string, unknown> = {
  };

  if (patch.status !== undefined) {
    payload.status = patch.status;
  }
  if (patch.errorMessage !== undefined) {
    payload.error_message = patch.errorMessage;
  }
  if (patch.sentAt !== undefined) {
    payload.sent_at = patch.sentAt;
  }

  const { error } = await supabase.from("mail_logs").update(payload).eq("id", id);
  if (error) throw new Error(error.message || "Không thể cập nhật log mail");
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
