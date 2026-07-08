import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

const STUDENT_ACCESS_STATUSES = ["paid", "gifted", "onboarded"];

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const lessonId = normalizeText(body.lessonId);
    const completed = body.completed !== false;

    if (!lessonId) {
      return NextResponse.json({ error: "Missing lessonId" }, { status: 400 });
    }

    const { rows: accessRows } = await query(
      `SELECT l.id
       FROM course_lessons l
       INNER JOIN course_modules m ON m.id = l.module_id
       INNER JOIN courses c ON c.id = m.course_id
       INNER JOIN course_registrations r ON r.course_id::text = c.id::text
       WHERE l.id = $1
         AND r.user_id = $2
         AND r.status = ANY($3::text[])
         AND c.course_type = ANY($4::text[])
       LIMIT 1`,
      [lessonId, session.user.id, STUDENT_ACCESS_STATUSES, ["e_learning"]],
    );

    if (!accessRows[0]) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    const { rows } = await query(
      `INSERT INTO user_progress (user_id, lesson_id, is_completed, completed_at, updated_at)
       VALUES ($1, $2, $3, CASE WHEN $3 THEN now() ELSE NULL END, now())
       ON CONFLICT (user_id, lesson_id) DO UPDATE SET
         is_completed = EXCLUDED.is_completed,
         completed_at = EXCLUDED.completed_at,
         updated_at = now()
       RETURNING lesson_id, is_completed, completed_at`,
      [session.user.id, lessonId, completed],
    );

    return NextResponse.json({
      lessonId: String(rows[0]?.lesson_id || lessonId),
      isCompleted: Boolean(rows[0]?.is_completed),
      completedAt: rows[0]?.completed_at || null,
    });
  } catch (err) {
    console.error("PATCH /api/online/progress error:", err);
    return NextResponse.json({ error: "Không thể cập nhật tiến độ học" }, { status: 500 });
  }
}
