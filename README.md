# RotMG Dungeon Timer

**Canonical repo:** [github.com/AndreNeubauer/rotmg-dungeon-timer](https://github.com/AndreNeubauer/rotmg-dungeon-timer)  
**Live app (after Pages):** [andreneubauer.github.io/rotmg-dungeon-timer](https://andreneubauer.github.io/rotmg-dungeon-timer/)

Simple web app to log dungeon clear times.

## Use

**Timer tab**
1. Pick a dungeon from the category tabs (Exalt, Oryx, Realm, …)
2. **Start** when you enter the portal
3. **End** when the boss dies — counts as **Complete** (clears only, for averages)
4. **Nexus** or **Died** if you fail mid-run — logged for **success rate**, not averaged
5. **Run details (optional)** — **Party / Organic**, **group size** (text field, max per dungeon from RealmEye — usually 50, up to 85 for Oryx’s Castle / Stromwell), **search time** when not a chain spawn.

**Times tab:** filter by dungeon; success %, complete / nexus / died counts, and **clear · avg** times (boss-clear average vs all-attempt average). Per-dungeon breakdown when showing all. Delete bad rows anytime.

On **Lost Halls**, **Discard** on the branch prompt drops a pending run without saving.

**Branching / chains** after End:
- **Lost Halls** — time **saves on End**. Then: **→ Cult**, **Colossus → Void**, **Colossus clear** (done), or **Discard** (removes that save).
- **Fungal Cavern** — **→ Crystal Cavern** or **Done**

Cult is timed separately from the grid (no auto-chain after Cult).

Any other dungeon saves and returns to the picker immediately.

**Times tab**
- Averages per dungeon (only dungeons with logged runs)
- Full list of all runs with delete

## Data file

When you use **`python3 serve.py`** (or `start.bat` / `start.sh`), runs are saved to:

**`runs.json`**

The app reads and writes that file on every save. It survives shutdowns and browser restarts as long as you start the timer via the local server.

Opening **`index.html`** directly (no server) falls back to browser **`localStorage`** — data stays on that browser only, not in `runs.json`. On first server start, any existing `localStorage` runs are copied into `runs.json`.

Sample runs live in **`runs.json`** in the repo. When you log new times via the server, that file updates on your machine. If you clone fresh and want a blank slate, replace it with `[]` or copy from `runs.json.example`.

**Validation on save** (speedrun WR checks disabled until full group WR list exists):
- Duplicate same dungeon + same time within 2 minutes
- “Time travel” — start overlaps a previous run still in progress
- Runs under 3 seconds

Draft WR data (not enforced): `wr-times.json` via `python3 scripts/fetch-wr-times.py`

## Run

After `git pull origin main`:

### Easiest — no server

Open **`index.html`** in Chrome, Edge, or Firefox (double-click in this folder).

No Python, no `127.0.0.1`, no terminal. Data stays in browser **`localStorage`** only (not `runs.json`).

### Local server (recommended — saves to runs.json)

- Windows: double-click **`start.bat`**
- Mac/Linux: `./start.sh`

Or:

```bash
python3 serve.py
```

Then open **http://127.0.0.1:8765** and keep the terminal open.

If `127.0.0.1` says *connection refused*, you have not started the server — use **`index.html`** instead, or run `start.bat` / `serve.py` first.

### GitHub Pages (share with friends)

Workflow: `.github/workflows/deploy-pages.yml`. Enable **Settings → Pages → Build and deployment → GitHub Actions** once on the **rotmg-dungeon-timer** repo.

**Step-by-step:** see **[HOSTING.md](./HOSTING.md)** (Pages URL + optional Supabase shared leaderboard).

**Important:** personal runs stay in **each browser** unless exported. Optional **Board** tab shares **Complete** clears only when you set an IGN, enable sharing, and the host configures Supabase (`leaderboard-config.json`).

**Before sharing the link**

1. Enable GitHub Pages (above) and confirm the deploy workflow is green.
2. Decide whether `runs.json` in the repo should stay sample-only (recommended) — your real runs are local unless you commit them.
3. Send friends the Pages URL; tell them Export occasionally if they care about backup.
4. Optional: make the repo public so Pages is free and easy.

**Does it save to GitHub automatically?** No. Only if you run `serve.py` locally and manually `git add runs.json && git push`. Hosted users never write to the repo.

## Dungeons

Full wiki dungeon list in `dungeons.json` — grouped by category (Realm, Event, Advanced, Oryx, Wormholes, Special, etc.). **Exalt** tab: 14 dungeons (includes **O3** and **Spectral Penitentiary**). **O3** also appears under **Oryx** via `"alsoIn": ["oryx"]` in `dungeons.json`.

**Icons** (in order): `icons/{id}.png` → CDN filename from `dungeons.json` → generic portal.

Fetch all portal sprites from [RealmEye dungeon list](https://www.realmeye.com/wiki/dungeons):

```bash
python3 scripts/fetch-realmeye-icons.py
```

Re-run after wiki updates or when adding dungeons to `dungeons.json`. Oryx's Castle uses the Oryx's Chamber portal (wiki lists it as “No portal”).

Player limits per dungeon (RealmEye wiki):

```bash
python3 scripts/set-dungeon-player-max.py
```

To add a dungeon or fix a CDN icon filename, edit `dungeons.json`.
