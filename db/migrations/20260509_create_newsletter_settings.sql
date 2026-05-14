create table if not exists public.newsletter_settings (
  id smallint primary key default 1,
  enabled boolean not null default true,
  day_of_week smallint not null default 6,
  hour smallint not null default 7,
  minute smallint not null default 0,
  timezone text not null default 'Asia/Ho_Chi_Minh',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint newsletter_settings_singleton check (id = 1)
);

insert into public.newsletter_settings (id)
values (1)
on conflict (id) do nothing;
