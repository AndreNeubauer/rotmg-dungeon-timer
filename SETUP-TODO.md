# Setup checklist — what’s left to do

Last updated: **2026-09-18**

Use this as a single list. Details live in [HOSTING.md](./HOSTING.md), [PUSH-TO-NEW-REPO.md](./PUSH-TO-NEW-REPO.md).

---

## Already done (you can skip)

- [x] App built (timer, overview, times, board, IGN, export/import)
- [x] Repo created: [github.com/AndreNeubauer/rotmg-dungeon-timer](https://github.com/AndreNeubauer/rotmg-dungeon-timer) (public)
- [x] Deploy workflow added (`.github/workflows/deploy-pages.yml`)
- [x] Personal `runs.json` gitignored — won’t ship in the public repo
- [x] Old Pages deploy removed from personal `test` repo
- [x] `hobbies/gaming.md` updated to point at the new repo

---

## Must do — get the live link

### 1. Push the app to the new repo

The new repo is still **empty**. Push from your PC (or grant Cursor write access and ask the agent to retry):

```bash
cd /path/to/test
git pull origin main
git subtree split -P apps/rotmg-dungeon-timer -b rotmg-timer-only
git push https://github.com/AndreNeubauer/rotmg-dungeon-timer.git rotmg-timer-only:main
```

- [ ] Push succeeded (`main` on `rotmg-dungeon-timer` has files)

#### If the Cloud Agent still can’t push (403 / “cursor[bot] denied”)

Cursor **Integrations** in the app ≠ always the **GitHub App** this agent uses to git push.

1. Open **GitHub** (not Cursor): [github.com/settings/installations](https://github.com/settings/installations)
2. Find **Cursor** → **Configure**
3. Under **Repository access**, ensure **rotmg-dungeon-timer** is included (or “All repositories”)
4. Save, then **start a new Cloud Agent** on `rotmg-dungeon-timer` (or ask the agent to retry push)

Until that works, push from **your PC** with the commands above (uses your GitHub login — always works).

**Status (2026-09-18):** repo still empty; agent push blocked with `Resource not accessible by integration`.

### 2. Enable GitHub Pages

On **rotmg-dungeon-timer** (not `test`):

1. [Settings → Pages](https://github.com/AndreNeubauer/rotmg-dungeon-timer/settings/pages)
2. **Build and deployment → Source:** **GitHub Actions**
3. Save

- [ ] Pages source = GitHub Actions

### 3. Confirm deploy

1. [Actions](https://github.com/AndreNeubauer/rotmg-dungeon-timer/actions) → **Deploy RotMG Timer**
2. Latest run should be **green** (re-run if it failed before Pages was enabled)

- [ ] Deploy workflow green

### 4. Open the live site

**URL:** https://andreneubauer.github.io/rotmg-dungeon-timer/

- [ ] Site loads, dungeon grid appears, timer works

### 5. Share with friends

Send them the Pages URL. Tell them:

- Times stay in **their browser** (private to them)
- Use **Times → Export** occasionally to back up

- [ ] Link shared

---

## Optional — shared leaderboard (Board tab)

Skip this if you only want personal stats. Everyone can still use the timer without it.

### 6. Create Supabase project

1. [supabase.com](https://supabase.com) → **New project**
2. Wait until the project is ready

- [ ] Supabase project created

### 7. Run database schema

1. Supabase → **SQL Editor** → New query
2. Paste all of [`supabase-schema.sql`](./supabase-schema.sql) → **Run**

- [ ] `leaderboard_runs` table exists

### 8. Add API keys to the app

1. Supabase → **Settings → API**
2. Copy **Project URL** and **anon public** key
3. Edit [`leaderboard-config.json`](./leaderboard-config.json):

```json
{
  "enabled": true,
  "supabaseUrl": "https://YOUR_PROJECT.supabase.co",
  "supabaseAnonKey": "eyJ...",
  "table": "leaderboard_runs"
}
```

4. Commit and push to `rotmg-dungeon-timer` `main`

- [ ] Config committed with `enabled: true`
- [ ] Redeploy finished (automatic on push)

**Never commit:** Supabase service role key or database password.

### 9. Test leaderboard

On the live site:

1. **Set IGN** (top right)
2. **Board** tab → enable **Share my clears to leaderboard**
3. Log a **Complete** run on Timer
4. **Board → Refresh** — your clear should appear

- [ ] Shared clear shows on Board

---

## Optional — your personal data

### 10. Keep local runs private

- `runs.json` on your PC is **gitignored** — it never uploads unless you force-add it
- Browser runs (hosted link): use **Export** if you switch devices

- [ ] Backed up runs if you care (Export JSON from Times tab)

### 11. Future development

After the move, develop in **rotmg-dungeon-timer** (canonical repo). The copy under `test/apps/rotmg-dungeon-timer/` is legacy unless you sync manually.

- [ ] Clone `rotmg-dungeon-timer` for future edits (optional)

---

## Quick verification

| Check | Expected |
|-------|----------|
| Repo has code | Files at root (`index.html`, `app.js`, …) |
| Pages | Source = GitHub Actions |
| Actions | Deploy RotMG Timer ✅ |
| Live URL | Timer loads |
| Board (no Supabase) | “not configured” message — OK |
| Board (with Supabase) | Shared clears list loads |

---

## Links

| What | URL |
|------|-----|
| App repo | https://github.com/AndreNeubauer/rotmg-dungeon-timer |
| Live app (after setup) | https://andreneubauer.github.io/rotmg-dungeon-timer/ |
| Pages settings | https://github.com/AndreNeubauer/rotmg-dungeon-timer/settings/pages |
| Actions | https://github.com/AndreNeubauer/rotmg-dungeon-timer/actions |
| Hosting guide | [HOSTING.md](./HOSTING.md) |
| Push commands | [PUSH-TO-NEW-REPO.md](./PUSH-TO-NEW-REPO.md) |
