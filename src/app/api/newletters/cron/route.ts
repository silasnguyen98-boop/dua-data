import { NextRequest, NextResponse } from "next/server";
import { createAdminWriteClient } from "@/lib/supabase-server";
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
  const supabase = createAdminWriteClient();
  const [settingsRes, usersRes] = await Promise.all([
    supabase
      .from("newsletter_recipients")
      .select("*")
      .eq("selected", true)
      .eq("wants_resources", true)
      .order("updated_at", { ascending: false }),
    supabase.auth.admin.listUsers({ page: 1, perPage: 200 }),
  ]);

  if (settingsRes.error) throw settingsRes.error;
  if (usersRes.error) throw usersRes.error;

  const userMap = new Map(
    (usersRes.data.users || []).map((user) => [
      user.id,
      {
        email: String(user.email || ""),
        fullName: String(user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || ""),
      },
    ]),
  );

  return (settingsRes.data || [])
    .map((row) => {
      const user = userMap.get(String(row.user_id));
      if (!user || !user.email) return null;
      return {
        id: String(row.id || ""),
        userId: String(row.user_id || ""),
        email: user.email,
        fullName: String(row.full_name || user.fullName || ""),
        selected: Boolean(row.selected),
        wantsResources: Boolean(row.wants_resources),
        lastSentBatchKey: row.last_sent_batch_key ? String(row.last_sent_batch_key) : null,
        lastSentAt: row.last_sent_at ? String(row.last_sent_at) : null,
      } as NewsletterRecipient;
    })
    .filter(Boolean) as NewsletterRecipient[];
}

async function loadSchedule() {
  const supabase = createAdminWriteClient();
  const { data, error } = await supabase
    .from("newsletter_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();

  if (error) throw error;
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
  const supabase = createAdminWriteClient();
  const { error } = await supabase.from("newsletter_recipients").upsert(
    {
      user_id: recipient.userId,
      email: recipient.email,
      full_name: recipient.fullName,
      selected: recipient.selected,
      wants_resources: recipient.wantsResources,
      last_sent_batch_key: batchKey,
      last_sent_at: sentAt,
      updated_at: sentAt,
    },
    { onConflict: "user_id" },
  );
  if (error) throw error;
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
