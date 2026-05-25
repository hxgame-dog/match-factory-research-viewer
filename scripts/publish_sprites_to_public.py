#!/usr/bin/env python3
"""将 MATCH_FACTORY_ROOT 下导出的 itempack sprites 复制到 public/sprites，并刷新 item_sprite_index。"""
from __future__ import annotations

import os
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MATCH = Path(os.environ.get("MATCH_FACTORY_ROOT", "/Users/fulei/Downloads/match-factory-1-64-246"))
SRC_ROOT = MATCH / "exported" / "addressables_itempack"
DEST_ROOT = ROOT / "public" / "sprites"
BUNDLES = ("itempack-01", "itempack52", "itempackcommon")


def main() -> None:
    if not SRC_ROOT.is_dir():
        print(f"源目录不存在: {SRC_ROOT}")
        print("请先执行 npm run export:itempack")
        sys.exit(1)
    DEST_ROOT.mkdir(parents=True, exist_ok=True)
    total = 0
    for bundle in BUNDLES:
        src = SRC_ROOT / bundle / "sprites"
        dest = DEST_ROOT / bundle
        if not src.is_dir():
            print(f"跳过（无目录）: {src}")
            continue
        if dest.exists():
            shutil.rmtree(dest)
        shutil.copytree(src, dest)
        n = len(list(dest.glob("*.png")))
        total += n
        print(f"已复制 {n} 张 -> {dest}")
    print(f"合计 {total} 张 PNG -> {DEST_ROOT}")
    subprocess.run([sys.executable, str(ROOT / "scripts" / "build_item_sprite_index.py")], check=True)


if __name__ == "__main__":
    main()
