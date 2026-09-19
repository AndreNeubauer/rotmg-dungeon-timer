-- Run once in Supabase SQL Editor if the board only accepted "complete" before.

alter table public.leaderboard_runs drop constraint if exists leaderboard_runs_outcome_check;
alter table public.leaderboard_runs add constraint leaderboard_runs_outcome_check
  check (outcome in ('complete', 'nexus', 'died'));

drop policy if exists "Public insert clears" on public.leaderboard_runs;

create policy "Public insert runs"
  on public.leaderboard_runs
  for insert
  to anon, authenticated
  with check (
    outcome in ('complete', 'nexus', 'died')
    and duration_seconds >= 3
    and char_length(trim(ign)) between 1 and 32
  );
