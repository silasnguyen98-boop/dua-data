import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { buildCoursePayload, buildCurriculumPayload, groupCurriculumByCourseId, normalizeCourseRow, normalizeCourseRows, normalizeCurriculumRows } from "@/lib/course-data";
import { Course, OnlineModule } from "@/types/course";

export const dynamic = "force-dynamic";

import fs from "fs/promises";
import path from "path";

async function readCourses(slug?: string): Promise<Course | Course[] | null> {
  const publicCourseColumns = "id, slug, title, short_description, image, image_url, instructor, price, original_price, discount, total_lessons, students, rating, reviews, start_date, end_date, registration_deadline, schedule, hours, category, course_type, published, coming_soon, is_hidden, hide_price, class_materials, created_at, updated_at";

  try {
    const courses = await readCoursesFromDb(publicCourseColumns, slug);
    if (slug) {
      if (courses) return courses;
    } else if (Array.isArray(courses) && courses.length > 0) {
      return courses;
    }
  } catch (err) {
    console.error("DB course read failed, falling back to JSON:", err);
  }

  try {
    const filePath = path.join(process.cwd(), "src/data/courses.json");
    const stats = await fs.stat(filePath);
    if (stats.isFile()) {
      const data = await fs.readFile(filePath, "utf-8");
      const courses = JSON.parse(data) as Course[];
      return slug ? courses.find(c => c.slug === slug) || null : courses;
    }
  } catch (err) {
    console.error("JSON course read failed:", err);
  }

  return slug ? null : [];
}

async function readCoursesFromDb(publicCourseColumns: string, slug?: string): Promise<Course | Course[] | null> {
  const columns = await getAvailableCourseColumns(publicCourseColumns);

  if (slug) {
    const { rows: courseRows } = await query(`SELECT ${columns} FROM courses WHERE slug = $1 LIMIT 1`, [slug]);
    if (!courseRows || courseRows.length === 0) return null;

    const courseId = String((courseRows[0] as Record<string, unknown>).id || "");
    const [{ rows: curriculumRows }, modulesByCourseId] = await Promise.all([
      query("SELECT * FROM course_curriculum WHERE course_id = $1 ORDER BY sort_order ASC", [courseId]),
      loadOnlineModules([courseId]),
    ]);

    return {
      ...normalizeCourseRow(courseRows[0] as Record<string, unknown>, normalizeCurriculumRows((curriculumRows || []) as Record<string, unknown>[])),
      onlineModules: modulesByCourseId.get(courseId) || [],
    };
  }

  const { rows: courseRows } = await query(`SELECT ${columns} FROM courses WHERE published = true AND coalesce(is_hidden, false) = false ORDER BY start_date DESC`);
  const courseIds = (courseRows || []).map((row) => String((row as Record<string, unknown>).id || "")).filter(Boolean);
  if (courseIds.length === 0) return [];

  const [{ rows: curriculumRows }, modulesByCourseId] = await Promise.all([
    query("SELECT * FROM course_curriculum WHERE course_id = ANY($1::uuid[]) ORDER BY sort_order ASC", [courseIds]),
    loadOnlineModules(courseIds),
  ]);

  return normalizeCourseRows(
    (courseRows || []) as Record<string, unknown>[],
    groupCurriculumByCourseId((curriculumRows || []) as Record<string, unknown>[]),
  ).map((course) => ({
    ...course,
    onlineModules: modulesByCourseId.get(course.id) || [],
  }));
}

async function getAvailableCourseColumns(columns: string) {
  try {
    await query(`SELECT ${columns} FROM courses LIMIT 1`);
    return columns;
  } catch (err) {
    const code = (err as { code?: string })?.code;
    if (code !== "42703") throw err;
    return columns.replace(", class_materials", "");
  }
}

async function loadOnlineModules(courseIds: string[]) {
  const modulesByCourseId = new Map<string, OnlineModule[]>();
  if (courseIds.length === 0) return modulesByCourseId;

  try {
    const [{ rows: moduleRows }, { rows: lessonRows }] = await Promise.all([
      query(
        `SELECT id, course_id, title, description, order_index
         FROM course_modules
         WHERE course_id = ANY($1::uuid[])
         ORDER BY course_id ASC, order_index ASC, created_at ASC`,
        [courseIds],
      ),
      query(
        `SELECT l.id, l.module_id, l.title, l.description, l.youtube_id, l.duration_minutes, l.is_preview, l.order_index, l.lesson_type, l.text_content, l.resources
         FROM course_lessons l
         INNER JOIN course_modules m ON m.id = l.module_id
         WHERE m.course_id = ANY($1::uuid[])
         ORDER BY m.course_id ASC, m.order_index ASC, l.order_index ASC, l.created_at ASC`,
        [courseIds],
      ),
    ]);

    const lessonsByModuleId = new Map<string, OnlineModule["lessons"]>();
    for (const row of (lessonRows || []) as Record<string, unknown>[]) {
      const moduleId = String(row.module_id || "");
      const lessons = lessonsByModuleId.get(moduleId) || [];
      lessons.push({
        id: String(row.id || ""),
        title: String(row.title || ""),
        description: String(row.description || ""),
        lessonType: (String(row.lesson_type || "").trim() || (String(row.youtube_id || "").trim() ? "video" : "text")) as OnlineModule["lessons"][number]["lessonType"],
        textContent: String(row.text_content || ""),
        youtubeId: String(row.youtube_id || ""),
        resources: Array.isArray(row.resources) ? row.resources as OnlineModule["lessons"][number]["resources"] : [],
        durationMinutes: Number(row.duration_minutes || 0),
        isPreview: Boolean(row.is_preview),
        orderIndex: Number(row.order_index || 0),
      });
      lessonsByModuleId.set(moduleId, lessons);
    }

    for (const row of (moduleRows || []) as Record<string, unknown>[]) {
      const courseId = String(row.course_id || "");
      const moduleId = String(row.id || "");
      const modules = modulesByCourseId.get(courseId) || [];
      modules.push({
        id: moduleId,
        title: String(row.title || ""),
        description: String(row.description || ""),
        orderIndex: Number(row.order_index || 0),
        lessons: lessonsByModuleId.get(moduleId) || [],
      });
      modulesByCourseId.set(courseId, modules);
    }
  } catch (err) {
    const code = (err as { code?: string })?.code;
    if (code === "42P01") return modulesByCourseId;
    if (code !== "42703") throw err;
    return modulesByCourseId;
  }

  return modulesByCourseId;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug") || undefined;
    const course = await readCourses(slug);

    if (slug && !course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    return NextResponse.json(course, {
      headers: {
        "Cache-Control": slug
          ? "public, max-age=0, s-maxage=300, stale-while-revalidate=600"
          : "public, max-age=0, s-maxage=600, stale-while-revalidate=1200",
      },
    });
  } catch (error) {
    console.error("Error fetching courses:", error);
    return NextResponse.json({ error: "Failed to fetch courses" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const curriculum = Array.isArray(body.curriculum) ? body.curriculum : [];
    const payload = buildCoursePayload(body);
    const columns = Object.keys(payload);
    const values = Object.values(payload);
    const placeholders = values.map((_, i) => `$${i + 1}`).join(", ");

    const { rows } = await query(
      `INSERT INTO courses (${columns.join(", ")}) VALUES (${placeholders}) RETURNING *`,
      values
    );

    const data = rows[0];
    const courseId = (data as Record<string, unknown>).id as string;
    
    if (courseId && curriculum.length > 0) {
      const curriculumRows = buildCurriculumPayload(courseId, curriculum);
      for (const currRow of curriculumRows) {
        const currCols = Object.keys(currRow);
        const currVals = Object.values(currRow);
        const currPlaceholders = currVals.map((_, i) => `$${i + 1}`).join(", ");
        await query(
          `INSERT INTO course_curriculum (${currCols.join(", ")}) VALUES (${currPlaceholders})`,
          currVals
        );
      }
    }

    return NextResponse.json(normalizeCourseRow(data as Record<string, unknown>, curriculum), { status: 201 });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const { rows: existingCourseRows } = await query("SELECT * FROM courses WHERE id = $1", [id]);
    const existingCourseRow = existingCourseRows[0];

    if (!existingCourseRow) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const { rows: existingCurriculumRows } = await query(
      "SELECT * FROM course_curriculum WHERE course_id = $1 ORDER BY sort_order ASC",
      [id]
    );

    const existingCurriculum = normalizeCurriculumRows((existingCurriculumRows || []) as Record<string, unknown>[]);
    const mergedCourse = {
      ...normalizeCourseRow(existingCourseRow as Record<string, unknown>, existingCurriculum),
      ...data,
      firebase_id: (existingCourseRow as Record<string, unknown>).firebase_id,
    };
    const curriculum = Object.prototype.hasOwnProperty.call(data, "curriculum") && Array.isArray(data.curriculum)
      ? data.curriculum
      : existingCurriculum;

    const payload = buildCoursePayload(mergedCourse, false);
    const columns = Object.keys(payload);
    const values = Object.values(payload);
    const setClause = columns.map((col, i) => `${col} = $${i + 2}`).join(", ");

    const { rows: updatedRows } = await query(
      `UPDATE courses SET ${setClause}, updated_at = now() WHERE id = $1 RETURNING *`,
      [id, ...values]
    );

    const updated = updatedRows[0];

    if (Object.prototype.hasOwnProperty.call(data, "curriculum")) {
      await query("DELETE FROM course_curriculum WHERE course_id = $1", [id]);
      
      const curriculumRows = buildCurriculumPayload(id, curriculum);
      for (const currRow of curriculumRows) {
        const currCols = Object.keys(currRow);
        const currVals = Object.values(currRow);
        const currPlaceholders = currVals.map((_, i) => `$${i + 1}`).join(", ");
        await query(
          `INSERT INTO course_curriculum (${currCols.join(", ")}) VALUES (${currPlaceholders})`,
          currVals
        );
      }
    }

    return NextResponse.json(normalizeCourseRow(updated as Record<string, unknown>, curriculum));
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    // Cascading delete should handle curriculum if set up in DB, but we do it manually just in case
    await query("DELETE FROM course_curriculum WHERE course_id = $1", [id]);
    await query("DELETE FROM courses WHERE id = $1", [id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
