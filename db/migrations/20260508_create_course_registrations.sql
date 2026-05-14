create extension if not exists pgcrypto;

create table if not exists public.course_registrations (
  id uuid primary key default gen_random_uuid(),
  course_id text not null,
  user_id text not null,
  full_name text not null,
  email text not null,
  phone text not null,
  facebook text not null default '',
  note text not null default '',
  learner_group smallint not null default 0,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  source text not null default 'course_registration'
);

create unique index if not exists course_registrations_course_user_unique
  on public.course_registrations (course_id, user_id);

create index if not exists course_registrations_course_id_idx
  on public.course_registrations (course_id);

create index if not exists course_registrations_created_at_idx
  on public.course_registrations (created_at desc);
