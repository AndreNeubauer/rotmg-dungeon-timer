#!/usr/bin/env python3
"""Download exalt loading-style backgrounds → backgrounds/*.jpg + exalt-backgrounds.json."""

from __future__ import annotations

import io
import json
import shutil
import urllib.request
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
BG_DIR = ROOT / "backgrounds"
OUT_JSON = ROOT / "exalt-backgrounds.json"
MAX_WIDTH = 1600
JPEG_QUALITY = 82

# Loading-style / official exalt art (SaturnZCheery / DECA / community).
# Multiple dungeon ids may share one file when art is thematic, not 1:1 in-game screens.
SOURCES: dict[str, str] = {
    "lost-halls": "https://i.redd.it/di3u10pl5ide1.jpeg",
    "cultist-hideout": "https://i.redd.it/jorjwowejck71.jpg",
    "the-void": "https://i.redd.it/jorjwowejck71.jpg",
    "the-shatters": "https://i.redd.it/fs6lfyhl1lt61.jpg",
    "spectral-penitentiary": "https://i.redd.it/da57wxpo63vd1.png",
    "oryxs-sanctuary": "https://i.redd.it/di3u10pl5ide1.jpeg",
    "moonlight-village": "https://i.redd.it/vk6qqzjxahd71.jpg",
    "fungal-cavern": "https://i.redd.it/b03vdcdxhwd71.jpg",
    "ice-citadel": "https://i.redd.it/drgxxrgv35q61.png",
    "the-nest": "https://i.redd.it/ig3xt6bph5q71.png",
    "crystal-cavern": "https://i.redd.it/b03vdcdxhwd71.jpg",
    "kogbold-steamworks": "https://i.redd.it/drgxxrgv35q61.png",
    "plagued-nest": "https://i.redd.it/vk6qqzjxahd71.jpg",
    "advanced-kogbold-steamworks": "https://i.redd.it/drgxxrgv35q61.png",
}


def download(url: str) -> Image.Image:
    req = urllib.request.Request(url, headers={"User-Agent": "rotmg-dungeon-timer/1.0"})
    with urllib.request.urlopen(req, timeout=90) as resp:
        return Image.open(io.BytesIO(resp.read())).convert("RGB")


def save_compressed(img: Image.Image, path: Path) -> None:
    w, h = img.size
    if w > MAX_WIDTH:
        img = img.resize((MAX_WIDTH, int(h * MAX_WIDTH / w)), Image.LANCZOS)
    img.save(path, "JPEG", quality=JPEG_QUALITY, optimize=True)


def main() -> None:
    BG_DIR.mkdir(parents=True, exist_ok=True)
    url_to_file: dict[str, str] = {}
    backgrounds = []

    for dungeon_id, url in SOURCES.items():
        fname = f"{dungeon_id}.jpg"
        out = BG_DIR / fname
        if url not in url_to_file:
            save_compressed(download(url), out)
            url_to_file[url] = fname
            print(f"saved {fname} ({out.stat().st_size // 1024} KB)")
        else:
            shutil.copy2(BG_DIR / url_to_file[url], out)
            print(f"linked {fname} ← {url_to_file[url]}")
        backgrounds.append({"dungeonId": dungeon_id, "file": fname})

    payload = {
        "note": "Exalt loading-style art. One random background per page load. "
        "In-game screens live in the Exalt client (extract with exalt-extractor); "
        "these are bundled community/official promo pieces.",
        "credit": "SaturnZCheery / DECA Games / RotMG community artists",
        "backgrounds": backgrounds,
    }
    OUT_JSON.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {OUT_JSON.name} — {len(url_to_file)} unique images")


if __name__ == "__main__":
    main()
