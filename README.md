# RotMG Dungeon Timer

Simple localhost web app to log dungeon clear times.

## Use

1. Start the server (see below)
2. Pick a dungeon
3. **Start** when you enter the portal
4. **End** when the boss dies

Runs are saved in your browser (`localStorage`). Average shows for the selected dungeon.

Dungeon list and portal icons come from `dungeons.json` (RealmEye wiki names + drips.pw portal sprites where available). Search to filter; exalt-route dungeons are pinned at the top.

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
