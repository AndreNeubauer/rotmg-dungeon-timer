#!/usr/bin/env python3
"""Set playerMax on each dungeon per RealmEye wiki limits (2026)."""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DUNGEONS_JSON = ROOT / "dungeons.json"

# https://www.realmeye.com/wiki/dungeons — explicit exceptions
OVERRIDES: dict[str, int] = {
    "santas-workshop": 1,
    "tutorial": 1,
    "court-of-oryx": 25,
    "the-tavern": 25,
    "spectral-penitentiary": 25,
    "hidden-interregnum": 15,
    "white-snake-invasion-iii": 20,
    "stromwells-rift-i": 85,
    "stromwells-rift-ii": 85,
    "stromwells-rift-iii": 85,
    "oryxs-castle": 85,
    "oryxs-chamber": 85,
    "wine-cellar": 85,
    "admin-arena": 100,
    "heroic-undead-lair": 15,
    "infernal-abyss-of-demons": 15,
}

HEROIC_MAX = 15
WORMHOLE_MAX = 25
DEFAULT_MAX = 50


def player_max_for(dungeon: dict) -> int:
    dungeon_id = dungeon["id"]
    if dungeon_id in OVERRIDES:
        return OVERRIDES[dungeon_id]
    category = dungeon.get("category", "")
    if category == "heroic" or dungeon_id.startswith("legacy-heroic-"):
        return HEROIC_MAX
    if category in ("wormhole", "wormhole-adv"):
        return WORMHOLE_MAX
    return DEFAULT_MAX


def main() -> None:
    data = json.loads(DUNGEONS_JSON.read_text())
    for dungeon in data["dungeons"]:
        dungeon["playerMax"] = player_max_for(dungeon)
    DUNGEONS_JSON.write_text(json.dumps(data, indent=2) + "\n")
    print(f"Updated playerMax for {len(data['dungeons'])} dungeons")


if __name__ == "__main__":
    main()
