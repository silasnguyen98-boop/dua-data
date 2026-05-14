create schema if not exists auth;

create table if not exists auth.users (
  id text primary key,
  email text not null unique,
  name text not null,
  image text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists auth_users_email_idx on auth.users (email);
