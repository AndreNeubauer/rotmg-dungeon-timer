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

Bad rows can be removed in Supabase **Table Editor**.
