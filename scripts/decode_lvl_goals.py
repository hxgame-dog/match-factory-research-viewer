#!/usr/bin/env python3
"""
解析 *_01.lvl 等 Protobuf decode_raw 文本中的 field 6/7 目标，并对照 items + sprite。
用法: python3 scripts/decode_lvl_goals.py path/to/Level0001_01.lvl
       python3 scripts/decode_lvl_goals.py --from-notes Level0001_01.lvl
"""
from __future__ import annotations

import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ITEMS = ROOT / "public" / "data" / "items.json"
INDEX = ROOT / "public" / "data" / "item_sprite_index.json"
NOTES = ROOT / "public" / "data" / "lvl_format_notes.json"
MATCH = Path("/Users/fulei/Downloads/match-factory-1-64-246")
LEVELS = MATCH / "UnityDataAssetPack" / "assets" / "Levels"


def load_items() -> list[dict]:
    return json.loads(ITEMS.read_text(encoding="utf-8"))


def parse_decode_raw(text: str) -> dict:
    level_id = None
    template = None
    duration = None
    field5 = None
    m1 = re.search(r"^1:\s*(\d+)", text, re.M)
    if m1:
        level_id = int(m1.group(1))
    m2 = re.search(r'^2:\s*"([^"]*)"', text, re.M)
    if m2:
        template = m2.group(1)
    m3 = re.search(r"^3:\s*(\d+)", text, re.M)
    if m3:
        duration = int(m3.group(1))
    m5 = re.search(r"^5:\s*(\d+)", text, re.M)
    if m5:
        field5 = int(m5.group(1))
    goals6: list[tuple[int, int]] = []
    goals7: list[tuple[int, int]] = []
    blocks = re.findall(r"(6|7)\s*\{\s*1:\s*(\d+)\s*2:\s*(\d+)\s*\}", text)
    for kind, iid, cnt in blocks:
        if kind == "6":
            goals6.append((int(iid), int(cnt)))
        else:
            goals7.append((int(iid), int(cnt)))
    return {
        "levelId": level_id,
        "template": template,
        "duration": duration,
        "field5": field5,
        "collectGoals": [{"itemId": a, "count": b} for a, b in goals6],
        "boardGoals": [{"itemId": a, "count": b} for a, b in goals7],
    }


def protoc_decode(path: Path) -> str:
    protoc = "/opt/anaconda3/bin/protoc"
    import shutil

    protoc = shutil.which("protoc") or protoc
    r = subprocess.run([protoc, "--decode_raw"], input=path.read_bytes(), capture_output=True)
    if r.returncode != 0:
        raise RuntimeError(r.stderr.decode())
    return r.stdout.decode()


def resolve_item(item_id: int, items: list[dict]) -> dict:
    if 0 <= item_id < len(items):
        row = items[item_id]
        return {"itemId": item_id, "name": row.get("Name"), "row": row}
    return {"itemId": item_id, "name": None, "error": "超出 items 表范围"}


def main() -> None:
    args = sys.argv[1:]
    if not args:
        print(__doc__)
        sys.exit(1)
    items = load_items()
    if args[0] == "--from-notes":
        name = args[1]
        notes = json.loads(NOTES.read_text())
        text = None
        for s in notes.get("protocDecodeRaw", {}).get("samples", []):
            if s.get("fileName") == name:
                text = s.get("decodeRawText")
                break
        if not text:
            print("lvl_format_notes 中无此样例:", name)
            sys.exit(1)
        parsed = parse_decode_raw(text)
        print(json.dumps(parsed, ensure_ascii=False, indent=2))
        for label, goals in [("收集目标 field#6", parsed["collectGoals"]), ("棋盘投放 field#7", parsed["boardGoals"])]:
            print(f"\n{label}:")
            for g in goals:
                r = resolve_item(g["itemId"], items)
                print(f"  ID {g['itemId']} × {g['count']} -> {r.get('name')} ({r['row'].get('Category1') if r.get('row') else '?'})")
        return

    path = Path(args[0])
    if not path.is_file():
        path = LEVELS / path.name
    text = protoc_decode(path)
    print(text)
    parsed = parse_decode_raw(text)
    print("\n--- 解析 ---")
    print(json.dumps(parsed, ensure_ascii=False, indent=2))
    for label, goals in [("收集目标 field#6", parsed["collectGoals"]), ("棋盘投放 field#7", parsed["boardGoals"])]:
        print(f"\n{label}:")
        for g in goals:
            r = resolve_item(g["itemId"], items)
            print(f"  ID {g['itemId']} × {g['count']} -> {r.get('name')}")


if __name__ == "__main__":
    main()
