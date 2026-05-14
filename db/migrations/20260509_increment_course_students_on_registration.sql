create or replace function public.increment_course_students_on_registration()
returns trigger
language plpgsql
as $$
begin
  update public.courses
  set students = coalesce(students, 0) + 1
  where id = new.course_id;

  return new;
end;
$$;

drop trigger if exists trg_increment_course_students_on_registration on public.course_registrations;

create trigger trg_increment_course_students_on_registration
after insert on public.course_registrations
for each row
execute function public.increment_course_students_on_registration();

