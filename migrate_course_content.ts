import { Client } from "pg";
import * as fs from "fs";

async function checkSchema() {
  const envContent = fs.readFileSync(".env.local", "utf8");
  const dbUrl = envContent.match(/DATABASE_URL=(.*)/)?.[1]?.trim();

  const client = new Client({ connectionString: dbUrl });
  try {
    await client.connect();
    
    // Create new tables for the course viewer
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.course_modules (
        id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
        title text NOT NULL,
        description text NOT NULL DEFAULT '',
        order_index integer NOT NULL DEFAULT 0,
        created_at timestamptz NOT NULL DEFAULT NOW(),
        updated_at timestamptz NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS public.course_lessons (
        id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        module_id uuid NOT NULL REFERENCES public.course_modules(id) ON DELETE CASCADE,
        title text NOT NULL,
        description text NOT NULL DEFAULT '',
        youtube_id text NOT NULL DEFAULT '',
        duration_minutes integer NOT NULL DEFAULT 0,
        is_preview boolean NOT NULL DEFAULT false,
        order_index integer NOT NULL DEFAULT 0,
        created_at timestamptz NOT NULL DEFAULT NOW(),
        updated_at timestamptz NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS public.user_progress (
        id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id text NOT NULL,
        lesson_id uuid NOT NULL REFERENCES public.course_lessons(id) ON DELETE CASCADE,
        is_completed boolean NOT NULL DEFAULT false,
        completed_at timestamptz,
        created_at timestamptz NOT NULL DEFAULT NOW(),
        updated_at timestamptz NOT NULL DEFAULT NOW(),
        UNIQUE(user_id, lesson_id)
      );

      CREATE INDEX IF NOT EXISTS course_modules_course_order_idx
        ON public.course_modules (course_id, order_index);

      CREATE INDEX IF NOT EXISTS course_lessons_module_order_idx
        ON public.course_lessons (module_id, order_index);

      CREATE INDEX IF NOT EXISTS user_progress_user_lesson_idx
        ON public.user_progress (user_id, lesson_id);
    `);
    console.log("Created tables for modules, lessons, and progress.");
    await client.end();
  } catch (err) {
    console.error(err);
  }
}
checkSchema();
