#!/usr/bin/env python3
"""生成 items.csv 行号(道具ID) → 策划字段 → 本地/线上 sprite URL 的索引。"""
from __future__ import annotations

import json
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ITEMS = ROOT / "public" / "data" / "items.json"
MATCH = Path(os.environ.get("MATCH_FACTORY_ROOT", "/Users/fulei/Downloads/match-factory-1-64-246"))
PUBLIC_SPRITE_ROOT = ROOT / "public" / "sprites"
BUNDLES = ("itempack-01", "itempack52", "itempackcommon")
OUT = ROOT / "public" / "data" / "item_sprite_index.json"


def find_sprite_paths(name: str) -> tuple[str | None, str | None]:
    """返回 (publicUrl 站点路径, 本机绝对路径)。"""
    for bundle in BUNDLES:
        pub = PUBLIC_SPRITE_ROOT / bundle / f"{name}.png"
        if pub.is_file():
            return f"/sprites/{bundle}/{name}.png", str(pub)
        local = MATCH / "exported" / "addressables_itempack" / bundle / "sprites" / f"{name}.png"
        if local.is_file():
            return f"/sprites/{bundle}/{name}.png", str(local)
    return None, None


def main() -> None:
    rows = json.loads(ITEMS.read_text(encoding="utf-8"))
    entries: list[dict] = []
    with_sprite = 0
    for i, r in enumerate(rows):
        name = (r.get("Name") or "").strip()
        public_url, sprite_path = find_sprite_paths(name)
        if public_url:
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
                "publicUrl": public_url,
                "spritePath": sprite_path,
                "spriteFile": f"{name}.png" if public_url else None,
            }
        )
    payload = {
        "note": "itemId 为 items.csv 数据行从 0 起的索引；publicUrl 为站点静态路径（public/sprites），线上 Vercel 可直接预览。",
        "itemsCsvRowCount": len(rows),
        "spritesFound": with_sprite,
        "publicSpriteBundles": list(BUNDLES),
        "items": entries,
    }
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"item_sprite_index -> {OUT} ({with_sprite}/{len(rows)} 有 PNG)")


if __name__ == "__main__":
    main()
