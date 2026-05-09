import { NextRequest, NextResponse } from "next/server";
import { createAdminWriteClient } from "@/lib/supabase-server";
import { sendLoggedMail } from "@/lib/mail-logs";

export const dynamic = "force-dynamic";

const ALLOWED_ROLES = new Set(["system_admin", "content_manager"]);

type MailLogRow = Record<string, unknown>;

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getRoleFromHeader(req: NextRequest) {
  const auth = req.headers.get("Authorization") || "";
  if (!auth.startsWith("Bearer ")) return null;

  const raw = auth.slice(7).trim();
  if (!raw) return null;

  try {
    const decoded = atob(raw).trim();
    return decoded.includes(":") ? (decoded.split(":")[1] || decoded.split(":")[0] || decoded).trim() : decoded;
  } catch {
    return raw.includes(":") ? (raw.split(":")[1] || raw.split(":")[0] || raw).trim() : raw;
  }
}

function requireMailAccess(req: NextRequest) {
  const role = getRoleFromHeader(req);
  return Boolean(role && ALLOWED_ROLES.has(role));
}

async function loadLogs(limit = 100) {
  const supabase = createAdminWriteClient();
  const [logsResult, registrationsResult, coursesResult] = await Promise.all([
    supabase
      .from("mail_logs")
      .select("id, registration_id, recipient_email, mail_type, subject, status, error_message, sent_at, created_at, body")
      .order("created_at", { ascending: false })
      .limit(limit),
    supabase
      .from("course_registrations")
      .select("id, course_id, full_name, email, phone, status, created_at")
      .order("created_at", { ascending: false }),
    supabase.from("courses").select("id, title"),
  ]);

  if (logsResult.error) throw logsResult.error;
  if (registrationsResult.error) throw registrationsResult.error;
  if (coursesResult.error) throw coursesResult.error;

  const courseTitleById = new Map(
    (coursesResult.data || []).map((course) => [String(course.id), String(course.title || "")])
  );
  const registrationById = new Map(
    (registrationsResult.data || []).map((registration) => {
      const courseId = String((registration as MailLogRow).course_id || "");
      return [
        String((registration as MailLogRow).id || ""),
        {
          id: String((registration as MailLogRow).id || ""),
          courseId,
          courseTitle: courseTitleById.get(courseId) || "",
          fullName: String((registration as MailLogRow).full_name || ""),
          email: String((registration as MailLogRow).email || ""),
          phone: String((registration as MailLogRow).phone || ""),
          status: String((registration as MailLogRow).status || ""),
          createdAt: String((registration as MailLogRow).created_at || ""),
        },
      ];
    })
  );

  const logs = (logsResult.data || []).map((row) => {
    const registrationId = row.registration_id ? String(row.registration_id) : null;
    return {
      id: String(row.id || ""),
      registrationId,
      recipientEmail: String(row.recipient_email || ""),
      mailType: String(row.mail_type || ""),
      subject: String(row.subject || ""),
      status: String(row.status || "pending"),
      errorMessage: row.error_message ? String(row.error_message) : null,
      sentAt: row.sent_at ? String(row.sent_at) : null,
      createdAt: String(row.created_at || ""),
      body: String(row.body || ""),
      registration: registrationId ? registrationById.get(registrationId) || null : null,
    };
  });

  const stats = logs.reduce(
    (acc, log) => {
      acc.total += 1;
      const status = String(log.status || "").toLowerCase();
      if (status === "sent") acc.sent += 1;
      else if (status === "failed") acc.failed += 1;
      else if (status === "skipped") acc.skipped += 1;
      else acc.pending += 1;
      return acc;
    },
    { total: 0, sent: 0, failed: 0, pending: 0, skipped: 0 },
  );

  return { logs, stats };
}

export async function GET(req: NextRequest) {
  try {
    if (!requireMailAccess(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { logs, stats } = await loadLogs();
    return NextResponse.json({ logs, stats });
  } catch (err) {
    console.error("GET /api/admin/mail error:", err);
    return NextResponse.json({ error: "Failed to fetch mail logs" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!requireMailAccess(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const logId = normalizeText(body.logId);
    const recipientEmail = normalizeText(body.recipientEmail);
    const subject = normalizeText(body.subject);
    const mailType = normalizeText(body.mailType) || "manual";
    const rawBody = normalizeText(body.body);
    const html = normalizeText(body.html);
    const text = normalizeText(body.text) || rawBody;

    let targetEmail = recipientEmail;
    let targetSubject = subject;
    let targetBody = rawBody || text;
    let targetText = text || rawBody;
    let targetHtml = html || (rawBody ? rawBody.replace(/\n/g, "<br />") : "");
    let targetMailType = mailType;
    let registrationId: string | null = normalizeText(body.registrationId) || null;

    if (logId) {
      const supabase = createAdminWriteClient();
      const { data: existingLog, error: existingError } = await supabase
        .from("mail_logs")
        .select("*")
        .eq("id", logId)
        .maybeSingle();

      if (existingError) throw existingError;
      if (!existingLog) {
        return NextResponse.json({ error: "Mail log not found" }, { status: 404 });
      }

      targetEmail = recipientEmail || String(existingLog.recipient_email || "");
      targetSubject = subject || String(existingLog.subject || "");
      targetBody = rawBody || String(existingLog.body || "");
      targetText = text || String(existingLog.body || "");
      targetHtml = html || String(existingLog.body || "").replace(/\n/g, "<br />");
      targetMailType = mailType || String(existingLog.mail_type || "manual");
      registrationId = existingLog.registration_id ? String(existingLog.registration_id) : null;
    }

    if (!targetEmail || !targetSubject || !targetText) {
      return NextResponse.json(
        { error: "recipientEmail, subject và body là bắt buộc" },
        { status: 400 },
      );
    }

    const sent = await sendLoggedMail({
      registrationId,
      recipientEmail: targetEmail,
      mailType: targetMailType,
      subject: targetSubject,
      text: targetText,
      html: targetHtml || undefined,
      body: targetBody || targetText,
    });

    return NextResponse.json({ success: true, logId: sent.logId });
  } catch (err) {
    console.error("POST /api/admin/mail error:", err);
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Failed to send mail",
      },
      { status: 500 },
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    if (!requireMailAccess(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const id = normalizeText(body.id);
    const status = normalizeText(body.status);
    const errorMessage = body.errorMessage === undefined ? undefined : normalizeText(body.errorMessage) || null;

    if (!id || !status) {
      return NextResponse.json({ error: "Missing id or status" }, { status: 400 });
    }

    const supabase = createAdminWriteClient();
    const updateData: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (errorMessage !== undefined) {
      updateData.error_message = errorMessage;
    }
    if (status === "sent") {
      updateData.sent_at = new Date().toISOString();
    }

    const { error } = await supabase.from("mail_logs").update(updateData).eq("id", id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("PATCH /api/admin/mail error:", err);
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Failed to update mail log",
      },
      { status: 500 },
    );
  }
}
