#!/usr/bin/env python3
"""生成 items.csv 行号(道具ID) → 策划字段 → 本地 sprite PNG 路径 的索引。"""
from __future__ import annotations

import json
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ITEMS = ROOT / "public" / "data" / "items.json"
MATCH = Path(os.environ.get("MATCH_FACTORY_ROOT", "/Users/fulei/Downloads/match-factory-1-64-246"))
SPRITE_DIRS = [
    MATCH / "exported" / "addressables_itempack" / "itempack-01" / "sprites",
    MATCH / "exported" / "addressables_itempack" / "itempack52" / "sprites",
    MATCH / "exported" / "addressables_itempack" / "itempackcommon" / "sprites",
]
OUT = ROOT / "public" / "data" / "item_sprite_index.json"


def find_sprite(name: str) -> str | None:
    for d in SPRITE_DIRS:
        if not d.is_dir():
            continue
        p = d / f"{name}.png"
        if p.is_file():
            return str(p)
    return None


def main() -> None:
    rows = json.loads(ITEMS.read_text(encoding="utf-8"))
    entries: list[dict] = []
    with_sprite = 0
    for i, r in enumerate(rows):
        name = (r.get("Name") or "").strip()
        sprite = find_sprite(name)
        if sprite:
            with_sprite += 1
        entries.append(
            {
                "itemId": i,
                "name": name,
                "category1": r.get("Category1"),
                "category2": r.get("Category2"),
                "color1": r.get("Color1"),
                "shape": r.get("Shape"),
                "size": r.get("Size"),
                "spritePath": sprite,
                "spriteFile": f"{name}.png" if sprite else None,
            }
        )
    payload = {
        "note": "itemId 为 items.csv 数据行从 0 起的索引，与 .lvl 目标字段 `6/7 { 1: <itemId> }` 一致。",
        "itemsCsvRowCount": len(rows),
        "spritesFound": with_sprite,
        "spriteSearchDirs": [str(d) for d in SPRITE_DIRS],
        "items": entries,
    }
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"item_sprite_index -> {OUT} ({with_sprite}/{len(rows)} 有 PNG)")


if __name__ == "__main__":
    main()
