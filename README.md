# RotMG Dungeon Timer

**Live app:** [andreneubauer.github.io/rotmg-dungeon-timer](https://andreneubauer.github.io/rotmg-dungeon-timer/)

Log dungeon clear times. **Times** and **Board** show the same shared run log (fastest clears first on Board, newest first on Times).

## Quick start

1. Open the live link (or run `python3 serve.py` locally → http://127.0.0.1:8765)
2. **Timer** — pick dungeon → **Start** → **End** / **Nexus** / **Died**
3. Optional after a clear: party/organic, group size, search time
4. Optional: **Set IGN** — tags your runs; not required to view anything

## Tabs

| Tab          | What it shows                              |
| ------------ | ------------------------------------------ |
| **Overview** | Exalt stats, best/avg times, recent runs   |
| **Times**    | Full log, filters, per-dungeon averages    |
| **Board**    | Same runs as Times, sorted by fastest time |

Runs save automatically to the shared board on the hosted site.

## Local dev (optional)

```bash
python3 serve.py
```

Without Supabase configured, runs go to `runs.json` on your machine (`runs.json` is gitignored).

### Quality checks

```bash
npm install
npm run lint          # ESLint
npm run format:check  # Prettier
npm test              # Playwright (starts serve.py automatically)
npm run check         # all of the above
```

Pure helpers and enum constants live under `lib/` (`constants.js`, `run-utils.js`, `enum-validation.js`). The browser app imports them as ES modules from `app.js`.

## Self-hosting

See [HOSTING.md](./HOSTING.md) — GitHub Pages + optional Supabase setup.

## Maintenance scripts

```bash
python3 scripts/build-catalog-js.py      # rebuild dungeons.js (CI runs this)
python3 scripts/fetch-realmeye-icons.py  # refresh portal icons
python3 scripts/set-dungeon-player-max.py
```
