import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import type { SaleRegistrationEntry, SaleRegistrationStatus } from "@/types/sale";

export const dynamic = "force-dynamic";

const VALID_STATUSES: SaleRegistrationStatus[] = ["new", "contacted", "consulting", "paid", "gifted", "onboarded", "cancelled"];
const ALLOWED_ROLES = new Set(["system_admin", "sales_executive"]);

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function toNumber(value: unknown) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function isValidStatus(value: unknown): value is SaleRegistrationStatus {
  return typeof value === "string" && VALID_STATUSES.includes(value as SaleRegistrationStatus);
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

function requireSaleAccess(req: NextRequest) {
  const role = getRoleFromHeader(req);
  if (!role || !ALLOWED_ROLES.has(role)) {
    return false;
  }
  return true;
}

function mapRegistration(
  row: Record<string, unknown>,
  courseMeta: { slug?: string; title?: string; price?: number } = {},
): SaleRegistrationEntry {
  return {
    id: String(row.id || ""),
    courseId: String(row.course_id || ""),
    courseSlug: String(courseMeta.slug || ""),
    courseTitle: String(courseMeta.title || row.course_id || ""),
    coursePrice: Number(courseMeta.price || 0),
    fullName: String(row.full_name || ""),
    email: String(row.email || ""),
    phone: String(row.phone || ""),
    facebook: String(row.facebook || ""),
    note: String(row.note || ""),
    learnerGroup: toNumber(row.learner_group),
    status: isValidStatus(row.status) ? row.status : "new",
    createdAt: String(row.created_at || ""),
    updatedAt: String(row.updated_at || ""),
    userId: String(row.user_id || ""),
  };
}

async function loadCourseMeta() {
  const { rows } = await query(
    "SELECT id, slug, title, price FROM courses ORDER BY created_at DESC"
  );

  return new Map(
    (rows || []).map((course) => [
      String(course.id),
      {
        slug: String((course as Record<string, unknown>).slug || ""),
        title: String((course as Record<string, unknown>).title || ""),
        price: Number((course as Record<string, unknown>).price || 0),
      },
    ]),
  );
}

export async function GET(req: NextRequest) {
  try {
    if (!requireSaleAccess(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const [courseMeta, { rows: registrationsRows }] = await Promise.all([
      loadCourseMeta(),
      query(
        "SELECT id, course_id, user_id, full_name, email, phone, facebook, note, learner_group, status, created_at, updated_at FROM course_registrations ORDER BY created_at DESC"
      ),
    ]);

    const rows = (registrationsRows || [])
      .map((row) => {
        const courseId = String((row as Record<string, unknown>).course_id || "");
        const meta = courseMeta.get(courseId);
        if (!meta || (meta.price || 0) <= 0) return null;
        return mapRegistration(row as Record<string, unknown>, meta);
      })
      .filter(Boolean) as SaleRegistrationEntry[];

    return NextResponse.json(rows);
  } catch (err) {
    console.error("GET /api/sale/registrations error:", err);
    return NextResponse.json({ error: "Failed to fetch registrations" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    if (!requireSaleAccess(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const id = normalizeText(body.id);
    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const updates: string[] = ["updated_at = $2"];
    const values: any[] = [id, new Date().toISOString()];

    if (body.status !== undefined) {
      if (!isValidStatus(body.status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }
      updates.push(`status = $${values.length + 1}`);
      values.push(body.status);
    }

    if (body.fullName !== undefined) {
      updates.push(`full_name = $${values.length + 1}`);
      values.push(normalizeText(body.fullName));
    }
    if (body.phone !== undefined) {
      updates.push(`phone = $${values.length + 1}`);
      values.push(normalizeText(body.phone));
    }
    if (body.facebook !== undefined) {
      updates.push(`facebook = $${values.length + 1}`);
      values.push(normalizeText(body.facebook));
    }
    if (body.note !== undefined) {
      updates.push(`note = $${values.length + 1}`);
      values.push(normalizeText(body.note));
    }
    if (body.learnerGroup !== undefined) {
      updates.push(`learner_group = $${values.length + 1}`);
      values.push(toNumber(body.learnerGroup));
    }

    const { rows: updatedRows } = await query(
      `UPDATE course_registrations SET ${updates.join(", ")} WHERE id = $1 RETURNING id, course_id, user_id, full_name, email, phone, facebook, note, learner_group, status, created_at, updated_at`,
      values
    );

    const data = updatedRows[0];

    if (!data) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 });
    }

    const courseMeta = await loadCourseMeta();
    const meta = courseMeta.get(String((data as Record<string, unknown>).course_id || ""));
    return NextResponse.json(mapRegistration(data as Record<string, unknown>, meta));
  } catch (err) {
    console.error("PATCH /api/sale/registrations error:", err);
    return NextResponse.json({ error: "Failed to update registration" }, { status: 500 });
  }
}
