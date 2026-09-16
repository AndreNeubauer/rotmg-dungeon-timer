#!/usr/bin/env python3
"""Extract portal sprites from drips.pw sheets into icons/{id}.png."""

from __future__ import annotations

import io
import urllib.request
from pathlib import Path

from PIL import Image

SHEET_BASE = "https://static.drips.pw/rotmg/production/current/sheets/"
ICONS_DIR = Path(__file__).resolve().parent.parent / "icons"

# file, hex index, cell size — from Objects.json (2020 dump) + wiki portal data
PORTALS = {
    "lost-halls": ("lostHallsObjects8x8", 0x1D, 8),
    "cultist-hideout": ("lostHallsObjects8x8", 0x2E, 8),
    "the-void": ("lostHallsObjects8x8", 0x1E, 8),
    "ice-citadel": ("lofiObj3", 0x54F, 8),
    "the-nest": ("epicHiveObjects8x8", 0x0D, 8),
    "fungal-cavern": ("fungalCavernObjects16x16", 0x10, 16),
    "crystal-cavern": ("crystalCaveObjects8x8", 0x44, 8),
    "the-shatters": ("lofiObj3", 0x44E, 8),
}

_sheet_cache: dict[str, Image.Image] = {}


def load_sheet(name: str) -> Image.Image:
    if name not in _sheet_cache:
        url = f"{SHEET_BASE}{name}.png"
        with urllib.request.urlopen(url) as resp:
            _sheet_cache[name] = Image.open(io.BytesIO(resp.read())).convert("RGBA")
    return _sheet_cache[name]


def extract(file: str, index: int, cell: int) -> Image.Image:
    sheet = load_sheet(file)
    cols = sheet.width // cell
    x = (index % cols) * cell
    y = (index // cols) * cell
    sprite = sheet.crop((x, y, x + cell, y + cell))
    # Scale to readable size for UI
    return sprite.resize((64, 64), Image.NEAREST)


def main() -> None:
    ICONS_DIR.mkdir(parents=True, exist_ok=True)
    for dungeon_id, (file, index, cell) in PORTALS.items():
        out = ICONS_DIR / f"{dungeon_id}.png"
        extract(file, index, cell).save(out)
        print(f"wrote {out.name}")


if __name__ == "__main__":
    main()
