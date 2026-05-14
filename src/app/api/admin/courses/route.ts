import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { buildCoursePayload, buildCurriculumPayload, groupCurriculumByCourseId, normalizeCourseRow, normalizeCourseRows, normalizeCurriculumRows } from "@/lib/course-data";

export const dynamic = "force-dynamic";

const adminCourseColumns = "id, slug, title, short_description, image, image_url, instructor, price, original_price, discount, total_lessons, students, rating, reviews, start_date, end_date, schedule, hours, category, course_type, published, coming_soon, is_hidden, hide_price, created_at, updated_at";

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

    return NextResponse.json(
      normalizeCourseRows((courseRows || []) as Record<string, unknown>[], groupCurriculumByCourseId((curriculumRows || []) as Record<string, unknown>[]))
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

    return NextResponse.json(normalizeCourseRow(data as Record<string, unknown>, curriculum), { status: 201 });
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

    if (!updated) {
      return NextResponse.json({ error: 'Course not found after update' }, { status: 404 });
    }

    return NextResponse.json(normalizeCourseRow(updated as Record<string, unknown>, curriculum));
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
