#!/usr/bin/env python3
"""Fetch Solo +Pet and Group WRs from speedrun.com → wr-times.json."""

from __future__ import annotations

import json
import time
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "wr-times.json"
GAME = "lde4el13"
SOLO_PET = "9d83zy72"
GROUP_PETS = "xd1vzjrd"
SOLO_SOURCE = "https://www.speedrun.com/rotmg/levels?h=Solo_Pet"
GROUP_SOURCE = "https://www.speedrun.com/rotmg/levels?h=Group_%2BPets_%2B_Consumables"

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


def fetch_wr(level_id: str, category_id: str) -> dict | None:
    url = f"https://www.speedrun.com/api/v1/leaderboards/{GAME}/level/{level_id}/{category_id}?top=1"
    lb = fetch_json(url)
    runs = lb.get("data", {}).get("runs") or []
    if not runs:
        return None
    run = runs[0]["run"]
    seconds = run["times"]["primary_t"]
    return {
        "minClearSeconds": round(seconds, 3),
        "wrDisplay": format_wr(seconds),
        "weblink": run.get("weblink"),
    }


def format_wr(seconds: float) -> str:
    total_ms = int(round(seconds * 1000))
    mins, rem_ms = divmod(total_ms, 60_000)
    secs, ms = divmod(rem_ms, 1000)
    if mins:
        return f"{mins}m{secs:02d}s{ms:03d}ms"
    if ms:
        return f"{secs}s{ms:03d}ms"
    return f"{secs}s"


def main() -> None:
    levels = fetch_json(f"https://www.speedrun.com/api/v1/games/{GAME}/levels?max=200")["data"]
    merged: dict[str, dict] = {}
    unmapped: list[str] = []

    for i, level in enumerate(levels):
        if i:
            time.sleep(0.15)
        name = level["name"]
        dungeon_id = NAME_TO_ID.get(name)
        if not dungeon_id:
            unmapped.append(name)
            continue
        if dungeon_id not in merged:
            merged[dungeon_id] = {"dungeonId": dungeon_id, "name": name.split(" Only")[0].split(" +")[0]}

        for key, cat_id, source in (
            ("solo", SOLO_PET, SOLO_SOURCE),
            ("group", GROUP_PETS, GROUP_SOURCE),
        ):
            try:
                wr = fetch_wr(level["id"], cat_id)
                if wr:
                    merged[dungeon_id][f"{key}MinClearSeconds"] = wr["minClearSeconds"]
                    merged[dungeon_id][f"{key}WrDisplay"] = wr["wrDisplay"]
                    merged[dungeon_id][f"{key}Weblink"] = wr["weblink"]
                    merged[dungeon_id][f"{key}Source"] = source
                time.sleep(0.08)
            except Exception as err:  # noqa: BLE001
                print(f"skip {name} ({key}): {err}")

    dungeons = sorted(merged.values(), key=lambda x: x["dungeonId"])
    payload = {
        "fetchedAt": time.strftime("%Y-%m-%d"),
        "note": "Solo WR for solo/organic 1p; group WR (or ~55% solo) for party or group size > 1.",
        "soloCategory": "Solo +Pet",
        "groupCategory": "Group +Pets + Consumables",
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
    solo_n = sum(1 for d in dungeons if "soloMinClearSeconds" in d)
    group_n = sum(1 for d in dungeons if "groupMinClearSeconds" in d)
    print(f"Wrote {OUT.name} + {js_out.name} — {solo_n} solo, {group_n} group WRs")


if __name__ == "__main__":
    main()
