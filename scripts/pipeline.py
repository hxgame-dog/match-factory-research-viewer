#!/usr/bin/env python3
"""
一键：库存统计、CSV/catalog 摄取、关卡索引、libil2cpp strings 过滤、.lvl 魔数抽样、Unity bundle 内 TextAsset 尝试列出。
默认读取环境变量 MATCH_FACTORY_ROOT，否则使用下方 DEFAULT_ROOT。
"""
from __future__ import annotations

import csv
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
import zlib
from collections import Counter, defaultdict
from pathlib import Path

DEFAULT_ROOT = Path("/Users/fulei/Downloads/match-factory-1-64-246")

MATCH_ROOT = Path(os.environ.get("MATCH_FACTORY_ROOT", str(DEFAULT_ROOT)))
UNITY_ASSETS = MATCH_ROOT / "UnityDataAssetPack" / "assets"
EDITOR = UNITY_ASSETS / "Editor"
AA = UNITY_ASSETS / "aa"
IL2CPP = MATCH_ROOT / "config.arm64_v8a" / "lib" / "arm64-v8a" / "libil2cpp.so"

OUT = Path(__file__).resolve().parent.parent / "extracted"
PUBLIC_DATA = Path(__file__).resolve().parent.parent / "public" / "data"


def ensure_dirs() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    PUBLIC_DATA.mkdir(parents=True, exist_ok=True)


def walk_ext_stats(root: Path) -> tuple[dict, dict]:
    counts: Counter[str] = Counter()
    sizes: defaultdict[str, int] = defaultdict(int)
    if not root.is_dir():
        return dict(counts), dict(sizes)
    for dirpath, _, filenames in os.walk(root):
        for f in filenames:
            if f == ".DS_Store":
                continue
            path = Path(dirpath) / f
            ext = f.rsplit(".", 1)[-1].lower() if "." in f else "noext"
            try:
                st = path.stat()
            except OSError:
                continue
            counts[ext] += 1
            sizes[ext] += st.st_size
    return dict(counts), dict(sizes)


def write_inventory_summary() -> dict:
    unity_counts, unity_sizes = walk_ext_stats(UNITY_ASSETS)
    main_counts, main_sizes = walk_ext_stats(MATCH_ROOT / "net.peakgames.match" / "assets")

    lvl_by_bucket: Counter[str] = Counter()
    if UNITY_ASSETS.is_dir():
        for dirpath, _, filenames in os.walk(UNITY_ASSETS):
            for f in filenames:
                if not f.endswith(".lvl"):
                    continue
                rel = Path(dirpath).relative_to(UNITY_ASSETS)
                top = rel.parts[0] if rel.parts else "root"
                lvl_by_bucket[top] += 1

    metadata_paths = list(MATCH_ROOT.rglob("global-metadata.dat"))

    summary = {
        "matchFactoryRoot": str(MATCH_ROOT),
        "unityDataAssetPack": {
            "assetsPath": str(UNITY_ASSETS),
            "totalFiles": sum(unity_counts.values()),
            "totalBytes": sum(unity_sizes.values()),
            "byExtension": [
                {"ext": e, "count": unity_counts[e], "bytes": unity_sizes.get(e, 0)}
                for e in sorted(unity_counts, key=lambda x: (-unity_counts[x], x))
            ],
            "lvlByTopFolder": dict(lvl_by_bucket),
        },
        "mainApkAssets": {
            "assetsPath": str(MATCH_ROOT / "net.peakgames.match" / "assets"),
            "totalFiles": sum(main_counts.values()),
            "totalBytes": sum(main_sizes.values()),
            "byExtension": [
                {"ext": e, "count": main_counts[e], "bytes": main_sizes.get(e, 0)}
                for e in sorted(main_counts, key=lambda x: (-main_counts[x], x))
            ],
        },
        "globalMetadataDat": [str(p) for p in metadata_paths],
        "parseability": {
            "L0": ["Editor/*.csv", "aa/settings.json", "badwords.txt"],
            "L1": ["aa/catalog.json (m_InternalIds)"],
            "L2": ["*.bundle", "datapack.unity3d", "resources.resource"],
            "L3": ["*.lvl", "ud.lvl", "gd.lvl"],
        },
    }
    (OUT / "inventory_summary.json").write_text(
        json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    (PUBLIC_DATA / "inventory_summary.json").write_text(
        json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    return summary


def parse_csv_to_json(csv_path: Path, out_name: str, *, no_header_row: bool = False) -> list[dict]:
    rows: list[dict] = []
    with csv_path.open(newline="", encoding="utf-8", errors="replace") as f:
        reader = csv.reader(f)
        all_rows = [r for r in reader if r and not all(c == "" for c in r)]
    if not all_rows:
        return rows
    if no_header_row:
        max_len = max(len(r) for r in all_rows)
        clean_header = [f"col_{i}" for i in range(max_len)]
        data_rows = all_rows
    else:
        header = all_rows[0]
        data_rows = all_rows[1:]
        clean_header = [h.strip() if h.strip() else f"col_{i}" for i, h in enumerate(header)]
        # 补齐列数
        max_len = max(len(clean_header), max((len(r) for r in data_rows), default=0))
        while len(clean_header) < max_len:
            clean_header.append(f"col_{len(clean_header)}")
    for r in data_rows:
        row = {}
        for i, key in enumerate(clean_header):
            row[key] = r[i] if i < len(r) else ""
        rows.append(row)
    if out_name == "items.json":
        for i, row in enumerate(rows):
            row["ItemId"] = str(i)
    path = OUT / out_name
    path.write_text(json.dumps(rows, ensure_ascii=False, indent=2), encoding="utf-8")
    (PUBLIC_DATA / out_name).write_text(
        json.dumps(rows, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    return rows


def ingest_catalog() -> None:
    cat_path = AA / "catalog.json"
    if not cat_path.is_file():
        return
    data = json.loads(cat_path.read_text(encoding="utf-8"))
    internal_ids: list[str] = data.get("m_InternalIds") or []
    bundles = [x for x in internal_ids if ".bundle" in x]
    asset_keys = [x for x in internal_ids if not x.startswith("{") and ".bundle" not in x]

    bundle_rows = []
    for raw in bundles:
        name = raw.split("/")[-1].replace("{UnityEngine.AddressableAssets.Addressables.RuntimePath}/", "")
        local = UNITY_ASSETS / "aa" / "Android" / Path(raw).name
        size = local.stat().st_size if local.is_file() else None
        bundle_rows.append({"internalId": raw, "fileName": Path(raw).name, "localPath": str(local), "bytes": size})

    bundle_rows.sort(key=lambda x: -(x["bytes"] or 0))

    catalog_out = {
        "locatorId": data.get("m_LocatorId"),
        "buildResultHash": data.get("m_BuildResultHash"),
        "internalIdCount": len(internal_ids),
        "bundlePaths": bundles,
        "bundlesWithLocalFile": bundle_rows,
        "sampleAssetKeys": asset_keys[:200],
        "assetKeyCount": len(asset_keys),
        "allAssetKeys": asset_keys,
        "allBundlePaths": bundles,
    }
    (OUT / "catalog_extract.json").write_text(
        json.dumps(catalog_out, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    (PUBLIC_DATA / "catalog_extract.json").write_text(
        json.dumps(catalog_out, ensure_ascii=False, indent=2), encoding="utf-8"
    )


def copy_settings() -> None:
    src = AA / "settings.json"
    if not src.is_file():
        return
    raw = src.read_text(encoding="utf-8")
    (OUT / "settings.json").write_text(raw, encoding="utf-8")
    # 仅提取可读 URL，避免把巨型 SerializedData 塞进前端
    try:
        j = json.loads(raw)
        urls: list[str] = []
        for loc in j.get("m_CatalogLocations") or []:
            iid = loc.get("m_InternalId")
            if isinstance(iid, str) and iid.startswith("http"):
                urls.append(iid)
        slim = {"m_buildTarget": j.get("m_buildTarget"), "remoteCatalogUrls": urls, "m_AddressablesVersion": j.get("m_AddressablesVersion")}
        (PUBLIC_DATA / "settings_slim.json").write_text(
            json.dumps(slim, ensure_ascii=False, indent=2), encoding="utf-8"
        )
    except json.JSONDecodeError:
        pass


LEVEL_NAME = re.compile(r"Level(\d+)_(\d+)\.lvl$", re.I)


def build_level_index(max_rows: int | None = None) -> list[dict]:
    rows: list[dict] = []
    if not UNITY_ASSETS.is_dir():
        return rows
    for dirpath, _, filenames in os.walk(UNITY_ASSETS):
        for f in filenames:
            if not f.endswith(".lvl") or f in ("ud.lvl", "gd.lvl"):
                continue
            m = LEVEL_NAME.match(f)
            if not m:
                continue
            path = Path(dirpath) / f
            rel = path.relative_to(UNITY_ASSETS)
            top = rel.parts[0] if rel.parts else ""
            try:
                sz = path.stat().st_size
            except OSError:
                sz = 0
            rows.append(
                {
                    "fileName": f,
                    "levelId": int(m.group(1)),
                    "variant": int(m.group(2)),
                    "folder": top,
                    "bytes": sz,
                    "relativePath": str(rel),
                }
            )
            if max_rows and len(rows) >= max_rows:
                break
        if max_rows and len(rows) >= max_rows:
            break
    rows.sort(key=lambda x: (x["levelId"], x["variant"], x["folder"]))
    return rows


def level_histogram(levels: list[dict]) -> dict:
    by_folder: Counter[str] = Counter()
    for r in levels:
        by_folder[r["folder"]] += 1
    # 按千关分桶
    buckets: Counter[str] = Counter()
    for r in levels:
        lid = r["levelId"]
        b = (lid // 1000) * 1000
        buckets[f"{b}-{b+999}"] += 1
    return {"byFolder": dict(by_folder), "levelIdBuckets": dict(sorted(buckets.items()))}


def special_lvl_meta() -> list[dict]:
    out: list[dict] = []
    for name in ("ud.lvl", "gd.lvl"):
        p = UNITY_ASSETS / name
        if not p.is_file():
            continue
        data = p.read_bytes()
        head = data[:64]
        is_sqlite = data[:16] == b"SQLite format 3\x00"
        out.append(
            {
                "fileName": name,
                "bytes": len(data),
                "sha256": hashlib.sha256(data).hexdigest(),
                "headHex": head.hex(),
                "looksLikeSqlite3": is_sqlite,
            }
        )
    return out


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


def run_protoc_decode_raw(lvl_path: Path, protoc: str, max_out: int = 12000) -> dict:
    try:
        data = lvl_path.read_bytes()
    except OSError as e:
        return {"fileName": lvl_path.name, "error": str(e)}
    if data[:16] == b"SQLite format 3\x00":
        return {"fileName": lvl_path.name, "skipped": "sqlite_header"}
    try:
        rel = str(lvl_path.relative_to(UNITY_ASSETS))
    except ValueError:
        rel = str(lvl_path)
    proc = subprocess.run(
        [protoc, "--decode_raw"],
        input=data,
        capture_output=True,
        check=False,
    )
    out = proc.stdout.decode("utf-8", errors="replace")
    err = proc.stderr.decode("utf-8", errors="replace").strip()
    if proc.returncode != 0:
        return {
            "fileName": lvl_path.name,
            "relativePath": rel,
            "returncode": proc.returncode,
            "stderr": err[:2000],
        }
    if len(out) > max_out:
        out = out[:max_out] + "\n... [truncated] ..."
    return {
        "fileName": lvl_path.name,
        "relativePath": rel,
        "bytes": len(data),
        "decodeRawText": out,
    }


def lvl_protobuf_decode_samples() -> dict:
    """使用 google protoc --decode_raw 将 .lvl 视为 Protobuf wire 解析（无 schema，仅结构线索）。"""
    protoc = find_protoc()
    if not protoc:
        return {
            "protoc": None,
            "note": "未找到 protoc，可安装 protobuf 编译器后重新运行 npm run ingest",
            "samples": [],
        }

    levels_dir = UNITY_ASSETS / "Levels"
    dlc_dir = UNITY_ASSETS / "DLCFallbackLevels"
    picks: list[Path] = []
    for name in (
        "Level0001_00.lvl",
        "Level0001_01.lvl",
        "Level0002_00.lvl",
        "Level0002_01.lvl",
        "Level0010_00.lvl",
        "Level0010_01.lvl",
        "Level0500_00.lvl",
        "Level1000_00.lvl",
        "Level7398_00.lvl",
    ):
        p = levels_dir / name
        if p.is_file():
            picks.append(p)
    if dlc_dir.is_dir():
        for p in sorted(dlc_dir.glob("Level*.lvl"))[:2]:
            picks.append(p)

    samples = [run_protoc_decode_raw(p, protoc) for p in picks]
    return {"protoc": protoc, "sampleCount": len(samples), "samples": samples}


def lvl_fingerprints(sample_n: int = 12) -> dict:
    """抽样 .lvl：魔数、是否 zlib、可读 ASCII 片段。"""
    candidates: list[Path] = []
    levels_dir = UNITY_ASSETS / "Levels"
    if levels_dir.is_dir():
        for p in sorted(levels_dir.glob("Level*.lvl")):
            candidates.append(p)
            if len(candidates) >= sample_n:
                break
    samples = []
    for p in candidates:
        data = p.read_bytes()
        head = data[:16]
        is_zlib = len(data) > 2 and data[0] == 0x78 and data[1] in (0x01, 0x9C, 0xDA)
        ascii_snips = re.findall(rb"[A-Za-z][A-Za-z0-9_./-]{4,}", data[:2000])
        dec = None
        if is_zlib:
            try:
                dec = zlib.decompress(data)
            except Exception:
                try:
                    dec = zlib.decompress(data[4:])
                except Exception:
                    dec = None
        samples.append(
            {
                "fileName": p.name,
                "bytes": len(data),
                "headHex": head.hex(),
                "maybeZlibWrapped": is_zlib,
                "decompressedSampleLen": len(dec) if dec else None,
                "asciiSnippets": [s.decode("ascii", errors="ignore") for s in ascii_snips[:8]],
                "maybeProtobufWire": bool(data and data[0] in (0x08, 0x0A, 0x12)),
            }
        )
    return {"sampleCount": len(samples), "samples": samples}


def run_strings_dex() -> dict:
    dex_files = [
        MATCH_ROOT / "net.peakgames.match" / "classes.dex",
        MATCH_ROOT / "net.peakgames.match" / "classes2.dex",
    ]
    kw = re.compile(
        r"(BillingClient|SkuDetails|inapp|subs|purchase|PlayBilling|AdMob|UnityAds|rewarded|interstitial|applovin|ironsource|max_|AudienceNetwork)",
        re.I,
    )
    all_hits: list[str] = []
    for dex in dex_files:
        if not dex.is_file():
            continue
        try:
            proc = subprocess.run(
                ["strings", "-n", "5", str(dex)],
                capture_output=True,
                check=False,
            )
        except FileNotFoundError:
            return {"error": "strings not found", "candidates": []}
        text = proc.stdout.decode("utf-8", errors="ignore")
        for ln in text.splitlines():
            if kw.search(ln) and 5 <= len(ln) <= 220:
                all_hits.append(f"[{dex.name}] {ln}")
    seen: set[str] = set()
    uniq: list[str] = []
    for ln in all_hits:
        if ln not in seen:
            seen.add(ln)
            uniq.append(ln)
    uniq = uniq[:400]
    out = {"lineCount": len(uniq), "candidates": uniq}
    (OUT / "dex_strings_sdk.json").write_text(
        json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    (PUBLIC_DATA / "dex_strings_sdk.json").write_text(
        json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    return out


def run_strings_il2cpp() -> dict:
    if not IL2CPP.is_file():
        return {"error": "libil2cpp.so not found", "candidates": []}
    # macOS strings 命令
    try:
        proc = subprocess.run(
            ["strings", "-n", "4", str(IL2CPP)],
            capture_output=True,
            check=False,
        )
    except FileNotFoundError:
        return {"error": "strings binary not found", "candidates": []}
    text = proc.stdout.decode("utf-8", errors="ignore")
    lines = text.splitlines()
    kw = re.compile(
        r"(sku|product|iap|purchase|billing|subscription|offer|rewarded|interstitial|banner|admob|applovin|ironsource|unityads|max_|ad_unit|placement)",
        re.I,
    )
    hits = [ln for ln in lines if kw.search(ln)]
    # 去重且偏长字符串更像 ID
    seen = set()
    uniq: list[str] = []
    for ln in hits:
        if ln not in seen and 4 <= len(ln) <= 200:
            seen.add(ln)
            uniq.append(ln)
    uniq = uniq[:500]
    out = {"source": str(IL2CPP), "lineCount": len(uniq), "candidates": uniq}
    (OUT / "il2cpp_strings_sdk.json").write_text(
        json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    (PUBLIC_DATA / "il2cpp_strings_sdk.json").write_text(
        json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    return out


def try_unitypy_bundles() -> dict:
    try:
        import UnityPy  # type: ignore
    except ImportError:
        msg = "UnityPy 未安装，跳过 bundle 内资源枚举。可执行: pip install UnityPy"
        stub = {"note": msg, "textAssets": []}
        (OUT / "addressables_unitypy.json").write_text(
            json.dumps(stub, ensure_ascii=False, indent=2), encoding="utf-8"
        )
        (PUBLIC_DATA / "addressables_unitypy.json").write_text(
            json.dumps(stub, ensure_ascii=False, indent=2), encoding="utf-8"
        )
        return stub

    bundle_dir = UNITY_ASSETS / "aa" / "Android"
    text_rows: list[dict] = []
    for bundle in sorted(bundle_dir.glob("*.bundle")):
        env = UnityPy.load(str(bundle))
        for obj in env.objects:
            if obj.type.name == "TextAsset":
                try:
                    data = obj.read()
                    name = getattr(data, "name", "") or ""
                    script = getattr(data, "script", b"") or b""
                    preview = script[:200]
                    text_rows.append(
                        {
                            "bundle": bundle.name,
                            "textAssetName": name,
                            "size": len(script),
                            "previewAscii": preview.decode("utf-8", errors="replace").replace("\x00", ""),
                        }
                    )
                except Exception as e:
                    text_rows.append({"bundle": bundle.name, "error": str(e)})
    result = {"bundleCount": len(list(bundle_dir.glob("*.bundle"))), "textAssets": text_rows}
    (OUT / "addressables_unitypy.json").write_text(
        json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    (PUBLIC_DATA / "addressables_unitypy.json").write_text(
        json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    return result


def main() -> None:
    ensure_dirs()
    print("MATCH_FACTORY_ROOT =", MATCH_ROOT)
    write_inventory_summary()
    print("inventory -> extracted/inventory_summary.json")

    for csv_name in ("items.csv", "level_templates_normal.csv", "level_templates_ease.csv"):
        p = EDITOR / csv_name
        if p.is_file():
            no_hdr = csv_name.startswith("level_templates_")
            parse_csv_to_json(p, csv_name.replace(".csv", ".json"), no_header_row=no_hdr)
            print("csv ->", csv_name)

    ingest_catalog()
    copy_settings()
    print("catalog -> extracted/catalog_extract.json")

    levels = build_level_index()
    hist = level_histogram(levels)
    level_payload = {"levels": levels, "histogram": hist, "total": len(levels)}
    (OUT / "levels_index.json").write_text(
        json.dumps(level_payload, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    (PUBLIC_DATA / "levels_index.json").write_text(
        json.dumps(level_payload, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print("levels index count:", len(levels))

    special = special_lvl_meta()
    fp = lvl_fingerprints()
    pb = lvl_protobuf_decode_samples()
    lvl_doc = {"specialLvlFiles": special, "fingerprints": fp, "protocDecodeRaw": pb}
    (OUT / "lvl_format_notes.json").write_text(
        json.dumps(lvl_doc, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    (PUBLIC_DATA / "lvl_format_notes.json").write_text(
        json.dumps(lvl_doc, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print("lvl fingerprints samples:", len(fp.get("samples", [])))
    print("lvl protoc decode_raw samples:", pb.get("sampleCount", 0))

    run_strings_dex()
    print("dex strings -> extracted/dex_strings_sdk.json")

    run_strings_il2cpp()
    print("il2cpp strings -> extracted/il2cpp_strings_sdk.json")

    try_unitypy_bundles()
    print("unitypy bundles -> extracted/addressables_unitypy.json")

    scripts_dir = Path(__file__).resolve().parent
    post = [
        "extract_lvl_schema_from_dump.py",
        "decode_catalog_blobs.py",
        "fetch_remote_catalog.py",
        "scan_datapack_unitypy.py",
        "build_research_sqlite.py",
        "build_topic_analysis.py",
        "build_item_sprite_index.py",
        "build_level_goals_index.py",
    ]
    if os.environ.get("SKIP_REMOTE_INGEST") == "1":
        post = [p for p in post if p != "fetch_remote_catalog.py"]
    for name in post:
        sp = scripts_dir / name
        if sp.is_file():
            subprocess.run([sys.executable, str(sp)], check=False)

    hints_py = scripts_dir / "extract_il2cpp_hints.py"
    if hints_py.is_file():
        subprocess.run([sys.executable, str(hints_py)], check=False)


if __name__ == "__main__":
    main()
