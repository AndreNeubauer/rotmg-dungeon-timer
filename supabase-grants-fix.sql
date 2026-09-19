-- Run once if Board tab returns permission errors (42501).
-- Needed when "Automatically expose new tables" was disabled at project creation.

grant usage on schema public to anon, authenticated;
grant select, insert on public.leaderboard_runs to anon, authenticated;
