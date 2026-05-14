import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { buildCoursePayload, buildCurriculumPayload } from "@/lib/course-data";
import fs from "fs";
import path from "path";

export async function POST() {
  try {
    // Check if courses already exist in Postgres
    const { rows: existingCourses } = await query(
      "SELECT id FROM courses LIMIT 1"
    );

    if (existingCourses && existingCourses.length > 0) {
      return NextResponse.json({ message: "Data already seeded", skipped: true });
    }

    // Read local courses.json
    const filePath = path.join(process.cwd(), "src", "data", "courses.json");
    if (!fs.existsSync(filePath)) {
       return NextResponse.json({ message: "Seed file not found", skipped: true });
    }
    const courses = JSON.parse(fs.readFileSync(filePath, "utf-8"));

    for (const course of courses) {
      const normalized = buildCoursePayload(course);
      const columns = Object.keys(normalized);
      const values = Object.values(normalized);
      const placeholders = values.map((_, i) => `$${i + 1}`).join(", ");

      const { rows } = await query(
        `INSERT INTO courses (${columns.join(", ")}) VALUES (${placeholders}) RETURNING id`,
        values
      );

      const courseId = rows[0]?.id;
      const curriculum = Array.isArray(course.curriculum) ? course.curriculum : [];
      
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
    }

    // Read and seed students if they exist
    const studentsPath = path.join(process.cwd(), "src", "data", "students.json");
    if (fs.existsSync(studentsPath)) {
      try {
        const { db } = await import("@/lib/firebase");
        const { set, ref } = await import("firebase/database");
        const students = JSON.parse(fs.readFileSync(studentsPath, "utf-8"));
        for (const student of students) {
          await set(ref(db, `students/${student.id}`), student);
        }
      } catch (err) {
        console.error("Firebase seed failed:", err);
      }
    }

    return NextResponse.json({ message: "Seeded successfully", count: courses.length });
  } catch (err: any) {
    console.error("Seed error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
