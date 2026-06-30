import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

const PAID_ACCESS_STATUSES = new Set(["paid", "onboarded"]);

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ authenticated: false, registration: null, canLearn: false });
    }

    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get("courseId") || "";
    if (!courseId) {
      return NextResponse.json({ error: "Missing courseId" }, { status: 400 });
    }

    const { rows } = await query(
      `SELECT id, status, created_at, updated_at
       FROM course_registrations
       WHERE course_id::text = $1 AND user_id = $2
       ORDER BY created_at DESC
       LIMIT 1`,
      [courseId, session.user.id],
    );
    const row = rows[0] as Record<string, unknown> | undefined;
    const status = String(row?.status || "");

    return NextResponse.json({
      authenticated: true,
      registration: row ? {
        id: String(row.id || ""),
        status: status || "new",
        registeredAt: String(row.created_at || row.updated_at || ""),
      } : null,
      canLearn: PAID_ACCESS_STATUSES.has(status),
    });
  } catch (err) {
    console.error("GET /api/online/registration error:", err);
    return NextResponse.json({ error: "Không thể kiểm tra trạng thái đăng ký" }, { status: 500 });
  }
}
