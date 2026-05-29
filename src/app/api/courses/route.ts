import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { buildCoursePayload, buildCurriculumPayload, normalizeCourseRow, normalizeCourseRows, normalizeCurriculumRows } from "@/lib/course-data";
import { Course } from "@/types/course";

export const dynamic = "force-dynamic";

import fs from "fs/promises";
import path from "path";

async function readCourses(slug?: string): Promise<Course | Course[] | null> {
  const publicCourseColumns = "id, slug, title, short_description, image, image_url, instructor, price, original_price, discount, total_lessons, students, rating, reviews, start_date, end_date, registration_deadline, schedule, hours, category, course_type, published, coming_soon, is_hidden, hide_price, created_at, updated_at";

  // Try reading from synced JSON first
  try {
    const filePath = path.join(process.cwd(), "src/data/courses.json");
    // Check if file exists first to avoid potential long hangs in some environments
    const stats = await fs.stat(filePath);
    if (stats.isFile()) {
      const data = await fs.readFile(filePath, "utf-8");
      const courses = JSON.parse(data) as Course[];

      if (slug) {
        return courses.find(c => c.slug === slug) || null;
      }
      return courses;
    }
  } catch (err) {
    // Silent fail, fallback to DB
  }

  if (slug) {
    const { rows: courseRows } = await query("SELECT * FROM courses WHERE slug = $1 LIMIT 1", [slug]);
    if (!courseRows || courseRows.length === 0) return null;
    const course = courseRows[0] as Record<string, unknown>;
    const { rows: curriculumRows } = await query("SELECT * FROM course_curriculum WHERE course_id = $1 ORDER BY sort_order ASC", [course.id]);
    return normalizeCourseRow(course, normalizeCurriculumRows((curriculumRows || []) as Record<string, unknown>[]));
  }

  const { rows } = await query(`SELECT ${publicCourseColumns} FROM courses WHERE published = true ORDER BY start_date DESC`);
  return normalizeCourseRows((rows || []) as Record<string, unknown>[]);
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
