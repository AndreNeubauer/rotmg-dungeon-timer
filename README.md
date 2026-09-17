# RotMG Dungeon Timer

Simple localhost web app to log dungeon clear times.

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

Runs are saved in your browser (`localStorage`). Exalt dungeons are front and center; everything else is in the accordion.

## Run

After `git pull origin main`:

### Easiest — no server

Open **`index.html`** in Chrome, Edge, or Firefox (double-click it in `apps/rotmg-dungeon-timer/`).

No Python, no `127.0.0.1`, no terminal. Data stays in `localStorage` on that browser.

### Local server (optional)

- Windows: double-click **`start.bat`**
- Mac/Linux: `./start.sh`

Or:

```bash
cd apps/rotmg-dungeon-timer
python3 serve.py
```

Then open **http://127.0.0.1:8765** and keep the terminal open.

If `127.0.0.1` says *connection refused*, you have not started the server — use **`index.html`** instead, or run `start.bat` / `serve.py` first.

### GitHub Pages (optional)

Workflow: `.github/workflows/rotmg-timer-pages.yml`. Enable **Settings → Pages → Build and deployment → GitHub Actions** once. Private repos need a plan that includes Pages.

## Dungeons

Full wiki dungeon list in `dungeons.json` — grouped by category (Realm, Event, Advanced, Oryx, Wormholes, Special, etc.). **Exalt** tab: 13 dungeons (includes **O3**). **O3** also appears under **Oryx** via `"alsoIn": ["oryx"]` in `dungeons.json`.

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
