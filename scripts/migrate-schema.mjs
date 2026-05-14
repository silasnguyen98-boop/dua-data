import pg from 'pg';
const { Client } = pg;

// Use the environment variable if available, otherwise fallback to the user-provided connection string
const connectionString = process.env.DATABASE_URL || "postgresql://duadata:DuaDataPg2026x9KpV4sR@160.191.50.13:5432/duadata";

async function runMigration() {
  const client = new Client({
    connectionString,
  });

  try {
    console.log("Connecting to PostgreSQL at 160.191.50.13...");
    await client.connect();
    console.log("✅ Connected to PostgreSQL");

    const sql = `
      CREATE EXTENSION IF NOT EXISTS pgcrypto;

      -- Courses Table
      CREATE TABLE IF NOT EXISTS public.courses (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        slug text UNIQUE NOT NULL,
        title text NOT NULL,
        short_description text,
        description text,
        image text,
        image_url text,
        instructor text DEFAULT 'Đội Ngũ DUA Edu',
        price numeric DEFAULT 0,
        original_price numeric DEFAULT 0,
        discount numeric DEFAULT 0,
        total_lessons integer DEFAULT 0,
        students integer DEFAULT 0,
        rating numeric DEFAULT 0,
        reviews integer DEFAULT 0,
        start_date timestamptz,
        end_date timestamptz,
        registration_deadline timestamptz,
        schedule text,
        hours text,
        category text,
        course_type text,
        published boolean DEFAULT false,
        coming_soon boolean DEFAULT false,
        is_hidden boolean DEFAULT false,
        hide_price boolean DEFAULT false,
        curriculum jsonb,
        outcomes jsonb,
        target_audience jsonb,
        wait_list jsonb,
        firebase_id text,
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
      );

      -- Course Curriculum Table
      CREATE TABLE IF NOT EXISTS public.course_curriculum (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE,
        title text NOT NULL,
        description text,
        sort_order integer DEFAULT 0,
        lessons jsonb,
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
      );

      -- Course Registrations Table
      CREATE TABLE IF NOT EXISTS public.course_registrations (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        course_id text NOT NULL,
        user_id text NOT NULL,
        full_name text NOT NULL,
        email text NOT NULL,
        phone text NOT NULL,
        facebook text DEFAULT '',
        note text DEFAULT '',
        learner_group smallint DEFAULT 0,
        status text DEFAULT 'pending',
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now(),
        source text DEFAULT 'course_registration'
      );

      -- Newsletter Recipients Table
      CREATE TABLE IF NOT EXISTS public.newsletter_recipients (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL UNIQUE,
        email text NOT NULL,
        full_name text DEFAULT '',
        selected boolean DEFAULT false,
        wants_resources boolean DEFAULT false,
        last_sent_batch_key text,
        last_sent_at timestamptz,
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
      );

      -- Newsletter Settings Table
      CREATE TABLE IF NOT EXISTS public.newsletter_settings (
        id smallint PRIMARY KEY DEFAULT 1,
        enabled boolean DEFAULT true,
        day_of_week smallint DEFAULT 6,
        hour smallint DEFAULT 7,
        minute smallint DEFAULT 0,
        timezone text DEFAULT 'Asia/Ho_Chi_Minh',
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now(),
        CONSTRAINT newsletter_settings_singleton CHECK (id = 1)
      );

      -- Mail Logs Table
      CREATE TABLE IF NOT EXISTS public.mail_logs (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        registration_id uuid,
        recipient_email text NOT NULL,
        mail_type text NOT NULL,
        subject text NOT NULL,
        status text DEFAULT 'pending',
        error_message text,
        sent_at timestamptz,
        body text,
        created_at timestamptz DEFAULT now()
      );

      -- Experts Table
      CREATE TABLE IF NOT EXISTS public.experts (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name text NOT NULL,
        position text,
        previous_work text,
        avatar_url text,
        linkedin text,
        display_order integer DEFAULT 0,
        published boolean DEFAULT false,
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
      );

      -- Course Mail Templates Table
      CREATE TABLE IF NOT EXISTS public.course_mail_templates (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE,
        subject text NOT NULL,
        body text NOT NULL,
        is_active boolean DEFAULT true,
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
      );
    `;

    await client.query(sql);
    console.log("✅ Schema migration successful!");

    // Fix nullability for courses table (ensuring it matches Supabase's more relaxed schema)
    const fixNullabilitySql = `
      DO $$
      BEGIN
        ALTER TABLE public.courses ALTER COLUMN short_description DROP NOT NULL;
        ALTER TABLE public.courses ALTER COLUMN description DROP NOT NULL;
        ALTER TABLE public.courses ALTER COLUMN image DROP NOT NULL;
        ALTER TABLE public.courses ALTER COLUMN image_url DROP NOT NULL;
        ALTER TABLE public.courses ALTER COLUMN instructor DROP NOT NULL;
        ALTER TABLE public.courses ALTER COLUMN start_date DROP NOT NULL;
        ALTER TABLE public.courses ALTER COLUMN end_date DROP NOT NULL;
        ALTER TABLE public.courses ALTER COLUMN schedule DROP NOT NULL;
        ALTER TABLE public.courses ALTER COLUMN hours DROP NOT NULL;
        ALTER TABLE public.courses ALTER COLUMN category DROP NOT NULL;
        ALTER TABLE public.courses ALTER COLUMN course_type DROP NOT NULL;

        -- Add missing column if not exists
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='courses' AND column_name='registration_deadline') THEN
          ALTER TABLE public.courses ADD COLUMN registration_deadline timestamptz;
        END IF;
      END $$;
    `;
    await client.query(fixNullabilitySql);
    console.log("✅ Fixed column nullability and missing columns");

    // Seed newsletter settings if not exists
    await client.query(`
      INSERT INTO public.newsletter_settings (id)
      VALUES (1)
      ON CONFLICT (id) DO NOTHING;
    `);
    console.log("✅ Seeded newsletter_settings");

  } catch (err) {
    console.error("❌ Migration error:", err);
  } finally {
    await client.end();
  }
}

runMigration();
