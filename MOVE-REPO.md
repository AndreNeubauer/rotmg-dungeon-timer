# Move RotMG Timer to its own repo

The app is self-contained in this folder. Moving it out keeps your personal life repo separate from a shareable game tool.

## What moves

Everything under `apps/rotmg-dungeon-timer/`:

- App (`index.html`, `app.js`, `style.css`, …)
- Assets (`icons/`, `backgrounds/` if present)
- Scripts, Supabase schema, leaderboard config
- **`.github/workflows/deploy-pages.yml`** — Pages deploy for the new repo root

## What stays in PersonalAI (`test`)

- `.github/workflows/rotmg-timer-pages.yml` — delete after move if you no longer host from here
- References in `hobbies/gaming.md` — update to the new repo URL

---

## Option A — GitHub “Import repository” (easiest)

1. Create an **empty** repo on GitHub, e.g. `AndreNeubauer/rotmg-dungeon-timer` (no README).
2. On your machine:

```bash
cd /path/to/test
git subtree split -P apps/rotmg-dungeon-timer -b rotmg-timer-only
mkdir ../rotmg-dungeon-timer && cd ../rotmg-dungeon-timer
git init
git pull /path/to/test rotmg-timer-only
git branch -M main
git remote add origin https://github.com/AndreNeubauer/rotmg-dungeon-timer.git
git push -u origin main
```

3. **Settings → Pages → Source: GitHub Actions** on the **new** repo.
4. Re-run **Deploy RotMG Timer** under Actions.

**Live URL:** `https://andreneubauer.github.io/rotmg-dungeon-timer/` (repo name = path segment).

---

## Option B — Copy folder manually

1. Copy `apps/rotmg-dungeon-timer/` to a new directory (contents = repo root, not nested).
2. `git init && git add . && git commit -m "Initial import"`
3. Create empty GitHub repo, push, enable Pages (GitHub Actions).

---

## After the move

1. **Supabase** — no change; same `leaderboard-config.json` keys work from any domain.
2. **Personal runs** — still in each browser; Export/Import if needed.
3. **Old Pages site** — disable or remove `rotmg-timer-pages.yml` in `test` so you are not deploying two copies.
4. Update `HOSTING.md` / README with your real Pages URL.

---

## Suggested repo name

`rotmg-dungeon-timer` → clean URL and obvious purpose.

If you tell the agent the exact repo name (e.g. `AndreNeubauer/rotmg-dungeon-timer`), it can run the subtree split and push for you.
