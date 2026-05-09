import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { buildCoursePayload, buildCurriculumPayload } from "@/lib/course-data";
import fs from "fs";
import path from "path";

export async function POST() {
  try {
    const supabase = createAdminClient();

    // Check if courses already exist in Supabase
    const { data: existingCourses, error: existingError } = await supabase
      .from("courses")
      .select("id")
      .limit(1);

    if (existingError) {
      return NextResponse.json({ error: existingError.message }, { status: 500 });
    }

    if (existingCourses && existingCourses.length > 0) {
      return NextResponse.json({ message: "Data already seeded", skipped: true });
    }

    // Read local courses.json
    const filePath = path.join(process.cwd(), "src", "data", "courses.json");
    const courses = JSON.parse(fs.readFileSync(filePath, "utf-8"));

    const payloads = courses.map((course: Record<string, unknown>) => buildCoursePayload(course));
    const { data: insertedCourses, error: insertError } = await supabase.from("courses").insert(payloads).select("id");

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    const curriculumRows = courses.flatMap((course: Record<string, unknown>, index: number) => {
      const insertedCourse = insertedCourses?.[index] as Record<string, unknown> | undefined;
      const courseId = insertedCourse?.id as string | undefined;
      const curriculum = Array.isArray((course as Record<string, unknown>).curriculum)
        ? ((course as Record<string, unknown>).curriculum as any)
        : [];
      return courseId ? buildCurriculumPayload(courseId, curriculum) : [];
    });

    if (curriculumRows.length > 0) {
      const { error: curriculumError } = await supabase.from("course_curriculum").insert(curriculumRows);
      if (curriculumError) {
        return NextResponse.json({ error: curriculumError.message }, { status: 500 });
      }
    }

    // Read and seed students if they exist
    const studentsPath = path.join(process.cwd(), "src", "data", "students.json");
    try {
      const { db } = await import("@/lib/firebase");
      const { set, ref } = await import("firebase/database");
      const students = JSON.parse(fs.readFileSync(studentsPath, "utf-8"));
      for (const student of students) {
        await set(ref(db, `students/${student.id}`), student);
      }
    } catch {
      // No students file, skip
    }

    return NextResponse.json({ message: "Seeded successfully", count: courses.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
