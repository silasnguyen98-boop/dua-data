import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { buildCoursePayload, buildCurriculumPayload, normalizeCourseRow, normalizeCourseRows, normalizeCurriculumRows } from "@/lib/course-data";
import { Course } from "@/types/course";

export const dynamic = "force-dynamic";

async function readCourses(slug?: string): Promise<Course | Course[] | null> {
  const supabase = createAdminClient();
  const publicCourseColumns = "id, slug, title, short_description, image, image_url, instructor, price, original_price, discount, total_lessons, students, rating, reviews, start_date, end_date, schedule, hours, category, course_type, published, coming_soon, is_hidden, hide_price, created_at, updated_at";

  if (slug) {
    const { data, error } = await supabase.from("courses").select("*").eq("slug", slug).limit(1);

    if (error) throw error;
    if (!data || data.length === 0) return null;
    const course = data[0] as Record<string, unknown>;
    const { data: curriculumRows, error: curriculumError } = await supabase
      .from("course_curriculum")
      .select("*")
      .eq("course_id", course.id as string)
      .order("sort_order", { ascending: true });

    if (curriculumError) throw curriculumError;
    return normalizeCourseRow(course, normalizeCurriculumRows((curriculumRows || []) as Record<string, unknown>[]));
  }

  const { data, error } = await supabase.from("courses").select(publicCourseColumns).order("start_date", { ascending: false });

  if (error) throw error;
  return normalizeCourseRows((data || []) as Record<string, unknown>[]);
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
    const supabase = createAdminClient();
    const body = await req.json();
    const curriculum = Array.isArray(body.curriculum) ? body.curriculum : [];
    const payload = buildCoursePayload(body);

    const { data, error } = await supabase
      .from("courses")
      .insert(payload)
      .select("*")
      .single();

    if (error) {
      console.error("Error creating course:", error);
      return NextResponse.json({ error: error.message || "Failed to create course" }, { status: 500 });
    }

    const courseId = (data as Record<string, unknown>).id as string;
    if (courseId && curriculum.length > 0) {
      const { error: curriculumError } = await supabase
        .from("course_curriculum")
        .insert(buildCurriculumPayload(courseId, curriculum));

      if (curriculumError) {
        console.error("Error creating curriculum:", curriculumError);
        return NextResponse.json({ error: curriculumError.message || "Failed to create curriculum" }, { status: 500 });
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
    const supabase = createAdminClient();
    const body = await req.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const { data: existingCourseRow, error: existingCourseError } = await supabase
      .from('courses')
      .select('*')
      .eq('id', id)
      .single();

    if (existingCourseError) {
      console.error("Error loading course before update:", existingCourseError);
      return NextResponse.json({ error: existingCourseError.message || "Failed to load course" }, { status: 500 });
    }

    const { data: existingCurriculumRows, error: existingCurriculumError } = await supabase
      .from('course_curriculum')
      .select('*')
      .eq('course_id', id)
      .order('sort_order', { ascending: true });

    if (existingCurriculumError) {
      console.error("Error loading curriculum before update:", existingCurriculumError);
      return NextResponse.json({ error: existingCurriculumError.message || "Failed to load curriculum" }, { status: 500 });
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

    const payload = buildCoursePayload(mergedCourse, false);
    const { data: updated, error } = await supabase
      .from("courses")
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      console.error("Error updating course:", error);
      return NextResponse.json({ error: error.message || "Failed to update course" }, { status: 500 });
    }

    if (Object.prototype.hasOwnProperty.call(data, 'curriculum')) {
      const { error: deleteCurriculumError } = await supabase
        .from("course_curriculum")
        .delete()
        .eq("course_id", id);

      if (deleteCurriculumError) {
        console.error("Error clearing curriculum:", deleteCurriculumError);
        return NextResponse.json({ error: deleteCurriculumError.message || "Failed to update curriculum" }, { status: 500 });
      }

      const { error: curriculumError } = await supabase
        .from("course_curriculum")
        .insert(buildCurriculumPayload(id, curriculum));

      if (curriculumError) {
        console.error("Error updating curriculum:", curriculumError);
        return NextResponse.json({ error: curriculumError.message || "Failed to update curriculum" }, { status: 500 });
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
    const supabase = createAdminClient();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const { error: curriculumError } = await supabase
      .from("course_curriculum")
      .delete()
      .eq("course_id", id);

    if (curriculumError) {
      console.error("Error deleting curriculum:", curriculumError);
      return NextResponse.json({ error: curriculumError.message || "Failed to delete curriculum" }, { status: 500 });
    }

    const { error } = await supabase.from("courses").delete().eq("id", id);

    if (error) {
      console.error("Error deleting course:", error);
      return NextResponse.json({ error: error.message || "Failed to delete course" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
