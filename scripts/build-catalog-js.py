#!/usr/bin/env python3
"""Emit dungeons.js from dungeons.json so the app works without a local server."""

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "dungeons.json"
OUT = ROOT / "dungeons.js"


def main() -> None:
    catalog = json.loads(SRC.read_text(encoding="utf-8"))
    body = json.dumps(catalog, ensure_ascii=False, separators=(",", ":"))
    OUT.write_text(
        f"// Auto-generated from dungeons.json — run: python3 scripts/build-catalog-js.py\n"
        f"window.DUNGEON_CATALOG = {body};\n",
        encoding="utf-8",
    )
    print(f"Wrote {OUT.relative_to(ROOT)} ({OUT.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
