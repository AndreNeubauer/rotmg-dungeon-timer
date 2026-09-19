# Hosting RotMG Timer (GitHub Pages + shared leaderboard)

This guide gets you a **live link for friends** and an optional **shared leaderboard** (everyone sees the same times).

Personal runs still stay in each person’s browser. Only **clears you opt in to share** go to the leaderboard database.

---

## Part 1 — GitHub Pages (static app)

### 1. Enable Pages (one-time)

1. Open your repo on GitHub → **Settings** → **Pages**
2. Under **Build and deployment** → **Source**, choose **GitHub Actions** (not “Deploy from a branch”)
3. Save

If the repo is **private**, you need **GitHub Pro** (personal) or **Team** (org) for Pages to keep working. On **GitHub Free**, Pages only works from **public** repos — making the repo private unpublishes the site. With Pro+, the **website stays public** for everyone even if the repo is private (only the source code is hidden).

### 2. Deploy

Every push to `main` runs the workflow **Deploy RotMG Timer** (`.github/workflows/deploy-pages.yml` in this repo).

- **Actions** tab → open the latest **Deploy RotMG Timer** run → it should be green
- If deploy fails with `404` / “Ensure GitHub Pages has been enabled”, go back to step 1

### 3. Live URL

After a successful deploy:

- **Settings → Pages** shows the site URL, usually:
  - `https://<username>.github.io/<repo>/`
  - This app: `https://andreneubauer.github.io/rotmg-dungeon-timer/`

The workflow uploads this repo root as the site (see **MOVE-REPO.md** if migrating from PersonalAI).

### 4. Share with friends

Send them the Pages URL. Each person’s times are stored in **their browser** unless they use Export/Import on the Times tab.

---

## Part 2 — Shared leaderboard (Supabase)

The app talks to Supabase directly from the browser (anon key + Row Level Security). No custom server to run.

### 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) → sign in → **New project**
2. Pick a name/region/password → wait until the project is ready

### 2. Create the table

1. Supabase dashboard → **SQL Editor** → **New query**
2. Paste the contents of `supabase-schema.sql`
3. **Run**

### 3. Get API credentials

1. **Project Settings** (gear) → **API**
2. Copy:
   - **Project URL** → `supabaseUrl` — built as `https://YOUR_PROJECT_ID.supabase.co` (find **Project ID** under Settings → General, e.g. `fwyhpqigtrjdgamdhvwg`)
   - **Publishable key** or **legacy anon** key → `supabaseAnonKey` (safe in the static app; RLS limits what it can do)

### 4. Configure the app

Edit `leaderboard-config.json`:

```json
{
  "enabled": true,
  "supabaseUrl": "https://xxxx.supabase.co",
  "supabaseAnonKey": "eyJhbG...",
  "table": "leaderboard_runs"
}
```

Commit and push to `main`. The next Pages deploy picks up the config.

### 5. Use in the app

1. Open the hosted site
2. At the top, **Set IGN** (in-game name) — stored once in your browser, **Edit** later
3. Open **Leaderboard** → turn on **Share my clears to leaderboard**
4. Log a **complete** run on the Timer tab — it uploads after you finish (including optional party/group tags)

Only **Complete** clears are shared. Nexus/Died stay local.

### 6. Security notes

- Anon key is public by design; **RLS** allows read-all + insert-only for valid clears
- No delete from the app — remove bad rows in Supabase **Table Editor** if needed
- `client_run_id` dedupes the same run so re-saving doesn’t spam duplicates

---

## Part 3 — Local development

```bash
python3 serve.py
# http://127.0.0.1:8765
```

- Personal runs: `runs.json` (server) or browser storage (open HTML directly)
- Leaderboard: same Supabase config; works locally once `leaderboard-config.json` is filled in

---

## Troubleshooting

| Problem | Fix |
|--------|-----|
| Pages deploy 404 | Enable **Source: GitHub Actions** under Settings → Pages |
| Leaderboard tab says “not configured” | Set `enabled: true` and URLs/keys in `leaderboard-config.json`, push |
| Shares fail silently | Browser console (F12); check Supabase URL/key and that SQL schema ran |
| Friends don’t see each other’s times | They must enable **Share my clears** and set an IGN |
| Private repo, no Pages | Make repo public or upgrade GitHub plan / use Netlify |

---

## Quick checklist

- [ ] GitHub Pages → Source = **GitHub Actions**
- [ ] Green **Deploy RotMG Timer** workflow
- [ ] Supabase project + `supabase-schema.sql` executed
- [ ] `leaderboard-config.json` committed with real URL + anon key
- [ ] Test: set IGN → enable share → complete a run → see it on Leaderboard tab
