import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";
import {
  normalizeCourseRows,
} from "@/lib/course-data";

export const dynamic = "force-dynamic";

const STUDENT_ACCESS_STATUSES = ["onboarded"];
const ONLINE_COURSE_TYPES = ["video", "online", "e_learning"];

type OnlineLesson = {
  id: string;
  title: string;
  description: string;
  youtubeId: string;
  durationMinutes: number;
  isPreview: boolean;
  isCompleted: boolean;
  orderIndex: number;
};

type OnlineModule = {
  id: string;
  title: string;
  description: string;
  orderIndex: number;
  lessons: OnlineLesson[];
};

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Bạn cần đăng nhập để xem khóa học online", loginUrl: "/login?next=/online" },
        { status: 401 },
      );
    }

    const { rows: courseRows } = await query(
      `SELECT DISTINCT
        c.id,
        c.slug,
        c.title,
        c.short_description,
        c.description,
        c.image,
        c.image_url,
        c.instructor,
        c.price,
        c.original_price,
        c.discount,
        c.total_lessons,
        c.students,
        c.rating,
        c.reviews,
        c.start_date,
        c.end_date,
        c.schedule,
        c.hours,
        c.category,
        c.course_type,
        c.published,
        c.coming_soon,
        c.is_hidden,
        c.hide_price,
        c.created_at,
        c.updated_at
      FROM courses c
      INNER JOIN course_registrations r ON r.course_id::text = c.id::text
      WHERE r.user_id = $1
        AND r.status = ANY($2::text[])
        AND c.course_type = ANY($3::text[])
        AND c.published = true
        AND coalesce(c.is_hidden, false) = false
      ORDER BY c.created_at DESC`,
      [session.user.id, STUDENT_ACCESS_STATUSES, ONLINE_COURSE_TYPES],
    );

    if (!courseRows || courseRows.length === 0) {
      return NextResponse.json([]);
    }

    const courseIds = courseRows.map((row) => String((row as Record<string, unknown>).id));

    const [{ rows: moduleRows }, { rows: lessonRows }] = await Promise.all([
      query(
        `SELECT id, course_id, title, description, order_index
         FROM course_modules
         WHERE course_id = ANY($1::uuid[])
         ORDER BY course_id ASC, order_index ASC, created_at ASC`,
        [courseIds],
      ),
      query(
        `SELECT
          l.id,
          l.module_id,
          l.title,
          l.description,
          l.youtube_id,
          l.duration_minutes,
          l.is_preview,
          l.order_index,
          coalesce(p.is_completed, false) as is_completed
         FROM course_lessons l
         INNER JOIN course_modules m ON m.id = l.module_id
         LEFT JOIN user_progress p ON p.lesson_id = l.id AND p.user_id = $2
         WHERE m.course_id = ANY($1::uuid[])
         ORDER BY m.course_id ASC, m.order_index ASC, l.order_index ASC, l.created_at ASC`,
        [courseIds, session.user.id],
      ),
    ]);

    const lessonsByModuleId = new Map<string, OnlineLesson[]>();
    for (const row of (lessonRows || []) as Record<string, unknown>[]) {
      const moduleId = String(row.module_id || "");
      const lessons = lessonsByModuleId.get(moduleId) || [];
      lessons.push({
        id: String(row.id || ""),
        title: String(row.title || ""),
        description: String(row.description || ""),
        youtubeId: String(row.youtube_id || ""),
        durationMinutes: Number(row.duration_minutes || 0),
        isPreview: Boolean(row.is_preview),
        isCompleted: Boolean(row.is_completed),
        orderIndex: Number(row.order_index || 0),
      });
      lessonsByModuleId.set(moduleId, lessons);
    }

    const modulesByCourseId = new Map<string, OnlineModule[]>();
    for (const row of (moduleRows || []) as Record<string, unknown>[]) {
      const courseId = String(row.course_id || "");
      const modules = modulesByCourseId.get(courseId) || [];
      const moduleId = String(row.id || "");
      modules.push({
        id: moduleId,
        title: String(row.title || ""),
        description: String(row.description || ""),
        orderIndex: Number(row.order_index || 0),
        lessons: lessonsByModuleId.get(moduleId) || [],
      });
      modulesByCourseId.set(courseId, modules);
    }

    const courses = normalizeCourseRows(courseRows as Record<string, unknown>[]).map((course) =>
      ({
        ...course,
        onlineModules: modulesByCourseId.get(course.id) || [],
      })
    );

    return NextResponse.json(courses);
  } catch (err) {
    console.error("GET /api/online/courses error:", err);
    return NextResponse.json({ error: "Không thể tải khóa học online" }, { status: 500 });
  }
}
