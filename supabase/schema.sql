-- Habit Tracker Supabase schema
-- Run in Supabase SQL editor.

create extension if not exists pgcrypto;

create table if not exists public.habits (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  frequency text not null,
  color text not null,
  tracking_mode text not null check (tracking_mode in ('binary', 'multiple')),
  daily_target integer not null check (daily_target >= 1),
  completion_rule text not null check (completion_rule in ('any', 'goal', 'weighted')),
  measurement text not null,
  history jsonb not null default '{}'::jsonb,
  done_today boolean not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists public.settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  theme text not null check (theme in ('light', 'dark', 'system')),
  push boolean not null default true,
  email boolean not null default false,
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists habits_set_updated_at on public.habits;
create trigger habits_set_updated_at
before update on public.habits
for each row
execute function public.set_updated_at();

drop trigger if exists settings_set_updated_at on public.settings;
create trigger settings_set_updated_at
before update on public.settings
for each row
execute function public.set_updated_at();

alter table public.habits enable row level security;
alter table public.settings enable row level security;

drop policy if exists habits_owner_all on public.habits;
create policy habits_owner_all
on public.habits
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists settings_owner_all on public.settings;
create policy settings_owner_all
on public.settings
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create index if not exists idx_habits_user_id on public.habits(user_id);
create index if not exists idx_habits_updated_at on public.habits(updated_at desc);
