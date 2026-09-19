# Hosting (GitHub Pages + Supabase)

## GitHub Pages

1. **Settings → Pages → Source:** GitHub Actions
2. Push to `main` — workflow **Deploy RotMG Timer** publishes the site
3. URL: `https://<username>.github.io/<repo>/`

## Shared run log (Supabase)

The hosted app stores all runs in Supabase. Times and Board read from the same table.

### Setup (one-time)

1. [supabase.com](https://supabase.com) → new project
2. **SQL Editor** → run `supabase-schema.sql`
3. **Settings → API** → copy Project URL + anon/publishable key
4. Edit `leaderboard-config.json`:

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
| Board/Times empty | Check `leaderboard-config.json`, browser console (F12), schema + grants in SQL |
| Insert permission denied | Re-run the `grant` lines at the bottom of `supabase-schema.sql` |

Bad rows can be removed in Supabase **Table Editor**.
