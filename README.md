# RotMG Dungeon Timer

Simple localhost web app to log dungeon clear times.

## Use

1. Start the server (see below)
2. Pick a dungeon
3. **Start** when you enter the portal
4. **End** when the boss dies

Runs are saved in your browser (`localStorage`). Average shows for the selected dungeon.

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

- Lost Halls complex
- Kogbold Steamworks
- Moonlight Village
- Shatters

Edit `DUNGEONS` in `app.js` to add more.
