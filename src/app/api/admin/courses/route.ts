import { NextRequest, NextResponse } from "next/server";
import { createAdminWriteClient } from "@/lib/supabase-server";
import { buildCoursePayload, buildCurriculumPayload, groupCurriculumByCourseId, normalizeCourseRow, normalizeCourseRows, normalizeCurriculumRows } from "@/lib/course-data";

export const dynamic = "force-dynamic";

const adminCourseColumns = "id, slug, title, short_description, image, image_url, instructor, price, original_price, discount, total_lessons, students, rating, reviews, start_date, end_date, registration_deadline, schedule, hours, category, course_type, published, coming_soon, is_hidden, hide_price, created_at, updated_at";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const includeCurriculum = searchParams.get("includeCurriculum") === "1";
    const supabase = createAdminWriteClient();

    if (!includeCurriculum) {
      const { data, error } = await supabase
        .from('courses')
        .select(adminCourseColumns)
        .order('start_date', { ascending: false });

      if (error) {
        console.error('Error fetching courses:', error);
        return NextResponse.json(
          { error: error.message || 'Failed to fetch courses' },
          { status: 500 }
        );
      }

      return NextResponse.json(normalizeCourseRows((data || []) as Record<string, unknown>[]));
    }

    const [{ data, error }, { data: curriculumRows, error: curriculumError }] = await Promise.all([
      supabase.from('courses').select('*').order('start_date', { ascending: false }),
      supabase.from('course_curriculum').select('*').order('sort_order', { ascending: true }),
    ]);

    if (error) {
      console.error('Error fetching courses:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to fetch courses' },
        { status: 500 }
      );
    }

    if (curriculumError) {
      console.error('Error fetching curriculum:', curriculumError);
      return NextResponse.json(
        { error: curriculumError.message || 'Failed to fetch curriculum' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      normalizeCourseRows((data || []) as Record<string, unknown>[], groupCurriculumByCourseId((curriculumRows || []) as Record<string, unknown>[]))
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
    const supabase = createAdminWriteClient();
    const body = await req.json();
    const curriculum = Array.isArray(body.curriculum) ? body.curriculum : [];
    const normalized = buildCoursePayload(body);

    const { data, error } = await supabase
      .from('courses')
      .insert([normalized])
      .select('*')
      .single();

    if (error) {
      console.error('Error creating course:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to create course' },
        { status: 500 }
      );
    }

    const courseId = (data as Record<string, unknown>).id as string;
    if (courseId && curriculum.length > 0) {
      const { error: curriculumError } = await supabase
        .from('course_curriculum')
        .insert(buildCurriculumPayload(courseId, curriculum));

      if (curriculumError) {
        console.error('Error creating curriculum:', curriculumError);
        return NextResponse.json(
          { error: curriculumError.message || 'Failed to create curriculum' },
          { status: 500 }
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
    const supabase = createAdminWriteClient();
    const body = await req.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const { data: existingCourseRow, error: existingCourseError } = await supabase
      .from('courses')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (existingCourseError) {
      console.error('Error loading course before update:', existingCourseError);
      return NextResponse.json(
        { error: existingCourseError.message || 'Failed to load course' },
        { status: 500 }
      );
    }

    if (!existingCourseRow) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const { data: existingCurriculumRows, error: existingCurriculumError } = await supabase
      .from('course_curriculum')
      .select('*')
      .eq('course_id', id)
      .order('sort_order', { ascending: true });

    if (existingCurriculumError) {
      console.error('Error loading curriculum before update:', existingCurriculumError);
      return NextResponse.json(
        { error: existingCurriculumError.message || 'Failed to load curriculum' },
        { status: 500 }
      );
    }

    const existingCurriculum = normalizeCurriculumRows((existingCurriculumRows || []) as Record<string, unknown>[]);
    const mergedCourse = {
      ...normalizeCourseRow(existingCourseRow as Record<string, unknown>, existingCurriculum),
      ...data,
      firebase_id: (existingCourseRow as Record<string, unknown>).firebase_id,
    };
    const curriculum = Object.prototype.hasOwnProperty.call(data, 'curriculum') && Array.isArray(data.curriculum)
      ? data.curriculum
      : existingCurriculum;

    const updateData = {
      ...buildCoursePayload(mergedCourse, false),
      updated_at: new Date().toISOString(),
    };

    const { data: updatedRows, error } = await supabase
      .from('courses')
      .update(updateData)
      .eq('id', id)
      .select('*');

    if (error) {
      console.error('Error updating course:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to update course' },
        { status: 500 }
      );
    }

    if (Object.prototype.hasOwnProperty.call(data, 'curriculum')) {
      const { error: deleteCurriculumError } = await supabase
        .from('course_curriculum')
        .delete()
        .eq('course_id', id);

      if (deleteCurriculumError) {
        console.error('Error clearing curriculum:', deleteCurriculumError);
        return NextResponse.json(
          { error: deleteCurriculumError.message || 'Failed to update curriculum' },
          { status: 500 }
        );
      }

      const { error: curriculumError } = await supabase
        .from('course_curriculum')
        .insert(buildCurriculumPayload(id, curriculum));

      if (curriculumError) {
        console.error('Error updating curriculum:', curriculumError);
        return NextResponse.json(
          { error: curriculumError.message || 'Failed to update curriculum' },
          { status: 500 }
        );
      }
    }

    const updated = Array.isArray(updatedRows) ? updatedRows[0] : null;
    if (!updated) {
      const { data: fallbackRow, error: fallbackError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (fallbackError) {
        console.error('Error reloading updated course:', fallbackError);
        return NextResponse.json(
          { error: fallbackError.message || 'Failed to load updated course' },
          { status: 500 }
        );
      }

      if (!fallbackRow) {
        return NextResponse.json({ error: 'Course not found after update' }, { status: 404 });
      }

      return NextResponse.json(normalizeCourseRow(fallbackRow as Record<string, unknown>, curriculum));
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
    const supabase = createAdminWriteClient();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const { error: deleteCurriculumError } = await supabase
      .from('course_curriculum')
      .delete()
      .eq('course_id', id);

    if (deleteCurriculumError) {
      console.error('Error deleting curriculum:', deleteCurriculumError);
      return NextResponse.json(
        { error: deleteCurriculumError.message || 'Failed to delete curriculum' },
        { status: 500 }
      );
    }

    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting course:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to delete course' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
