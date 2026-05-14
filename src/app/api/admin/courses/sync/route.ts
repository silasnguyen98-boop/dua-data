import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { normalizeCourseRows, groupCurriculumByCourseId } from "@/lib/course-data";
import fs from "fs/promises";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    // 1. Fetch all published courses with curriculum
    const [{ rows: courseRows }, { rows: curriculumRows }] = await Promise.all([
      query("SELECT * FROM courses WHERE published = true ORDER BY start_date DESC"),
      query("SELECT * FROM course_curriculum ORDER BY sort_order ASC"),
    ]);

    const courses = normalizeCourseRows(
      (courseRows || []) as Record<string, unknown>[], 
      groupCurriculumByCourseId((curriculumRows || []) as Record<string, unknown>[])
    );

    // 2. Define path for static JSON data
    // We'll store it in a directory that's accessible but not necessarily public if we want to control it via API
    // Actually, storing it in src/data or similar is good. 
    // For Vercel/Next.js, writing to filesystem at runtime is limited to /tmp, 
    // but if this is a local/self-hosted setup or we want to use it as a cache, we can use a specific path.
    // However, a better approach for Next.js is to save it to a database field or a KV store if on Vercel.
    // BUT since the user asked for "json file", I'll use a local path within the project.
    
    const dataDir = path.join(process.cwd(), "src/data");
    const filePath = path.join(dataDir, "courses.json");

    // Ensure directory exists
    await fs.mkdir(dataDir, { recursive: true });

    // 3. Write to file
    await fs.writeFile(filePath, JSON.stringify(courses, null, 2), "utf-8");

    return NextResponse.json({ 
      success: true, 
      count: courses.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Sync error:", error);
    return NextResponse.json({ error: "Failed to sync data" }, { status: 500 });
  }
}
