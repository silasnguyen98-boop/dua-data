import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { listAuthUsers } from "@/lib/auth-db";
import {
  getDefaultNewsletterSchedule,
  getNewsletterContent,
  isNewsletterScheduleDue,
  newsletterBatchKey,
  sendNewsletterMail,
  type NewsletterSchedule,
  type NewsletterRecipient,
} from "@/lib/newsletter";

export const dynamic = "force-dynamic";

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

async function loadRecipients() {
  const [settingsResult, authUsers] = await Promise.all([
    query("SELECT * FROM newsletter_recipients WHERE selected = true AND wants_resources = true ORDER BY updated_at DESC"),
    listAuthUsers(),
  ]);

  const settingsData = settingsResult.rows;
  const userMap = new Map(
    authUsers.map((user) => [
      user.id,
      {
        email: String(user.email || ""),
        fullName: String(user.fullName || user.email.split("@")[0] || ""),
      },
    ]),
  );

  return (settingsData || [])
    .map((row) => {
      const user = userMap.get(String((row as any).user_id));
      if (!user || !user.email) return null;
      return {
        id: String((row as any).id || ""),
        userId: String((row as any).user_id || ""),
        email: user.email,
        fullName: String((row as any).full_name || user.fullName || ""),
        selected: Boolean((row as any).selected),
        wantsResources: Boolean((row as any).wants_resources),
        lastSentBatchKey: (row as any).last_sent_batch_key ? String((row as any).last_sent_batch_key) : null,
        lastSentAt: (row as any).last_sent_at ? String((row as any).last_sent_at) : null,
      } as NewsletterRecipient;
    })
    .filter(Boolean) as NewsletterRecipient[];
}

async function loadSchedule() {
  const { rows } = await query("SELECT * FROM newsletter_settings WHERE id = 1 LIMIT 1");
  const data = rows[0];

  if (!data) return getDefaultNewsletterSchedule();

  return {
    enabled: Boolean((data as Record<string, unknown>).enabled ?? true),
    dayOfWeek: Number((data as Record<string, unknown>).day_of_week ?? 6),
    hour: Number((data as Record<string, unknown>).hour ?? 7),
    minute: Number((data as Record<string, unknown>).minute ?? 0),
    timezone: String((data as Record<string, unknown>).timezone || "Asia/Ho_Chi_Minh"),
  } satisfies NewsletterSchedule;
}

async function upsertBatchState(recipient: NewsletterRecipient, batchKey: string, sentAt: string) {
  await query(
    `INSERT INTO newsletter_recipients (user_id, email, full_name, selected, wants_resources, last_sent_batch_key, last_sent_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT (user_id) DO UPDATE SET
       last_sent_batch_key = EXCLUDED.last_sent_batch_key,
       last_sent_at = EXCLUDED.last_sent_at,
       updated_at = EXCLUDED.updated_at`,
    [
      recipient.userId,
      recipient.email,
      recipient.fullName,
      recipient.selected,
      recipient.wantsResources,
      batchKey,
      sentAt,
      sentAt
    ]
  );
}

export async function POST(req: NextRequest) {
  try {
    const secret = req.headers.get("x-newsletter-secret") || req.nextUrl.searchParams.get("secret") || "";
    if (!process.env.NEWSLETTER_CRON_SECRET || secret !== process.env.NEWSLETTER_CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const schedule = await loadSchedule();
    if (!isNewsletterScheduleDue(schedule)) {
      return NextResponse.json({
        success: true,
        skipped: true,
        reason: "Schedule not due",
        schedule,
      });
    }

    const batchKey = newsletterBatchKey();
    const content = await getNewsletterContent();
    const recipients = await loadRecipients();
    const eligible = recipients.filter((recipient) => recipient.lastSentBatchKey !== batchKey);

    const sent: string[] = [];
    const failed: Array<{ email: string; error: string }> = [];
    const now = new Date().toISOString();

    for (const recipient of eligible) {
      try {
        await sendNewsletterMail(recipient.email, recipient.fullName, content);
        await upsertBatchState(recipient, batchKey, now);
        sent.push(recipient.email);
      } catch (err) {
        failed.push({
          email: recipient.email,
          error: err instanceof Error ? err.message : "Send failed",
        });
      }
    }

    return NextResponse.json({ success: true, batchKey, sent, failed, total: eligible.length });
  } catch (err) {
    console.error("POST /api/newletters/cron error:", err);
    return NextResponse.json({ error: "Failed to run cron newsletter send" }, { status: 500 });
  }
}
