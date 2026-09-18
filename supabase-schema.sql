-- RotMG Timer — shared leaderboard (Supabase)
-- Run in Supabase → SQL Editor → New query → paste → Run

create table if not exists public.leaderboard_runs (
  id uuid primary key default gen_random_uuid(),
  client_run_id text not null unique,
  ign text not null check (char_length(trim(ign)) between 1 and 32),
  dungeon_id text not null,
  dungeon_name text not null,
  duration_seconds numeric not null check (duration_seconds >= 3),
  outcome text not null default 'complete' check (outcome = 'complete'),
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

-- Anyone can submit a clear (one row per client_run_id)
create policy "Public insert clears"
  on public.leaderboard_runs
  for insert
  to anon, authenticated
  with check (
    outcome = 'complete'
    and duration_seconds >= 3
    and char_length(trim(ign)) between 1 and 32
  );

-- No updates/deletes from the app (admin via Supabase dashboard if needed)
