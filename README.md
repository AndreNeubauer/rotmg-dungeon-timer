# RotMG Dungeon Timer

**Live app:** [andreneubauer.github.io/rotmg-dungeon-timer](https://andreneubauer.github.io/rotmg-dungeon-timer/)

Log dungeon clear times. **Times** and **Board** show the same shared run log (fastest clears first on Board, newest first on Times).

Built with **Next.js** and **Tailwind CSS**, deployed as a static site on GitHub Pages.

## Quick start

1. Open the live link (or run `npm run dev` locally → http://127.0.0.1:3000)
2. **Timer** — pick dungeon → **Start** → **End** / **Nexus** / **Died**
3. Optional after a clear: party/organic, group size, search time
4. Optional: **Set IGN** — tags your runs; not required to view anything

## Tabs

| Tab | What it shows |
|-----|----------------|
| **Overview** | Exalt stats, best/avg times, recent runs |
| **Times** | Full log, filters, per-dungeon averages |
| **Board** | Same runs as Times, sorted by fastest time |

Runs save automatically to the shared board on the hosted site.

## Local dev

```bash
npm install
npm run dev
```

Without Supabase configured, runs are stored in your browser (`localStorage`).

## Self-hosting

See [HOSTING.md](./HOSTING.md) — GitHub Pages + optional Supabase setup.

## Maintenance scripts

```bash
python3 scripts/fetch-realmeye-icons.py  # refresh portal icons
python3 scripts/set-dungeon-player-max.py
```

Dungeon data lives in `dungeons.json` (served from `public/`).

## Tests

```bash
npm test
```
