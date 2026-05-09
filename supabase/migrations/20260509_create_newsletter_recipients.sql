create table if not exists public.newsletter_recipients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null default '',
  selected boolean not null default false,
  wants_resources boolean not null default false,
  last_sent_batch_key text,
  last_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists newsletter_recipients_selected_idx
  on public.newsletter_recipients (selected, wants_resources);

create index if not exists newsletter_recipients_last_sent_idx
  on public.newsletter_recipients (last_sent_at desc);
