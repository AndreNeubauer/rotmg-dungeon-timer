# RotMG Dungeon Timer

Simple localhost web app to log dungeon clear times.

## Use

**Timer tab**
1. Pick an exalt dungeon from the grid (or **See all dungeons** accordion)
2. **Start** when you enter the portal
3. **End** when the boss dies

**Times tab**
- Averages per dungeon (only dungeons with logged runs)
- Full list of all runs with delete

Runs are saved in your browser (`localStorage`). Exalt dungeons are front and center; everything else is in the accordion.

## Run

```bash
cd apps/rotmg-dungeon-timer
python3 serve.py
```

Opens **http://127.0.0.1:8765** in your browser. No install needed.

Alternative:

```bash
python3 -m http.server 8765
# then open http://127.0.0.1:8765
```

## Dungeons

Full wiki dungeon list in `dungeons.json` — grouped by category (Realm, Event, Advanced, Oryx, Wormholes, Special, etc.). Exalt-route dungeons pinned under **Exalt route**.

To add a dungeon or fix an icon filename, edit `dungeons.json`. Icons load from `static.drips.pw` (older portals); newer dungeons use a generic portal sprite until a PNG is added under `icons/` locally.
