#!/usr/bin/env python3
"""将 catalog.json 中 base64 二进制段解码，并启发式提取 UTF-8 可读字符串（非完整 Unity 解析）。"""
from __future__ import annotations

import base64
import json
import re
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MATCH = Path(__import__("os").environ.get("MATCH_FACTORY_ROOT", "/Users/fulei/Downloads/match-factory-1-64-246"))
CAT = MATCH / "UnityDataAssetPack" / "assets" / "aa" / "catalog.json"
OUT = ROOT / "extracted" / "catalog_blob_strings.json"
PUBLIC = ROOT / "public" / "data" / "catalog_blob_strings.json"

FIELDS = ("m_KeyDataString", "m_BucketDataString", "m_EntryDataString", "m_ExtraDataString")


def extract_strings(buf: bytes, min_len: int = 4, max_len: int = 200) -> Counter[str]:
    c: Counter[str] = Counter()
    # 连续可打印 ASCII / 常见标点
    for m in re.finditer(rb"[\x20-\x7e]{%d,%d}" % (min_len, max_len), buf):
        s = m.group().decode("ascii", errors="ignore")
        if any(ch.isalpha() for ch in s):
            c[s] += 1
    return c


def main() -> None:
    if not CAT.is_file():
        stub = {"error": "catalog.json 不存在", "blobs": {}}
        OUT.parent.mkdir(parents=True, exist_ok=True)
        OUT.write_text(json.dumps(stub, ensure_ascii=False, indent=2), encoding="utf-8")
        PUBLIC.write_text(json.dumps(stub, ensure_ascii=False, indent=2), encoding="utf-8")
        return

    data = json.loads(CAT.read_text(encoding="utf-8"))
    result: dict = {"catalogPath": str(CAT), "blobs": {}}

    for field in FIELDS:
        b64 = data.get(field)
        if not isinstance(b64, str):
            continue
        try:
            raw = base64.b64decode(b64, validate=False)
        except Exception as e:
            result["blobs"][field] = {"error": str(e)}
            continue
        ctr = extract_strings(raw)
        top = ctr.most_common(400)
        result["blobs"][field] = {
            "decodedBytes": len(raw),
            "uniqueStringCount": len(ctr),
            "topStrings": [{"s": s, "n": n} for s, n in top],
        }

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    PUBLIC.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"catalog_blob_strings -> {PUBLIC}")


if __name__ == "__main__":
    main()
