alter table public.courses
  add column if not exists class_materials jsonb not null default '[]'::jsonb;

alter table public.course_lessons
  add column if not exists lesson_type text not null default 'video',
  add column if not exists text_content text not null default '',
  add column if not exists resources jsonb not null default '[]'::jsonb;

comment on column public.courses.class_materials is
  'E-learning class-level resources shown in the learning room.';

comment on column public.course_lessons.lesson_type is
  'E-learning lesson type. Supported app values: text, video.';
