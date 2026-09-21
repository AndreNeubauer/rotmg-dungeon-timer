# RotMG Dungeon Timer

**Live demo:** [andreneubauer.github.io/rotmg-dungeon-timer](https://andreneubauer.github.io/rotmg-dungeon-timer/)

Track Realm of the Mad God dungeon clear times, compare against [speedrun.com](https://www.speedrun.com/rotmg) world records, and compete on a shared leaderboard.

Built with **Next.js 15**, **React 19**, **TypeScript**, and **Tailwind CSS 4** — deployed as a static site on GitHub Pages with optional **Supabase** sync.

## Features

- **Timer** — one-click start/end with keyboard shortcuts (`Space`, `E`, `N`, `D`)
- **Stats** — exalt overview, per-dungeon success rates, best/avg times
- **WR comparison** — your clears vs speedrun.com solo/group records
- **Leaderboard** — shared run log sorted by fastest time (Supabase-backed on the hosted site)
- **Dark / light / auto** theme

## Tech stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 15 (App Router, static export) |
| UI | React 19, Tailwind CSS 4 |
| Language | TypeScript |
| Data | localStorage (local) · Supabase Postgres (hosted) |
| CI/CD | GitHub Actions → GitHub Pages |
| WR data | speedrun.com API → static `wr-times.json` |

## Architecture

```
Browser (timer + localStorage)
    ↓ optional sync
Supabase (leaderboard_runs table)
    ↓ static build
GitHub Pages (Next.js out/)
```

Domain logic includes chain-dungeon flows (Lost Halls → Void), overlap validation, and pending-run merge for reliable sync.

## Quick start

1. Open the [live demo](https://andreneubauer.github.io/rotmg-dungeon-timer/) (or run locally below)
2. **Timer** — pick dungeon → **Start** → **End** / **Nexus** / **Died**
3. Check **Overview** for stats and WR comparison, **Leaderboard** for fastest clears

## Local dev

```bash
npm install
npm run dev          # http://127.0.0.1:3000
```

Preview the static build (same as GitHub Pages):

```bash
npm run build
npm start            # serves the out/ folder
```

Without Supabase configured, runs are stored in your browser (`localStorage`). Use **Load demo data** on the Timer tab to explore with sample runs.

## Tabs

| Tab | What it shows |
|-----|----------------|
| **Overview** | Exalt stats, best/avg times vs WR, recent runs |
| **Times** | Full log, filters, per-dungeon averages |
| **Leaderboard** | Same runs as Times, sorted by fastest time |

## Self-hosting

See [HOSTING.md](./HOSTING.md) — GitHub Pages + optional Supabase setup.

## Maintenance scripts

```bash
python3 scripts/fetch-realmeye-icons.py  # refresh portal icons
python3 scripts/set-dungeon-player-max.py
python3 scripts/fetch-wr-times.py          # refresh speedrun.com WR data → wr-times.json
```

Dungeon data lives in `dungeons.json` (served from `public/`).

## Tests & lint

```bash
npm run lint          # ESLint (flat config, zero warnings)
npm test              # Node unit tests (stats, persistence, WR times)
npm run test:e2e      # Playwright (enum checks + app smoke tests)
npm run test:all      # unit + Playwright
```

## Author

[Andre Neubauer](https://github.com/AndreNeubauer) — source at [github.com/AndreNeubauer/rotmg-dungeon-timer](https://github.com/AndreNeubauer/rotmg-dungeon-timer)
