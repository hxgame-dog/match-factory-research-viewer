#!/usr/bin/env python3
"""
从 UnityDataAssetPack/assets/aa/Android/*.bundle 导出 Texture2D / Sprite 为 PNG。
默认输出到 {MATCH_FACTORY_ROOT}/exported/addressables_itempack/
"""
from __future__ import annotations

import json
import os
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MATCH = Path(os.environ.get("MATCH_FACTORY_ROOT", "/Users/fulei/Downloads/match-factory-1-64-246"))
BUNDLE_DIR = MATCH / "UnityDataAssetPack" / "assets" / "aa" / "Android"
DEFAULT_OUT = MATCH / "exported" / "addressables_itempack"


def safe_name(s: str, max_len: int = 120) -> str:
    s = re.sub(r'[<>:"/\\|?*\x00-\x1f]', "_", s.strip()) or "unnamed"
    return s[:max_len]


def unique_path(folder: Path, base: str, ext: str = ".png") -> Path:
    p = folder / f"{base}{ext}"
    if not p.exists():
        return p
    n = 2
    while True:
        p = folder / f"{base}_{n}{ext}"
        if not p.exists():
            return p
        n += 1


def export_bundle(bundle_path: Path, out_root: Path) -> dict:
    try:
        import UnityPy  # type: ignore
    except ImportError:
        return {"bundle": bundle_path.name, "error": "UnityPy 未安装: pip install UnityPy"}

    short = bundle_path.stem.split("_default_")[0] if "_default_" in bundle_path.stem else bundle_path.stem
    tex_dir = out_root / short / "textures"
    spr_dir = out_root / short / "sprites"
    tex_dir.mkdir(parents=True, exist_ok=True)
    spr_dir.mkdir(parents=True, exist_ok=True)

    env = UnityPy.load(str(bundle_path))
    stats = {
        "bundle": bundle_path.name,
        "bundleShort": short,
        "texturesExported": 0,
        "texturesSkipped": 0,
        "spritesExported": 0,
        "spritesSkipped": 0,
        "errors": 0,
        "manifest": [],
    }

    for obj in env.objects:
        t = obj.type.name
        if t not in ("Texture2D", "Sprite"):
            continue
        try:
            data = obj.read()
        except Exception as e:
            stats["errors"] += 1
            continue
        name = safe_name(str(getattr(data, "name", None) or getattr(data, "m_Name", None) or "unnamed"))
        img = getattr(data, "image", None)
        if img is None:
            if t == "Texture2D":
                stats["texturesSkipped"] += 1
            else:
                stats["spritesSkipped"] += 1
            continue
        folder = tex_dir if t == "Texture2D" else spr_dir
        out_path = unique_path(folder, name)
        try:
            img.save(out_path)
        except Exception:
            stats["errors"] += 1
            continue
        w, h = img.size
        entry = {
            "type": t,
            "name": name,
            "file": str(out_path.relative_to(out_root)),
            "width": w,
            "height": h,
            "bytes": out_path.stat().st_size,
        }
        stats["manifest"].append(entry)
        if t == "Texture2D":
            stats["texturesExported"] += 1
        else:
            stats["spritesExported"] += 1

    return stats


def main() -> None:
    out = Path(os.environ.get("ITEMPACK_EXPORT_DIR", str(DEFAULT_OUT)))
    out.mkdir(parents=True, exist_ok=True)

    if not BUNDLE_DIR.is_dir():
        print(f"bundle 目录不存在: {BUNDLE_DIR}")
        raise SystemExit(1)

    bundles = sorted(BUNDLE_DIR.glob("*.bundle"))
    if not bundles:
        print(f"未找到 .bundle: {BUNDLE_DIR}")
        raise SystemExit(1)

    print(f"MATCH_FACTORY_ROOT = {MATCH}")
    print(f"输出目录 = {out}")
    print(f"bundle 数量 = {len(bundles)}")

    all_stats: list[dict] = []
    for bp in bundles:
        print(f"导出 {bp.name} ...")
        st = export_bundle(bp, out)
        all_stats.append(st)
        if st.get("error"):
            print(f"  错误: {st['error']}")
        else:
            print(
                f"  Texture2D: {st['texturesExported']} 张, "
                f"Sprite: {st['spritesExported']} 张, "
                f"跳过/失败: tex={st['texturesSkipped']} spr={st['spritesSkipped']} err={st['errors']}"
            )

    summary = {
        "matchFactoryRoot": str(MATCH),
        "bundleDir": str(BUNDLE_DIR),
        "outputDir": str(out),
        "bundles": all_stats,
        "totals": {
            "texturesExported": sum(s.get("texturesExported", 0) for s in all_stats),
            "spritesExported": sum(s.get("spritesExported", 0) for s in all_stats),
        },
    }
    manifest_path = out / "export_manifest.json"
    manifest_path.write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\n完成 -> {out}")
    print(f"清单 -> {manifest_path}")
    print(
        f"合计 PNG: Texture2D {summary['totals']['texturesExported']}, "
        f"Sprite {summary['totals']['spritesExported']}"
    )


if __name__ == "__main__":
    main()
