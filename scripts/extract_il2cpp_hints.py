#!/usr/bin/env python3
"""从 Il2CppDumper 的 dump.cs / stringliteral.json 抽取研究用线索，写入 public/data。"""
from __future__ import annotations

import json
import re
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DUMP = ROOT / "extracted" / "il2cpp_out" / "dump.cs"
STR_LIT = ROOT / "extracted" / "il2cpp_out" / "stringliteral.json"
OUT_JSON = ROOT / "extracted" / "il2cpp_hints.json"
PUBLIC = ROOT / "public" / "data" / "il2cpp_hints.json"

CLASS_RE = re.compile(r"^\s*(?:public\s+|internal\s+|private\s+)?(?:abstract\s+|sealed\s+)?(?:partial\s+)?class\s+(\w+)")
KEYWORDS = re.compile(
    r"(Level|Lvl|Match|Peak|Template|Protobuf|Serialize|Deserialize|Binary|Message|Grid|Board|Item)",
    re.I,
)

LIT_FILTER = re.compile(
    r"(level|lvl|match|peak|template|billing|sku|purchase|store|shop|reward|"
    r"interstitial|catalog|bundle|addressable|iap|coin|gem|factory|offer|"
    r"subscription|ad_|placement|M_\d|_M_|protobuf|grpc|http)",
    re.I,
)


def printable_ratio(s: str) -> float:
    if not s:
        return 0.0
    ok = sum(1 for c in s if c.isprintable() or c in "\n\t\r")
    return ok / len(s)


def extract_string_literals() -> list[str]:
    if not STR_LIT.is_file():
        return []
    try:
        data = json.loads(STR_LIT.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return []
    out: list[str] = []
    seen: set[str] = set()
    for row in data:
        val = row.get("value")
        if not isinstance(val, str):
            continue
        if len(val) < 6 or len(val) > 180:
            continue
        if printable_ratio(val) < 0.88:
            continue
        if not LIT_FILTER.search(val):
            continue
        v = val.strip()
        if v in seen:
            continue
        seen.add(v)
        out.append(v)
        if len(out) >= 600:
            break
    return sorted(out, key=len)


def group_classes(names: list[str]) -> dict[str, list[str]]:
    groups: dict[str, list[str]] = defaultdict(list)
    for n in sorted(names):
        u = n
        if re.search(r"level|lvl", u, re.I):
            groups["关卡与关卡数据"].append(n)
        elif re.search(r"billing|sku|purchase|shop|store|iap|subscription|offer|coin|gem|economy|wallet", u, re.I):
            groups["经济与内购"].append(n)
        elif re.search(r"ad|reward|interstitial|banner|placement|unityads|admob|applovin", u, re.I):
            groups["广告与激励"].append(n)
        elif re.search(r"addressable|bundle|catalog|asset|resource", u, re.I):
            groups["资源与 Addressables"].append(n)
        elif re.search(r"peak|match|zynga|template|protobuf|serialize|deserialize", u, re.I):
            groups["Peak/Match 与序列化"].append(n)
        else:
            groups["其它命中"].append(n)
    return {k: v for k, v in groups.items() if v}


def main() -> None:
    if not DUMP.is_file():
        stub = {
            "dumpCsExists": False,
            "dumpPath": str(DUMP),
            "note": "请先运行: npm run ingest:il2cpp（需已安装 dotnet）",
            "classHits": [],
            "classGroups": {},
            "stringLiteralHits": [],
            "stringLiteralHitsCount": 0,
            "lineHitsSample": [],
        }
        OUT_JSON.parent.mkdir(parents=True, exist_ok=True)
        PUBLIC.parent.mkdir(parents=True, exist_ok=True)
        OUT_JSON.write_text(json.dumps(stub, ensure_ascii=False, indent=2), encoding="utf-8")
        PUBLIC.write_text(json.dumps(stub, ensure_ascii=False, indent=2), encoding="utf-8")
        print("il2cpp_hints: 已写入占位（无 dump.cs），运行 npm run ingest:il2cpp 可生成 dump 后刷新")
        return

    class_hits: list[str] = []
    seen: set[str] = set()
    line_hits: list[str] = []

    max_lines = 2_500_000
    with DUMP.open(encoding="utf-8", errors="ignore") as f:
        for i, line in enumerate(f, 1):
            if i > max_lines:
                break
            if len(class_hits) < 2500:
                m = CLASS_RE.match(line)
                if m and KEYWORDS.search(m.group(1)):
                    name = m.group(1)
                    if name not in seen:
                        seen.add(name)
                        class_hits.append(name)
            if len(line_hits) < 500 and KEYWORDS.search(line) and (
                "class " in line or "struct " in line or "void " in line
            ):
                s = line.strip()
                if 10 < len(s) < 240:
                    line_hits.append(f"L{i}: {s}")

    class_sorted = sorted(class_hits)
    class_groups = group_classes(class_hits)
    str_lits = extract_string_literals()

    payload = {
        "dumpCsExists": True,
        "dumpPath": str(DUMP),
        "dumpSizeBytes": DUMP.stat().st_size,
        "scannedLineCap": max_lines,
        "classHitsCount": len(class_hits),
        "classHits": class_sorted,
        "classGroups": class_groups,
        "stringLiteralHitsCount": len(str_lits),
        "stringLiteralHits": str_lits,
        "lineHitsSample": line_hits,
    }
    OUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    PUBLIC.parent.mkdir(parents=True, exist_ok=True)
    OUT_JSON.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    PUBLIC.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(
        f"il2cpp hints: {len(class_hits)} classes, {len(class_groups)} groups, "
        f"{len(str_lits)} string literals, {len(line_hits)} line samples -> {PUBLIC}"
    )


if __name__ == "__main__":
    main()
