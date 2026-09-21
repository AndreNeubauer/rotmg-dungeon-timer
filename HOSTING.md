# Hosting (GitHub Pages + Supabase)

## GitHub Pages

1. **Settings → Pages → Source:** GitHub Actions
2. Push to `main` — workflow **Deploy RotMG Timer** builds Next.js and publishes the static `out/` folder
3. URL: `https://<username>.github.io/<repo>/`

The app uses Next.js static export with `basePath` set to the repo name for GitHub Pages project sites.

## Shared run log (Supabase)

The hosted app stores all runs in Supabase. Times and Leaderboard read from the same table.

### Setup (one-time)

1. [supabase.com](https://supabase.com) → new project
2. **SQL Editor** → run `supabase-schema.sql`
3. **Settings → API** → copy Project URL + anon/publishable key
4. Edit `public/leaderboard-config.json`:

```json
{
  "enabled": true,
  "supabaseUrl": "https://YOUR_PROJECT.supabase.co",
  "supabaseAnonKey": "eyJ...",
  "table": "leaderboard_runs"
}
```

5. Commit, push, wait for Pages deploy

### Troubleshooting

| Problem | Fix |
|--------|-----|
| Pages deploy 404 | Enable **Source: GitHub Actions** under Settings → Pages |
| Leaderboard/Times empty | Check `public/leaderboard-config.json`, browser console (F12), schema + grants in SQL |
| Insert permission denied | Re-run the `grant` lines at the bottom of `supabase-schema.sql` |
| Assets or links broken | Ensure the repo name matches `basePath` in `next.config.ts` (`rotmg-dungeon-timer`) |

### Deleting rows (no login — admin passphrase)

Visitors cannot delete leaderboard rows. You can remove bad rows from the **Times** tab after a one-time Supabase setup:

1. In **SQL Editor**, run the **Admin delete** section at the bottom of `supabase-schema.sql` (if you created the project before that section existed, run only the new `app_settings` / policy / grant lines).
2. Set a long random passphrase (keep it private):

```sql
insert into public.app_settings (key, value)
values ('admin_delete_key', 'your-long-random-secret-here')
on conflict (key) do update set value = excluded.value;
```

3. In the app header, click **Admin delete**, enter the same passphrase, then use **Delete** on Times. The passphrase is kept in **session storage** for that browser tab only (not in `leaderboard-config.json`).

Wrong passphrase or missing SQL setup shows an error and nothing is deleted. You can still remove rows in Supabase **Table Editor** with the service role.
