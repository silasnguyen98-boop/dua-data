create extension if not exists pgcrypto;

create table if not exists public.course_modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  description text not null default '',
  order_index integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.course_lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.course_modules(id) on delete cascade,
  title text not null,
  description text not null default '',
  youtube_id text not null default '',
  duration_minutes integer not null default 0,
  is_preview boolean not null default false,
  order_index integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_progress (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  lesson_id uuid not null references public.course_lessons(id) on delete cascade,
  is_completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, lesson_id)
);

create index if not exists course_modules_course_order_idx
  on public.course_modules (course_id, order_index);

create index if not exists course_lessons_module_order_idx
  on public.course_lessons (module_id, order_index);

create index if not exists user_progress_user_lesson_idx
  on public.user_progress (user_id, lesson_id);
