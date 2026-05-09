import { NextRequest, NextResponse } from "next/server";
import { createAdminWriteClient } from "@/lib/supabase-server";
import {
  getDefaultNewsletterSchedule,
  getNewsletterContent,
  newsletterBatchKey,
  sendNewsletterMail,
  type NewsletterRecipient,
  type NewsletterSchedule,
} from "@/lib/newsletter";

export const dynamic = "force-dynamic";

const ALLOWED_ROLES = new Set(["system_admin", "content_manager"]);

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

function requireNewsletterAccess(req: NextRequest) {
  const role = getRoleFromHeader(req);
  return Boolean(role && ALLOWED_ROLES.has(role));
}

async function listAuthUsers() {
  const supabase = createAdminWriteClient();
  const users: Array<{ id: string; email: string; fullName: string }> = [];
  const perPage = 100;

  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw error;

    const batch = data.users || [];
    batch.forEach((user) => {
      users.push({
        id: user.id,
        email: String(user.email || ""),
        fullName:
          String(user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "").trim(),
      });
    });

    if (batch.length < perPage) break;
  }

  return users;
}

async function listRecipientSettings() {
  const supabase = createAdminWriteClient();
  const { data, error } = await supabase
    .from("newsletter_recipients")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return data || [];
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
    id: Number((data as Record<string, unknown>).id || 1),
    createdAt: data.created_at ? String((data as Record<string, unknown>).created_at) : undefined,
    updatedAt: data.updated_at ? String((data as Record<string, unknown>).updated_at) : undefined,
  } satisfies NewsletterSchedule;
}

async function upsertSchedule(schedule: NewsletterSchedule) {
  const supabase = createAdminWriteClient();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("newsletter_settings")
    .upsert(
      {
        id: 1,
        enabled: schedule.enabled,
        day_of_week: schedule.dayOfWeek,
        hour: schedule.hour,
        minute: schedule.minute,
        timezone: schedule.timezone || "Asia/Ho_Chi_Minh",
        updated_at: now,
      },
      { onConflict: "id" },
    )
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

function mergeRecipients(
  authUsers: Array<{ id: string; email: string; fullName: string }>,
  settings: Record<string, Record<string, unknown>>,
): NewsletterRecipient[] {
  return authUsers
    .filter((user) => user.email)
    .map((user) => {
      const setting = settings[user.id];
      return {
        id: setting?.id ? String(setting.id) : undefined,
        userId: user.id,
        email: user.email,
        fullName: String(setting?.full_name || user.fullName || user.email.split("@")[0] || ""),
        selected: Boolean(setting?.selected),
        wantsResources: Boolean(setting?.wants_resources),
        lastSentBatchKey: setting?.last_sent_batch_key ? String(setting.last_sent_batch_key) : null,
        lastSentAt: setting?.last_sent_at ? String(setting.last_sent_at) : null,
        createdAt: setting?.created_at ? String(setting.created_at) : undefined,
        updatedAt: setting?.updated_at ? String(setting.updated_at) : undefined,
      };
    });
}

async function upsertRecipientSetting(recipient: NewsletterRecipient) {
  const supabase = createAdminWriteClient();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("newsletter_recipients")
    .upsert(
      {
        user_id: recipient.userId,
        email: recipient.email,
        full_name: recipient.fullName,
        selected: recipient.selected,
        wants_resources: recipient.wantsResources,
        last_sent_batch_key: recipient.lastSentBatchKey || null,
        last_sent_at: recipient.lastSentAt || null,
        updated_at: now,
      },
      { onConflict: "user_id" },
    )
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

async function loadRecipientMap() {
  const settings = await listRecipientSettings();
  return settings.reduce<Record<string, Record<string, unknown>>>((acc, row) => {
    acc[String(row.user_id)] = row as Record<string, unknown>;
    return acc;
  }, {});
}

export async function GET(req: NextRequest) {
  try {
    if (!requireNewsletterAccess(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const [authUsers, recipientMap, content, schedule] = await Promise.all([
      listAuthUsers(),
      loadRecipientMap(),
      getNewsletterContent(),
      loadSchedule(),
    ]);

    const recipients = mergeRecipients(authUsers, recipientMap);
    return NextResponse.json({ recipients, content, schedule, batchKey: newsletterBatchKey() });
  } catch (err) {
    console.error("GET /api/newletters error:", err);
    return NextResponse.json({ error: "Failed to load newsletter data" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    if (!requireNewsletterAccess(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    if (body.schedule) {
      const nextSchedule = {
        ...getDefaultNewsletterSchedule(),
        ...body.schedule,
      } satisfies NewsletterSchedule;
      const updatedSchedule = await upsertSchedule(nextSchedule);
      return NextResponse.json({ schedule: updatedSchedule });
    }

    const userId = normalizeText(body.userId);
    const email = normalizeText(body.email);
    if (!userId || !email) {
      return NextResponse.json({ error: "Missing userId or email" }, { status: 400 });
    }

    const currentMap = await loadRecipientMap();
    const current = currentMap[userId] || {};
    const recipient: NewsletterRecipient = {
      userId,
      email,
      fullName: normalizeText(body.fullName) || String(current.full_name || ""),
      selected: body.selected !== undefined ? Boolean(body.selected) : Boolean(current.selected),
      wantsResources: body.wantsResources !== undefined ? Boolean(body.wantsResources) : Boolean(current.wants_resources),
      lastSentBatchKey:
        body.lastSentBatchKey !== undefined
          ? normalizeText(body.lastSentBatchKey) || null
          : (current.last_sent_batch_key ? String(current.last_sent_batch_key) : null),
      lastSentAt:
        body.lastSentAt !== undefined
          ? normalizeText(body.lastSentAt) || null
          : (current.last_sent_at ? String(current.last_sent_at) : null),
    };

    const updated = await upsertRecipientSetting(recipient);
    return NextResponse.json(updated);
  } catch (err) {
    console.error("PATCH /api/newletters error:", err);
    return NextResponse.json({ error: "Failed to update recipient" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!requireNewsletterAccess(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const recipientIds = Array.isArray(body.recipientIds)
      ? body.recipientIds.map((id: unknown) => normalizeText(id)).filter(Boolean)
      : [];

    const [authUsers, recipientMap, content] = await Promise.all([
      listAuthUsers(),
      loadRecipientMap(),
      getNewsletterContent(),
    ]);

    const recipients = mergeRecipients(authUsers, recipientMap)
      .filter((recipient) => recipient.selected && recipient.wantsResources)
      .filter((recipient) => recipientIds.length === 0 || recipientIds.includes(recipient.userId));

    if (recipients.length === 0) {
      return NextResponse.json({ error: "No recipients selected" }, { status: 400 });
    }

    const sent: string[] = [];
    const failed: Array<{ email: string; error: string }> = [];
    const batchKey = `manual-${Date.now()}`;
    const now = new Date().toISOString();

    for (const recipient of recipients) {
      try {
        await sendNewsletterMail(recipient.email, recipient.fullName, content);
        sent.push(recipient.email);
        await upsertRecipientSetting({
          ...recipient,
          lastSentBatchKey: batchKey,
          lastSentAt: now,
        });
      } catch (err) {
        failed.push({
          email: recipient.email,
          error: err instanceof Error ? err.message : "Send failed",
        });
      }
    }

    return NextResponse.json({ success: true, sent, failed, total: recipients.length });
  } catch (err) {
    console.error("POST /api/newletters error:", err);
    return NextResponse.json({ error: "Failed to send newsletters" }, { status: 500 });
  }
}
