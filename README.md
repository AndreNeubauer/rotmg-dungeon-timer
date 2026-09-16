# RotMG Dungeon Timer

Small desktop app to log how long dungeon clears take.

## Use

1. Pick a dungeon
2. **Start** when you enter the portal
3. **End** when the boss is dead
4. Runs save to a local table; average shows for the selected dungeon

Data is stored in `times.db` next to the app (not committed to git).

## Run

```bash
cd apps/rotmg-dungeon-timer
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

Or with Flet CLI:

```bash
flet run main.py
```

## Dungeons

- Lost Halls complex
- Kogbold Steamworks
- Moonlight Village
- Shatters

Edit `DUNGEONS` in `main.py` to add more.
