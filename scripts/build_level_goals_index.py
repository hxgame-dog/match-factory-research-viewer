#!/usr/bin/env python3
"""
批量 protoc --decode_raw 解析 *_01.lvl，生成 level_goals_index.json 供「关卡预览」页使用。
道具贴图仍来自 items.ItemId + public/sprites；模板表仅补充时长/难度/数量列。
"""
from __future__ import annotations

import json
import os
import re
import shutil
import subprocess
import sys
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MATCH = Path(os.environ.get("MATCH_FACTORY_ROOT", "/Users/fulei/Downloads/match-factory-1-64-246"))
ASSETS = MATCH / "UnityDataAssetPack" / "assets"
OUT = ROOT / "public" / "data" / "level_goals_index.json"
LEVELS_INDEX = ROOT / "public" / "data" / "levels_index.json"


def find_protoc() -> str | None:
    for cand in (
        shutil.which("protoc"),
        "/opt/anaconda3/bin/protoc",
        "/usr/local/bin/protoc",
        "/opt/homebrew/bin/protoc",
    ):
        if cand and Path(cand).is_file():
            return cand
    return None


def parse_decode_raw(text: str) -> dict:
    blocks = re.findall(r"(6|7)\s*\{\s*1:\s*(\d+)\s*2:\s*(\d+)\s*\}", text)
    collect, board = [], []
    for kind, iid, cnt in blocks:
        g = {"itemId": int(iid), "count": int(cnt)}
        if kind == "6":
            collect.append(g)
        else:
            board.append(g)
    m1 = re.search(r"^1:\s*(\d+)", text, re.M)
    m2 = re.search(r'^2:\s*"([^"]*)"', text, re.M)
    m3 = re.search(r"^3:\s*(\d+)", text, re.M)
    m5 = re.search(r"^5:\s*(\d+)", text, re.M)
    return {
        "levelId": int(m1.group(1)) if m1 else None,
        "templateKey": m2.group(1) if m2 else None,
        "duration": int(m3.group(1)) if m3 else None,
        "field5": int(m5.group(1)) if m5 else None,
        "collectGoals": collect,
        "boardGoals": board,
    }


def load_template_by_id(mode: str) -> dict[int, dict]:
    p = ROOT / "public" / "data" / f"level_templates_{mode}.json"
    if not p.is_file():
        return {}
    rows = json.loads(p.read_text(encoding="utf-8"))
    out: dict[int, dict] = {}
    for r in rows:
        try:
            tid = int(str(r.get("col_0", "")).strip())
        except ValueError:
            continue
        counts = []
        for k, v in r.items():
            if not k.startswith("col_") or k in ("col_0", "col_1", "col_2", "col_3"):
                continue
            vs = str(v).strip()
            if vs.isdigit():
                counts.append(int(vs))
        out[tid] = {
            "templateDuration": str(r.get("col_1", "")).strip() or None,
            "templateDifficulty": str(r.get("col_3", "")).strip() or None,
            "templateCounts": counts,
        }
    return out


def pick_lvl_path(entries: list[dict]) -> dict | None:
    levels_first = [e for e in entries if e.get("folder") == "Levels"]
    pool = levels_first or entries
    return min(pool, key=lambda x: (x.get("variant", 99), x.get("bytes", 0)))


def main() -> None:
    protoc = find_protoc()
    if not protoc:
        print("未找到 protoc，无法生成 level_goals_index.json")
        sys.exit(1)

    if not LEVELS_INDEX.is_file():
        print(f"缺少 {LEVELS_INDEX}，请先 npm run ingest")
        sys.exit(1)

    idx = json.loads(LEVELS_INDEX.read_text(encoding="utf-8"))
    by_lid: dict[int, list[dict]] = defaultdict(list)
    for row in idx.get("levels") or []:
        if str(row.get("fileName", "")).endswith("_01.lvl"):
            by_lid[int(row["levelId"])].append(row)

    tpl_normal = load_template_by_id("normal")
    tpl_ease = load_template_by_id("ease")

    levels_out: list[dict] = []
    errors = 0
    total = len(by_lid)
    for i, lid in enumerate(sorted(by_lid.keys()), 1):
        pick = pick_lvl_path(by_lid[lid])
        if not pick:
            continue
        rel = pick["relativePath"]
        path = ASSETS / rel
        if not path.is_file():
            errors += 1
            continue
        proc = subprocess.run(
            [protoc, "--decode_raw"],
            input=path.read_bytes(),
            capture_output=True,
        )
        if proc.returncode != 0:
            errors += 1
            continue
        text = proc.stdout.decode("utf-8", errors="replace")
        parsed = parse_decode_raw(text)
        entry = {
            "levelId": lid,
            "templateKey": parsed.get("templateKey"),
            "duration": parsed.get("duration"),
            "field5": parsed.get("field5"),
            "collectGoals": parsed["collectGoals"],
            "boardGoals": parsed["boardGoals"],
            "relativePath": rel,
            "folder": pick.get("folder"),
            "templateNormal": tpl_normal.get(lid),
            "templateEase": tpl_ease.get(lid),
        }
        levels_out.append(entry)
        if i % 500 == 0:
            print(f"  已解析 {i}/{total} …")

    payload = {
        "version": 1,
        "generatedBy": "scripts/build_level_goals_index.py",
        "levelCount": len(levels_out),
        "parseErrors": errors,
        "note": "collectGoals/boardGoals 来自 *_01.lvl；templateCounts 仅为模板表数量列，不含道具 ID。",
        "levels": levels_out,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"level_goals_index -> {OUT} ({len(levels_out)} 关, errors={errors})")


if __name__ == "__main__":
    main()
