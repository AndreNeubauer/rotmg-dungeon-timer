#!/usr/bin/env python3
"""Fetch Solo +Pet world records from speedrun.com and write wr-times.json."""

from __future__ import annotations

import json
import re
import time
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "wr-times.json"
GAME = "lde4el13"
SOLO_PET = "9d83zy72"
SOURCE = "https://www.speedrun.com/rotmg/levels?h=Solo_Pet"

# speedrun.com level name -> dungeons.json id
NAME_TO_ID: dict[str, str] = {
    "Pirate Cave": "pirate-cave",
    "Forest Maze": "forest-maze",
    "Spider Den": "spider-den",
    "Snake Pit": "snake-pit",
    "Beachzone": "beachzone",
    "Forbidden Jungle": "forbidden-jungle",
    "Sprite World": "sprite-world",
    "Haunted Cemetery": "haunted-cemetery",
    "Cave of 1000 Treasures": "cave-of-a-thousand-treasures",
    "Undead Lair": "undead-lair",
    "Abyss of Demons": "abyss-of-demons",
    "Toxic Sewers": "toxic-sewers",
    "Puppet Master's Theatre": "puppet-masters-theatre",
    "Puppet Master's Theater": "puppet-masters-theatre",
    "Puppet Master's Encore": "puppet-masters-encore",
    "Puppet Master\u2019s Encore": "puppet-masters-encore",
    "Crawling Depths": "the-crawling-depths",
    "Hive": "the-hive",
    "Manor of the Immortals": "manor-of-the-immortals",
    "Davy Jones' Locker": "davy-jones-locker",
    "Lair of Draconis": "lair-of-draconis",
    "Mad Lab": "mad-lab",
    "Deadwater Docks": "deadwater-docks",
    "Woodland Labyrinth": "woodland-labyrinth",
    "The Crawling Depths": "the-crawling-depths",
    "Ice Cave": "ice-citadel",
    "Ocean Trench": "ocean-trench",
    "Tomb of the Ancients": "tomb-of-the-ancients",
    "Shatters": "the-shatters",
    "The Nest": "the-nest",
    "Mountain Temple": "mountain-temple",
    "Magic Woods": "magic-woods",
    "Cnidarian Reef": "cnidarian-reef",
    "Parasite Chambers": "parasite-chambers",
    "Lair of Shaitan": "lair-of-shaitan",
    "Puppet Master's Encore": "puppet-masters-encore",
    "Secluded Thicket": "secluded-thicket",
    "Cursed Library": "cursed-library",
    "Ancient Ruins": "ancient-ruins",
    "Full Fungal & Crystal Cavern": "fungal-cavern",
    "Crystal Cavern Only": "crystal-cavern",
    "Fungal Cavern Only": "fungal-cavern",
    "Lost Halls + Cult": "lost-halls",
    "Cultist Hideout": "cultist-hideout",
    "Lost Halls (MBC)": "lost-halls",
    "Lost Halls + Void": "lost-halls",
    "The Void": "the-void",
    "Oryx's Chamber": "oryxs-chamber",
    "Wine Cellar": "wine-cellar",
    "Oryx's Sanctuary": "oryxs-sanctuary",
    "The Machine": "the-machine",
    "Candyland Hunting Grounds": "candyland-hunting-grounds",
    "Heroic Undead Lair": "heroic-undead-lair",
    "Heroic Abyss of Demons": "infernal-abyss-of-demons",
    "Battle for the Nexus": "battle-for-the-nexus",
    "Belladonna's Garden": "belladonnas-garden",
    "Ice Tomb": "ice-tomb",
    "Rainbow Road": "rainbow-road",
    "Mad God Mayhem": "mad-god-mayhem",
    "Malogia": "malogia",
    "Untaris": "untaris",
    "Forax": "forax",
    "Katalund": "katalund",
    "High Tech Terror": "high-tech-terror",
    "Kogbold Steamworks": "kogbold-steamworks",
    "Moonlight Village": "moonlight-village",
    "Plagued Nest": "plagued-nest",
    "Spectral Penitentiary": "spectral-penitentiary",
}


def fetch_json(url: str) -> dict:
    req = urllib.request.Request(url, headers={"User-Agent": "rotmg-dungeon-timer/1.0"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))


def main() -> None:
    levels = fetch_json(f"https://www.speedrun.com/api/v1/games/{GAME}/levels?max=200")["data"]
    by_id: dict[str, dict] = {}
    unmapped: list[str] = []

    for i, level in enumerate(levels):
        if i:
            time.sleep(0.12)
        name = level["name"]
        dungeon_id = NAME_TO_ID.get(name)
        if not dungeon_id:
            unmapped.append(name)
            continue
        url = f"https://www.speedrun.com/api/v1/leaderboards/{GAME}/level/{level['id']}/{SOLO_PET}?top=1"
        try:
            lb = fetch_json(url)
            runs = lb.get("data", {}).get("runs") or []
            if not runs:
                continue
            run = runs[0]["run"]
            seconds = run["times"]["primary_t"]
            entry = {
                "dungeonId": dungeon_id,
                "name": name,
                "minClearSeconds": round(seconds, 3),
                "wrDisplay": format_wr(seconds),
                "source": SOURCE,
                "weblink": run.get("weblink"),
            }
            prev = by_id.get(dungeon_id)
            if prev is None or entry["minClearSeconds"] < prev["minClearSeconds"]:
                by_id[dungeon_id] = entry
        except Exception as err:  # noqa: BLE001
            print(f"skip {name}: {err}")

    dungeons = sorted(by_id.values(), key=lambda x: x["dungeonId"])
    payload = {
        "source": SOURCE,
        "category": "Solo +Pet",
        "fetchedAt": time.strftime("%Y-%m-%d"),
        "note": "Complete runs faster than minClearSeconds are rejected (speedrun.com WR floor).",
        "dungeons": dungeons,
        "unmappedLevels": sorted(unmapped),
    }
    OUT.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    js_out = ROOT / "wr-times.js"
    body = json.dumps(payload, ensure_ascii=False, separators=(",", ":"))
    js_out.write_text(
        f"// Auto-generated — run: python3 scripts/fetch-wr-times.py\nwindow.WR_TIMES = {body};\n",
        encoding="utf-8",
    )
    print(f"Wrote {OUT.name} + {js_out.name} — {len(dungeons)} dungeons, {len(unmapped)} unmapped level names")


def format_wr(seconds: float) -> str:
    total_ms = int(round(seconds * 1000))
    mins, rem_ms = divmod(total_ms, 60_000)
    secs, ms = divmod(rem_ms, 1000)
    if mins:
        return f"{mins}m{secs:02d}s{ms:03d}ms"
    if ms:
        return f"{secs}s{ms:03d}ms"
    return f"{secs}s"


if __name__ == "__main__":
    main()
