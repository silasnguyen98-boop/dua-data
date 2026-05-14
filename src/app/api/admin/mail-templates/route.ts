import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { listMailTemplates, upsertMailTemplate } from "@/lib/mail-template";

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

function requireMailTemplateAccess(req: NextRequest) {
  const role = getRoleFromHeader(req);
  return Boolean(role && ALLOWED_ROLES.has(role));
}

export async function GET(req: NextRequest) {
  try {
    if (!requireMailTemplateAccess(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { rows: courses } = await query(
      "SELECT id, title, slug, course_type, price, hide_price FROM courses ORDER BY created_at DESC"
    );

    return NextResponse.json({
      templates: await listMailTemplates(),
      courses: courses || [],
    });
  } catch (err) {
    console.error("GET /api/admin/mail-templates error:", err);
    return NextResponse.json({ error: "Failed to fetch mail templates" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!requireMailTemplateAccess(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const courseId = normalizeText(body.courseId);
    const subject = normalizeText(body.subject);
    const templateBody = normalizeText(body.body);
    const isActive = body.isActive === undefined ? true : Boolean(body.isActive);

    if (!courseId || !subject || !templateBody) {
      return NextResponse.json({ error: "Vui lòng nhập đủ thông tin template" }, { status: 400 });
    }

    const saved = await upsertMailTemplate({
      id: normalizeText(body.id) || undefined,
      courseId,
      subject,
      body: templateBody,
      isActive,
    });

    return NextResponse.json({ success: true, template: saved });
  } catch (err) {
    console.error("POST /api/admin/mail-templates error:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed to save template" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    if (!requireMailTemplateAccess(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const id = normalizeText(body.id);
    
    await query(
      "UPDATE course_mail_templates SET is_active = $1, updated_at = now() WHERE id = $2",
      [body.isActive === undefined ? true : Boolean(body.isActive), id]
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("PATCH /api/admin/mail-templates error:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed to update template" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    if (!requireMailTemplateAccess(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    await query("DELETE FROM course_mail_templates WHERE id = $1", [id]);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/admin/mail-templates error:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed to delete template" }, { status: 500 });
  }
}
