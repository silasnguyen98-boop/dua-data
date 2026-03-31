import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { ref, get, set } from "firebase/database";
import fs from "fs";
import path from "path";

export async function POST() {
  try {
    // Check if courses already exist in Firebase
    const snapshot = await get(ref(db, "courses"));
    if (snapshot.exists()) {
      return NextResponse.json({ message: "Data already seeded", skipped: true });
    }

    // Read local courses.json
    const filePath = path.join(process.cwd(), "src", "data", "courses.json");
    const courses = JSON.parse(fs.readFileSync(filePath, "utf-8"));

    // Seed each course
    for (const course of courses) {
      await set(ref(db, `courses/${course.id}`), course);
    }

    // Read and seed students if they exist
    const studentsPath = path.join(process.cwd(), "src", "data", "students.json");
    try {
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
