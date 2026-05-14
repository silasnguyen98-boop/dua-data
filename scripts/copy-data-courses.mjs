import pg from 'pg';
import { createClient } from "@supabase/supabase-js";
import fs from 'fs';
import path from 'path';

const { Client } = pg;

// Simple .env.local loader
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    if (line && !line.startsWith('#')) {
      const [key, ...value] = line.split('=');
      if (key && value) {
        process.env[key.trim()] = value.join('=').trim().replace(/^["']|["']$/g, '');
      }
    }
  });
}

const pgConnectionString = process.env.DATABASE_URL || "postgresql://duadata:DuaDataPg2026x9KpV4sR@160.191.50.13:5432/duadata";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function copyCourses() {
  const pgClient = new Client({ connectionString: pgConnectionString });
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    await pgClient.connect();
    console.log("Connected to PostgreSQL");

    console.log("Fetching courses from Supabase...");
    const { data: courses, error: courseError } = await supabase.from('courses').select('*');
    if (courseError) throw courseError;
    console.log(`Found ${courses.length} courses in Supabase`);

    for (const course of courses) {
      console.log(`Copying course: ${course.title} (${course.slug})`);
      
      const columns = Object.keys(course);
      const values = Object.values(course).map(val => {
        if (val !== null && typeof val === 'object') {
          return JSON.stringify(val);
        }
        return val;
      });
      const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
      
      await pgClient.query(
        `INSERT INTO public.courses (${columns.join(', ')}) VALUES (${placeholders}) ON CONFLICT (slug) DO UPDATE SET ${columns.map(c => `${c} = EXCLUDED.${c}`).join(', ')}`,
        values
      );

      // Copy curriculum for this course
      const { data: curriculum, error: currError } = await supabase.from('course_curriculum').select('*').eq('course_id', course.id);
      if (currError) throw currError;
      
      if (curriculum && curriculum.length > 0) {
        console.log(`  Copying ${curriculum.length} curriculum items...`);
        for (const item of curriculum) {
          const currColumns = Object.keys(item);
          const currValues = Object.values(item).map(val => {
            if (val !== null && typeof val === 'object') {
              return JSON.stringify(val);
            }
            return val;
          });
          const currPlaceholders = currValues.map((_, i) => `$${i + 1}`).join(', ');
          
          await pgClient.query(
            `INSERT INTO public.course_curriculum (${currColumns.join(', ')}) VALUES (${currPlaceholders}) ON CONFLICT (id) DO UPDATE SET ${currColumns.map(c => `${c} = EXCLUDED.${c}`).join(', ')}`,
            currValues
          );
        }
      }
    }

    console.log("✅ Courses and Curriculum copied successfully!");

  } catch (err) {
    console.error("❌ Data copy error:", err);
  } finally {
    await pgClient.end();
  }
}

copyCourses();
