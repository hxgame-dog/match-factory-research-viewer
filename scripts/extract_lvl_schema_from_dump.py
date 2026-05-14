#!/usr/bin/env python3
"""从 Il2Cpp dump.cs 提取 Data.Level 下核心 Protobuf 消息的 FieldNumber 定义。"""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DUMP = ROOT / "extracted" / "il2cpp_out" / "dump.cs"
OUT = ROOT / "extracted" / "lvl_protobuf_schema.json"
PUBLIC = ROOT / "public" / "data" / "lvl_protobuf_schema.json"

TARGETS = frozenset({"LevelData", "LevelBaseData", "LevelItemData", "LevelSeedRule"})
CLASS_START = re.compile(r"^public sealed class (\w+)\s*[:\{]")
FIELD_NUM = re.compile(r"^\s*public const int (\w+)FieldNumber = (\d+);")


def main() -> None:
    if not DUMP.is_file():
        stub = {"dumpCsExists": False, "note": "需先有 extracted/il2cpp_out/dump.cs", "messages": {}}
        OUT.parent.mkdir(parents=True, exist_ok=True)
        PUBLIC.parent.mkdir(parents=True, exist_ok=True)
        OUT.write_text(json.dumps(stub, ensure_ascii=False, indent=2), encoding="utf-8")
        PUBLIC.write_text(json.dumps(stub, ensure_ascii=False, indent=2), encoding="utf-8")
        print("lvl_protobuf_schema: 跳过（无 dump.cs）")
        return

    current: str | None = None
    fields: dict[str, list[dict[str, str | int]]] = {t: [] for t in TARGETS}

    with DUMP.open(encoding="utf-8", errors="ignore") as f:
        for line in f:
            if "\t// Methods" in line or line.strip() == "// Methods":
                current = None
                continue
            m = CLASS_START.match(line)
            if m:
                name = m.group(1)
                current = name if name in TARGETS else None
                continue
            if current is None:
                continue
            fm = FIELD_NUM.match(line)
            if fm:
                fname = fm.group(1)
                num = int(fm.group(2))
                fields[current].append({"field": fname, "number": num, "wireNote": _wire_note(fname)})

    # 去重（同一 field 可能重复扫描到）—按 number 保留首次
    cleaned: dict[str, list[dict]] = {}
    for cls, rows in fields.items():
        seen: set[int] = set()
        uniq = []
        for r in sorted(rows, key=lambda x: x["number"]):
            n = r["number"]
            if n in seen:
                continue
            seen.add(n)
            uniq.append(r)
        cleaned[cls] = uniq

    payload = {
        "dumpCsExists": True,
        "namespace": "Data.Level",
        "source": "Il2CppDumper dump.cs（Google.Protobuf 生成代码中的 FieldNumber 常量）",
        "messages": cleaned,
        "decodeRawHints": {
            "LevelBaseData": "对应多数 `LevelXXXX_00.lvl` 等小体积文件：关卡号、Goal/Board 尺寸列表等。",
            "LevelData": "对应 `LevelXXXX_01` 等变体：Name、Duration、Goals/Board 条目、SeedRules。",
            "LevelItemData": "Goals / Board 中每条：ItemType、Count、可选 Data 字符串。",
            "LevelSeedRule": "字段 8 的子消息：失败次数起点、种子选择、种子列表与权重。",
        },
    }
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    PUBLIC.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"lvl_protobuf_schema -> {PUBLIC}")


def _wire_note(fname: str) -> str:
    if fname in (
        "Goals",
        "Board",
        "GoalMaxSizes",
        "BoardMaxSizes",
        "Seeds",
        "SeedWeights",
        "SeedRules",
    ):
        return "repeated / packed，decode_raw 中多为嵌套块"
    return "varint 或 string，见 decode_raw 输出"


if __name__ == "__main__":
    main()
