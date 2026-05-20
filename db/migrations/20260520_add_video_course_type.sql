alter table public.courses
  alter column course_type set default 'online';

comment on column public.courses.course_type is
  'Course delivery type. Supported app values include online, offline, e_learning, self_study, and video.';

create index if not exists courses_course_type_idx
  on public.courses (course_type);

create index if not exists course_registrations_user_status_idx
  on public.course_registrations (user_id, status);
