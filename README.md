# RotMG Dungeon Timer

Simple localhost web app to log dungeon clear times.

## Use

**Timer tab**
1. Pick an exalt dungeon from the grid (or **See all dungeons** accordion)
2. **Start** when you enter the portal
3. **End** when the boss dies

**Dungeon chains** — after End, if the next dungeon is always chained:
- Lost Halls → Cultist Hideout → The Void
- Fungal Cavern → Crystal Cavern

You get **Start next** (auto-starts the timer) or **Done** (back to the picker). Any other dungeon returns to the picker immediately after End.

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

Full wiki dungeon list in `dungeons.json` — grouped by category (Realm, Event, Advanced, Oryx, Wormholes, Special, etc.). All **12 exalt dungeons** are in the front grid.

**Icons** (in order): `icons/{id}.png` → CDN filename from `dungeons.json` → generic portal.

Fetch all portal sprites from [RealmEye dungeon list](https://www.realmeye.com/wiki/dungeons):

```bash
python3 scripts/fetch-realmeye-icons.py
```

Re-run after wiki updates or when adding dungeons to `dungeons.json`. Oryx's Castle uses the Oryx's Chamber portal (wiki lists it as “No portal”).

To add a dungeon or fix a CDN icon filename, edit `dungeons.json`.
