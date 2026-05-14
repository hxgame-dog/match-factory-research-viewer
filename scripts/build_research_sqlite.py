#!/usr/bin/env python3
"""将已抽取的 JSON 汇总为 SQLite，便于本地 SQL 分析。"""
from __future__ import annotations

import json
import shutil
import sqlite3
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "public" / "data"
DB_PATH = ROOT / "extracted" / "research.db"
PUBLIC_DB = ROOT / "public" / "data" / "research.db"


def load_json(name: str):
    p = DATA / name
    if not p.is_file():
        return None
    return json.loads(p.read_text(encoding="utf-8"))


def main() -> None:
    DATA.mkdir(parents=True, exist_ok=True)
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)

    con = sqlite3.connect(DB_PATH)
    cur = con.cursor()
    cur.executescript(
        """
        PRAGMA journal_mode = WAL;
        DROP TABLE IF EXISTS items;
        DROP TABLE IF EXISTS level_templates_normal;
        DROP TABLE IF EXISTS level_templates_ease;
        DROP TABLE IF EXISTS levels;
        DROP TABLE IF EXISTS catalog_bundle;
        DROP TABLE IF EXISTS catalog_asset_key;
        DROP TABLE IF EXISTS meta;
        """
    )

    items = load_json("items.json")
    if isinstance(items, list) and items:
        keys = list(items[0].keys())
        cols = ", ".join(f'"{k}" TEXT' for k in keys)
        cur.execute(f"CREATE TABLE items ({cols})")
        ph = ", ".join("?" for _ in keys)
        for row in items:
            cur.execute(f"INSERT INTO items VALUES ({ph})", [str(row.get(k, "")) for k in keys])

    for mode in ("normal", "ease"):
        j = load_json(f"level_templates_{mode}.json")
        if not isinstance(j, list) or not j:
            continue
        keys = list(j[0].keys())
        tbl = f"level_templates_{mode}"
        cols = ", ".join(f'"{k}" TEXT' for k in keys)
        cur.execute(f"CREATE TABLE {tbl} ({cols})")
        ph = ", ".join("?" for _ in keys)
        for row in j:
            cur.execute(f"INSERT INTO {tbl} VALUES ({ph})", [str(row.get(k, "")) for k in keys])

    levels_wrapped = load_json("levels_index.json")
    levels = levels_wrapped.get("levels") if isinstance(levels_wrapped, dict) else None
    if isinstance(levels, list) and levels:
        cur.execute(
            """CREATE TABLE levels (
            level_id INTEGER,
            variant INTEGER,
            folder TEXT,
            bytes INTEGER,
            relative_path TEXT,
            file_name TEXT
        )"""
        )
        for r in levels:
            cur.execute(
                "INSERT INTO levels VALUES (?,?,?,?,?,?)",
                (
                    r.get("levelId"),
                    r.get("variant"),
                    r.get("folder"),
                    r.get("bytes"),
                    r.get("relativePath"),
                    r.get("fileName"),
                ),
            )

    cat = load_json("catalog_extract.json")
    cur.execute(
        """CREATE TABLE catalog_bundle (
        idx INTEGER PRIMARY KEY,
        url TEXT,
        file_name TEXT
    )"""
    )
    cur.execute("CREATE TABLE catalog_asset_key (idx INTEGER PRIMARY KEY, key TEXT)")

    if isinstance(cat, dict):
        bundles = cat.get("allBundlePaths") or cat.get("bundlePaths") or []
        for i, url in enumerate(bundles):
            if not isinstance(url, str):
                continue
            fn = url.split("/")[-1]
            cur.execute("INSERT INTO catalog_bundle VALUES (?,?,?)", (i, url, fn))

        keys_list = cat.get("allAssetKeys") or cat.get("sampleAssetKeys") or []
        for i, k in enumerate(keys_list):
            if isinstance(k, str):
                cur.execute("INSERT INTO catalog_asset_key VALUES (?,?)", (i, k))

    cur.execute("CREATE TABLE meta (k TEXT PRIMARY KEY, v TEXT)")
    cur.execute("INSERT INTO meta VALUES (?,?)", ("generated_by", "scripts/build_research_sqlite.py"))

    con.commit()
    con.close()

    shutil.copy2(DB_PATH, PUBLIC_DB)
    kb = PUBLIC_DB.stat().st_size // 1024
    print(f"research.db -> {DB_PATH} , {PUBLIC_DB} ({kb} KB)")


if __name__ == "__main__":
    main()
