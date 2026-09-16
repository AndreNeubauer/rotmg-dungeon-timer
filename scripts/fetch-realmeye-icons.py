#!/usr/bin/env python3
"""Download dungeon portal icons from RealmEye wiki dungeon list."""

from __future__ import annotations

import io
import json
import re
import urllib.request
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
ICONS_DIR = ROOT / "icons"
DUNGEONS_JSON = ROOT / "dungeons.json"
WIKI_URL = "https://www.realmeye.com/wiki/dungeons"
REALMEYE_BASE = "https://www.realmeye.com"

# Our dungeon id -> RealmEye wiki slug (when they differ)
ID_TO_WIKI: dict[str, str] = {
    "puppet-masters-theatre": "puppet-master-s-theatre",
    "puppet-masters-encore": "puppet-master-s-encore",
    "oryxs-castle": "oryx-s-castle",
    "oryxs-chamber": "oryx-s-chamber",
    "oryxs-sanctuary": "oryx-s-sanctuary",
    "oryxs-kitchen": "oryx-s-kitchen",
    "santas-workshop": "santa-s-workshop",
    "belladonnas-garden": "belladonna-s-garden",
    "stromwells-rift-i": "stromwell-s-rift-i",
    "stromwells-rift-ii": "stromwell-s-rift-ii",
    "stromwells-rift-iii": "stromwell-s-rift-iii",
    "trials-of-cronus": "the-trials-of-cronus",
}

# Wiki has no portal sprite — use another dungeon's portal icon path
FALLBACK_WIKI_ICON: dict[str, str] = {
    "oryx-s-castle": "/s/a/img/wiki/i/dLVOZiv.png",  # no portal; use Oryx's Chamber
}

# Slugs where table layout differs (no "Portal" in alt text, special tables, etc.)
MANUAL_WIKI_ICON: dict[str, str] = {
    "puppet-master-s-theatre": "/s/a/img/wiki/i/6diBou4.png",
    "puppet-master-s-encore": "/s/a/img/wiki/i/UhdCm8R.png",
    "davy-jones-locker": "/s/a/img/wiki/i/Hqmoe5U.gif",
    "oryx-s-chamber": "/s/a/img/wiki/i/dLVOZiv.png",
    "santa-s-workshop": "/s/a/img/wiki/i/oX3aVA2.png",
    "belladonna-s-garden": "/s/a/img/wiki/i/iIG3NIj.png",
    "queen-bunny-chamber": "/s/a/img/wiki/i/prGMIfR.png",
    "stromwell-s-rift-i": "/s/a/img/wiki/i/v0Bnw3X.png",
    "stromwell-s-rift-ii": "/s/a/img/wiki/i/MTJYkkV.png",
    "stromwell-s-rift-iii": "/s/a/img/wiki/i/ZOOwlwb.png",
    "oryxmania": "/s/a/img/wiki/i/p1P51Ny.png",
    "oryx-s-kitchen": "/s/a/img/wiki/i/NKIMMs8.png",
}


def fetch_html() -> str:
    req = urllib.request.Request(
        WIKI_URL,
        headers={"User-Agent": "Mozilla/5.0 (compatible; rotmg-dungeon-timer/1.0)"},
    )
    with urllib.request.urlopen(req) as resp:
        return resp.read().decode("utf-8")


def parse_portal_icons(html: str) -> dict[str, str]:
    """wiki slug -> /s/a/img/wiki/i/.... path"""
    icons: dict[str, str] = {}

    for table in re.findall(r'<table class="table table-striped">(.*?)</table>', html, re.DOTALL):
        if "Portal" not in table and "portal" not in table.lower():
            continue
        for row in re.findall(r"<tr[^>]*>(.*?)</tr>", table, re.DOTALL):
            if "<th" in row:
                continue
            links = re.findall(r'<a href="/wiki/([^"#]+)"[^>]*>([^<]+)</a>', row)
            if not links:
                continue
            slug = links[0][0]
            if any(x in slug for x in ("-guide", "-key", "incantation", "runes")):
                continue
            if "No portal" in row:
                continue

            dungeon_name = links[0][1].strip()
            imgs = re.findall(
                r'<img[^>]*(?:alt="([^"]*)"|title="([^"]*)")[^>]*src="(/s/a/img/wiki/i/[^"]+)"',
                row,
            )

            portal = None
            for alt, title, src in imgs:
                label = alt or title or ""
                if "Portal" in label or label == dungeon_name:
                    portal = src
                    break
            if not portal:
                for alt, title, src in imgs:
                    label = (alt or title or "").lower()
                    if any(x in label for x in ("difficulty", "key", "guardian")):
                        continue
                    if label == dungeon_name.lower() or dungeon_name.lower() in label:
                        portal = src
                        break
            if portal:
                icons[slug] = portal

    return icons


def download_image(path: str) -> Image.Image:
    url = f"{REALMEYE_BASE}{path}"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req) as resp:
        return Image.open(io.BytesIO(resp.read())).convert("RGBA")


def save_icon(img: Image.Image, out: Path) -> None:
    size = max(img.size)
    scale = 64 / size if size else 1
    w, h = img.size
    resized = img.resize(
        (max(1, int(w * scale)), max(1, int(h * scale))),
        Image.NEAREST,
    )
    # center on 64x64 canvas
    canvas = Image.new("RGBA", (64, 64), (0, 0, 0, 0))
    ox = (64 - resized.width) // 2
    oy = (64 - resized.height) // 2
    canvas.paste(resized, (ox, oy), resized)
    canvas.save(out)


def main() -> None:
    ICONS_DIR.mkdir(parents=True, exist_ok=True)
    html = fetch_html()
    wiki_icons = parse_portal_icons(html)
    wiki_icons.update(MANUAL_WIKI_ICON)
    wiki_icons.update(FALLBACK_WIKI_ICON)

    dungeons = json.loads(DUNGEONS_JSON.read_text())["dungeons"]

    ok, skip = [], []
    for d in dungeons:
        dungeon_id = d["id"]
        wiki_slug = ID_TO_WIKI.get(dungeon_id, dungeon_id)
        icon_path = wiki_icons.get(wiki_slug)

        out = ICONS_DIR / f"{dungeon_id}.png"
        if not icon_path:
            skip.append(dungeon_id)
            continue

        img = download_image(icon_path)
        save_icon(img, out)
        ok.append(dungeon_id)

    print(f"Downloaded {len(ok)} icons to {ICONS_DIR}")
    if skip:
        print(f"No RealmEye portal ({len(skip)}): {', '.join(skip)}")


if __name__ == "__main__":
    main()
