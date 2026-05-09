import { NextRequest, NextResponse } from "next/server";
import { createAdminWriteClient } from "@/lib/supabase-server";
import type { SaleRegistrationEntry, SaleRegistrationStatus } from "@/types/sale";

export const dynamic = "force-dynamic";

const VALID_STATUSES: SaleRegistrationStatus[] = ["new", "contacted", "consulting", "paid", "onboarded", "cancelled"];
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
  const supabase = createAdminWriteClient();
  const { data, error } = await supabase
    .from("courses")
    .select("id, slug, title, price")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return new Map(
    (data || []).map((course) => [
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

    const supabase = createAdminWriteClient();
    const [courseMeta, registrationsResult] = await Promise.all([
      loadCourseMeta(),
      supabase
        .from("course_registrations")
        .select("id, course_id, user_id, full_name, email, phone, facebook, note, learner_group, status, created_at, updated_at")
        .order("created_at", { ascending: false }),
    ]);

    if (registrationsResult.error) {
      console.error("GET /api/sale/registrations error:", registrationsResult.error);
      return NextResponse.json({ error: "Failed to fetch registrations" }, { status: 500 });
    }

    const rows = (registrationsResult.data || [])
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

    const updates: Record<string, unknown> = {};

    if (body.status !== undefined) {
      if (!isValidStatus(body.status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }
      updates.status = body.status;
    }

    if (body.fullName !== undefined) updates.full_name = normalizeText(body.fullName);
    if (body.phone !== undefined) updates.phone = normalizeText(body.phone);
    if (body.facebook !== undefined) updates.facebook = normalizeText(body.facebook);
    if (body.note !== undefined) updates.note = normalizeText(body.note);
    if (body.learnerGroup !== undefined) updates.learner_group = toNumber(body.learnerGroup);
    updates.updated_at = new Date().toISOString();

    const supabase = createAdminWriteClient();
    const { data, error } = await supabase
      .from("course_registrations")
      .update(updates)
      .eq("id", id)
      .select("id, course_id, user_id, full_name, email, phone, facebook, note, learner_group, status, created_at, updated_at")
      .maybeSingle();

    if (error) {
      console.error("PATCH /api/sale/registrations error:", error);
      return NextResponse.json(
        { error: error.message || "Failed to update registration", code: error.code || "", hint: error.hint || "" },
        { status: 500 },
      );
    }

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
