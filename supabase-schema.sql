-- RotMG Timer — shared leaderboard (Supabase)
-- Run in Supabase → SQL Editor → New query → paste → Run

create table if not exists public.leaderboard_runs (
  id uuid primary key default gen_random_uuid(),
  client_run_id text not null unique,
  ign text not null check (char_length(trim(ign)) between 1 and 32),
  dungeon_id text not null,
  dungeon_name text not null,
  duration_seconds numeric not null check (duration_seconds >= 3),
  outcome text not null default 'complete' check (outcome in ('complete', 'nexus', 'died')),
  run_type text check (run_type is null or run_type in ('party', 'organic')),
  group_size integer check (group_size is null or group_size >= 1),
  hard_mode boolean,
  find_time_seconds integer check (find_time_seconds is null or find_time_seconds >= 0),
  started_at timestamptz not null,
  shared_at timestamptz not null default now()
);

create index if not exists leaderboard_runs_dungeon_time_idx
  on public.leaderboard_runs (dungeon_id, duration_seconds asc);

create index if not exists leaderboard_runs_ign_idx
  on public.leaderboard_runs (ign);

alter table public.leaderboard_runs enable row level security;

-- Anyone with the anon key can read the board
create policy "Public read leaderboard"
  on public.leaderboard_runs
  for select
  to anon, authenticated
  using (true);

-- Anyone can submit a run (one row per client_run_id)
create policy "Public insert runs"
  on public.leaderboard_runs
  for insert
  to anon, authenticated
  with check (
    outcome in ('complete', 'nexus', 'died')
    and duration_seconds >= 3
    and char_length(trim(ign)) between 1 and 32
  );

-- Required when "Automatically expose new tables" is OFF in project settings
grant usage on schema public to anon, authenticated;
grant select, insert, update on public.leaderboard_runs to anon, authenticated;

-- Allow tagging a run after End (party/organic, group size, search time, LH path name)
drop policy if exists "Public update runs" on public.leaderboard_runs;
create policy "Public update runs"
  on public.leaderboard_runs
  for update
  to anon, authenticated
  using (true)
  with check (
    outcome in ('complete', 'nexus', 'died')
    and duration_seconds >= 3
    and char_length(trim(ign)) between 1 and 32
  );

-- Admin delete (passphrase in DB — no Supabase Auth / login UI)
create table if not exists public.app_settings (
  key text primary key,
  value text not null
);

alter table public.app_settings enable row level security;

create or replace function public.admin_delete_allowed()
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  hdr text;
  expected text;
begin
  hdr := coalesce(current_setting('request.headers', true)::json->>'x-admin-key', '');
  select value into expected from public.app_settings where key = 'admin_delete_key' limit 1;
  if expected is null or expected = '' then
    return false;
  end if;
  return hdr <> '' and hdr = expected;
end;
$$;

revoke all on function public.admin_delete_allowed() from public;
grant execute on function public.admin_delete_allowed() to anon, authenticated;

drop policy if exists "Admin delete runs" on public.leaderboard_runs;
create policy "Admin delete runs"
  on public.leaderboard_runs
  for delete
  to anon, authenticated
  using (public.admin_delete_allowed());

grant delete on public.leaderboard_runs to anon, authenticated;

-- One-time: pick a long random passphrase (only you should know it).
-- insert into public.app_settings (key, value)
-- values ('admin_delete_key', 'replace-with-a-long-random-secret')
-- on conflict (key) do update set value = excluded.value;
