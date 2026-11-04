-- MyGrade cloud backup: run this once in Supabase.
-- Dashboard > SQL Editor > New query > paste everything > Run.

create table if not exists public.backups (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  teacher_username text not null,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

-- Row level security: every teacher can only ever see and change their own backup.
alter table public.backups enable row level security;

drop policy if exists "read own backup" on public.backups;
drop policy if exists "insert own backup" on public.backups;
drop policy if exists "update own backup" on public.backups;
drop policy if exists "delete own backup" on public.backups;

create policy "read own backup" on public.backups
  for select to authenticated using (auth.uid() = user_id);

create policy "insert own backup" on public.backups
  for insert to authenticated with check (auth.uid() = user_id);

create policy "update own backup" on public.backups
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "delete own backup" on public.backups
  for delete to authenticated using (auth.uid() = user_id);
