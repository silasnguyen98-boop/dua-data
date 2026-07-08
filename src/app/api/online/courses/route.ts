import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";
import {
  normalizeCourseRows,
} from "@/lib/course-data";

export const dynamic = "force-dynamic";

const STUDENT_ACCESS_STATUSES = ["paid", "gifted", "onboarded"];
const ONLINE_COURSE_TYPES = ["e_learning"];

async function ensureElearningSchema() {
  await query("CREATE EXTENSION IF NOT EXISTS pgcrypto");

  await query(
    `CREATE TABLE IF NOT EXISTS course_modules (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      title text NOT NULL,
      description text NOT NULL DEFAULT '',
      order_index integer NOT NULL DEFAULT 0,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )`
  );

  await query(
    `CREATE TABLE IF NOT EXISTS course_lessons (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      module_id uuid NOT NULL REFERENCES course_modules(id) ON DELETE CASCADE,
      title text NOT NULL,
      description text NOT NULL DEFAULT '',
      youtube_id text NOT NULL DEFAULT '',
      duration_minutes integer NOT NULL DEFAULT 0,
      is_preview boolean NOT NULL DEFAULT false,
      order_index integer NOT NULL DEFAULT 0,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )`
  );

  await query(
    `CREATE TABLE IF NOT EXISTS user_progress (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id text NOT NULL,
      lesson_id uuid NOT NULL REFERENCES course_lessons(id) ON DELETE CASCADE,
      is_completed boolean NOT NULL DEFAULT false,
      completed_at timestamptz,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE(user_id, lesson_id)
    )`
  );

  await query("CREATE INDEX IF NOT EXISTS course_modules_course_order_idx ON course_modules (course_id, order_index)");
  await query("CREATE INDEX IF NOT EXISTS course_lessons_module_order_idx ON course_lessons (module_id, order_index)");
  await query("CREATE INDEX IF NOT EXISTS user_progress_user_lesson_idx ON user_progress (user_id, lesson_id)");

  try {
    await query(
      `ALTER TABLE courses
       ADD COLUMN IF NOT EXISTS class_materials jsonb NOT NULL DEFAULT '[]'::jsonb`
    );
  } catch (err) {
    const code = (err as { code?: string })?.code;
    if (code !== "42P01") throw err;
  }

  try {
    await query(
      `ALTER TABLE course_lessons
       ADD COLUMN IF NOT EXISTS lesson_type text NOT NULL DEFAULT 'video',
       ADD COLUMN IF NOT EXISTS text_content text NOT NULL DEFAULT '',
       ADD COLUMN IF NOT EXISTS resources jsonb NOT NULL DEFAULT '[]'::jsonb`
    );
  } catch (err) {
    const code = (err as { code?: string })?.code;
    if (code !== "42P01") throw err;
  }
}

type OnlineLesson = {
  id: string;
  title: string;
  description: string;
  lessonType: "text" | "video";
  textContent: string;
  youtubeId: string;
  resources: Array<{ title: string; description?: string; url: string; type?: string }>;
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
    await ensureElearningSchema();

    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Bạn cần đăng nhập để xem khóa học e-learning", loginUrl: "/login?next=/elearning" },
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
          l.lesson_type,
          l.text_content,
          l.resources,
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
        lessonType: (String(row.lesson_type || "").trim() || (String(row.youtube_id || "").trim() ? "video" : "text")) as OnlineLesson["lessonType"],
        textContent: String(row.text_content || ""),
        youtubeId: String(row.youtube_id || ""),
        resources: Array.isArray(row.resources) ? row.resources as OnlineLesson["resources"] : [],
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
    return NextResponse.json({ error: "Không thể tải khóa học e-learning" }, { status: 500 });
  }
}
