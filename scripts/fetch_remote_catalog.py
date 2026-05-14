#!/usr/bin/env python3
"""拉取线上 Addressables catalog hash（及可选 catalog json 头），用于与本地对比。"""
from __future__ import annotations

import json
import os
import re
import socket
import urllib.error
import urllib.request
from pathlib import Path

# 避免 TLS/对端无响应时整段 ingest 卡死（默认 45s × 多 URL 仍可能偏长）
_DEFAULT_TIMEOUT = float(os.environ.get("REMOTE_CATALOG_TIMEOUT_SEC", "12"))

ROOT = Path(__file__).resolve().parent.parent
MATCH = Path(os.environ.get("MATCH_FACTORY_ROOT", "/Users/fulei/Downloads/match-factory-1-64-246"))
SETTINGS = MATCH / "UnityDataAssetPack" / "assets" / "aa" / "settings.json"
OUT = ROOT / "extracted" / "remote_catalog_meta.json"
PUBLIC = ROOT / "public" / "data" / "remote_catalog_meta.json"


def find_catalog_base_urls() -> list[str]:
    if not SETTINGS.is_file():
        return ["https://match-prod-client-dlc.matchfactory.com/Android/v6/"]
    try:
        j = json.loads(SETTINGS.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return ["https://match-prod-client-dlc.matchfactory.com/Android/v6/"]
    urls: list[str] = []
    for loc in j.get("m_CatalogLocations") or []:
        iid = loc.get("m_InternalId")
        if isinstance(iid, str) and iid.startswith("http") and "catalog" in iid.lower():
            m = re.match(r"^(https?://.+)/[^/]+$", iid)
            if m:
                urls.append(m.group(1) + "/")
    return urls or ["https://match-prod-client-dlc.matchfactory.com/Android/v6/"]


def fetch(url: str, limit: int = 65536) -> tuple[int, bytes]:
    req = urllib.request.Request(url, headers={"User-Agent": "match-factory-research-viewer/1.0"})
    with urllib.request.urlopen(req, timeout=_DEFAULT_TIMEOUT) as resp:
        code = resp.getcode()
        data = resp.read(limit)
        return code, data


def main() -> None:
    socket.setdefaulttimeout(_DEFAULT_TIMEOUT)
    bases = find_catalog_base_urls()[: int(os.environ.get("REMOTE_CATALOG_MAX_BASES", "2"))]
    payload: dict = {
        "basesTried": bases,
        "timeoutSec": _DEFAULT_TIMEOUT,
        "results": [],
    }
    for base in bases:
        hash_url = base.rstrip("/") + "/catalog_main.hash"
        cat_url = base.rstrip("/") + "/catalog_main.json"
        row: dict = {"base": base}
        try:
            code, body = fetch(hash_url, 4096)
            row["catalog_main.hash"] = {"httpStatus": code, "bodyText": body.decode("utf-8", errors="replace").strip()[:256]}
        except urllib.error.HTTPError as e:
            row["catalog_main.hash"] = {"httpStatus": e.code, "error": str(e)}
        except Exception as e:
            row["catalog_main.hash"] = {"error": str(e)}
        try:
            code, body = fetch(cat_url, 16384)
            row["catalog_main.json"] = {
                "httpStatus": code,
                "firstBytesLen": len(body),
                "prefix": body[:200].decode("utf-8", errors="replace"),
            }
        except urllib.error.HTTPError as e:
            row["catalog_main.json"] = {"httpStatus": e.code, "error": str(e)}
        except Exception as e:
            row["catalog_main.json"] = {"error": str(e)}
        payload["results"].append(row)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    PUBLIC.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"remote_catalog_meta -> {PUBLIC}")


if __name__ == "__main__":
    main()
