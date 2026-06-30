import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { normalizeCourseRows, groupCurriculumByCourseId } from "@/lib/course-data";
import type { OnlineModule } from "@/types/course";
import fs from "fs/promises";
import path from "path";

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
    if (code === "42P01" || code === "42703") return modulesByCourseId;
    throw err;
  }

  return modulesByCourseId;
}

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

    if (courses.length === 0) {
      return NextResponse.json({
        success: false,
        count: 0,
        error: "Không có khóa published nào trong DB, bỏ qua đồng bộ JSON để tránh ghi rỗng.",
      }, { status: 409 });
    }

    const onlineModulesByCourseId = await loadOnlineModules(courses.map((course) => course.id));
    const coursesWithOnlineContent = courses.map((course) => ({
      ...course,
      onlineModules: onlineModulesByCourseId.get(course.id) || [],
    }));

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
    await fs.writeFile(filePath, JSON.stringify(coursesWithOnlineContent, null, 2), "utf-8");

    return NextResponse.json({ 
      success: true, 
      count: coursesWithOnlineContent.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Sync error:", error);
    return NextResponse.json({ error: "Failed to sync data" }, { status: 500 });
  }
}
