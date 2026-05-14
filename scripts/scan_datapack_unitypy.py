#!/usr/bin/env python3
"""UnityPy 枚举 datapack.unity3d / resources.resource 内对象类型与名称（抽样）。"""
from __future__ import annotations

import json
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MATCH = Path(os.environ.get("MATCH_FACTORY_ROOT", "/Users/fulei/Downloads/match-factory-1-64-246"))
BIN = MATCH / "UnityDataAssetPack" / "assets" / "bin" / "Data"
OUT = ROOT / "extracted" / "datapack_scan.json"
PUBLIC = ROOT / "public" / "data" / "datapack_scan.json"


def scan_path(path: Path, max_objects: int = 4000) -> dict:
    if not path.is_file():
        return {"error": "file not found", "path": str(path)}
    try:
        import UnityPy  # type: ignore
    except ImportError:
        return {"error": "UnityPy 未安装", "path": str(path)}

    env = UnityPy.load(str(path))
    type_counts: dict[str, int] = {}
    samples: list[dict] = []
    n = 0
    for obj in env.objects:
        t = obj.type.name
        type_counts[t] = type_counts.get(t, 0) + 1
        if len(samples) < 500 and t in ("TextAsset", "MonoBehaviour", "GameObject", "Sprite", "Texture2D", "AssetBundle"):
            try:
                d = obj.read()
                name = getattr(d, "name", None) or getattr(d, "m_Name", None) or ""
                samples.append({"type": t, "name": str(name)[:120], "container": str(obj.container)[:120]})
            except Exception:
                pass
        n += 1
        if n >= max_objects:
            break

    top_types = sorted(type_counts.items(), key=lambda x: -x[1])[:40]
    return {
        "path": str(path),
        "sizeBytes": path.stat().st_size,
        "objectsScanned": n,
        "typeCount": len(type_counts),
        "topTypes": [{"type": k, "count": v} for k, v in top_types],
        "samples": samples,
    }


def main() -> None:
    dp = BIN / "datapack.unity3d"
    res = BIN / "resources.resource"
    payload = {
        "datapack": scan_path(dp),
        "resources": scan_path(res),
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    PUBLIC.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"datapack_scan -> {PUBLIC}")


if __name__ == "__main__":
    main()
