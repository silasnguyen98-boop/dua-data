import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { buildCoursePayload, buildCurriculumPayload, groupCurriculumByCourseId, normalizeCourseRow, normalizeCourseRows, normalizeCurriculumRows } from "@/lib/course-data";
import type { OnlineModule } from "@/types/course";

export const dynamic = "force-dynamic";

const adminCourseColumns = "id, slug, title, short_description, image, image_url, instructor, price, original_price, discount, total_lessons, students, rating, reviews, start_date, end_date, registration_deadline, schedule, hours, category, course_type, published, coming_soon, is_hidden, hide_price, created_at, updated_at";

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
        `SELECT l.id, l.module_id, l.title, l.description, l.youtube_id, l.duration_minutes, l.is_preview, l.order_index
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
        youtubeId: String(row.youtube_id || ""),
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
    throw err;
  }

  return modulesByCourseId;
}

async function saveOnlineModules(courseId: string, modules: OnlineModule[]) {
  try {
    await query("DELETE FROM course_modules WHERE course_id = $1::uuid", [courseId]);
  } catch (err) {
    const code = (err as { code?: string })?.code;
    if (code === "42P01") return;
    throw err;
  }

  for (let moduleIndex = 0; moduleIndex < modules.length; moduleIndex += 1) {
    const module = modules[moduleIndex];
    const title = String(module.title || "").trim();
    if (!title) continue;

    const { rows } = await query(
      `INSERT INTO course_modules (course_id, title, description, order_index)
       VALUES ($1::uuid, $2, $3, $4)
       RETURNING id`,
      [
        courseId,
        title,
        String(module.description || "").trim(),
        Number.isFinite(Number(module.orderIndex)) ? Number(module.orderIndex) : moduleIndex + 1,
      ],
    );

    const moduleId = String(rows[0]?.id || "");
    if (!moduleId) continue;

    const lessons = Array.isArray(module.lessons) ? module.lessons : [];
    for (let lessonIndex = 0; lessonIndex < lessons.length; lessonIndex += 1) {
      const lesson = lessons[lessonIndex];
      const lessonTitle = String(lesson.title || "").trim();
      if (!lessonTitle) continue;

      await query(
        `INSERT INTO course_lessons (module_id, title, description, youtube_id, duration_minutes, is_preview, order_index)
         VALUES ($1::uuid, $2, $3, $4, $5, $6, $7)`,
        [
          moduleId,
          lessonTitle,
          String(lesson.description || "").trim(),
          String(lesson.youtubeId || "").trim(),
          Number(lesson.durationMinutes || 0),
          Boolean(lesson.isPreview),
          Number.isFinite(Number(lesson.orderIndex)) ? Number(lesson.orderIndex) : lessonIndex + 1,
        ],
      );
    }
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const includeCurriculum = searchParams.get("includeCurriculum") === "1";

    if (!includeCurriculum) {
      const { rows } = await query(
        `SELECT ${adminCourseColumns} FROM courses ORDER BY start_date DESC`
      );
      return NextResponse.json(normalizeCourseRows((rows || []) as Record<string, unknown>[]));
    }

    const [{ rows: courseRows }, { rows: curriculumRows }] = await Promise.all([
      query("SELECT * FROM courses ORDER BY start_date DESC"),
      query("SELECT * FROM course_curriculum ORDER BY sort_order ASC"),
    ]);

    const normalized = normalizeCourseRows(
      (courseRows || []) as Record<string, unknown>[],
      groupCurriculumByCourseId((curriculumRows || []) as Record<string, unknown>[]),
    );
    const onlineModulesByCourseId = await loadOnlineModules(normalized.map((course) => course.id));

    return NextResponse.json(
      normalized.map((course) => ({
        ...course,
        onlineModules: onlineModulesByCourseId.get(course.id) || [],
      })),
    );
  } catch (error) {
    console.error('Error fetching courses:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const curriculum = Array.isArray(body.curriculum) ? body.curriculum : [];
    const onlineModules = Array.isArray(body.onlineModules) ? body.onlineModules : [];
    const normalized = buildCoursePayload(body);
    const columns = Object.keys(normalized);
    const values = Object.values(normalized);
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

    if (courseId && onlineModules.length > 0) {
      await saveOnlineModules(courseId, onlineModules);
    }

    return NextResponse.json({
      ...normalizeCourseRow(data as Record<string, unknown>, curriculum),
      onlineModules,
    }, { status: 201 });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
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
    const curriculum = Object.prototype.hasOwnProperty.call(data, 'curriculum') && Array.isArray(data.curriculum)
      ? data.curriculum
      : existingCurriculum;
    const onlineModules = Object.prototype.hasOwnProperty.call(data, 'onlineModules') && Array.isArray(data.onlineModules)
      ? data.onlineModules
      : undefined;

    const payload = buildCoursePayload(mergedCourse, false);
    const columns = Object.keys(payload);
    const values = Object.values(payload);
    const setClause = columns.map((col, i) => `${col} = $${i + 2}`).join(", ");

    const { rows: updatedRows } = await query(
      `UPDATE courses SET ${setClause}, updated_at = now() WHERE id = $1 RETURNING *`,
      [id, ...values]
    );

    const updated = updatedRows[0];

    if (Object.prototype.hasOwnProperty.call(data, 'curriculum')) {
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

    if (onlineModules) {
      await saveOnlineModules(id, onlineModules);
    }

    if (!updated) {
      return NextResponse.json({ error: 'Course not found after update' }, { status: 404 });
    }

    return NextResponse.json({
      ...normalizeCourseRow(updated as Record<string, unknown>, curriculum),
      onlineModules: onlineModules || [],
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    await query("DELETE FROM course_curriculum WHERE course_id = $1", [id]);
    try {
      await query("DELETE FROM course_modules WHERE course_id = $1::uuid", [id]);
    } catch (err) {
      const code = (err as { code?: string })?.code;
      if (code !== "42P01") throw err;
    }
    await query("DELETE FROM courses WHERE id = $1", [id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
