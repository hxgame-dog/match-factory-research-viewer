#!/usr/bin/env python3
"""
专题逆向聚合：关卡、关卡数值（模板表）、物品、计费、广告。
输出 public/data/topic_analysis.json 供「专题分析」页展示。
"""
from __future__ import annotations

import json
import re
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "public" / "data"
OUT = DATA / "topic_analysis.json"


def load_json(name: str):
    p = DATA / name
    if not p.is_file():
        return None
    return json.loads(p.read_text(encoding="utf-8"))


def level_id_variant_heatmap(levels: list[dict], num_bins: int = 20) -> dict | None:
    """关卡 ID 等宽分桶 × 变体：矩阵元素为 levels_index 中的文件行数。"""
    if not levels:
        return None
    ids = [int(x.get("levelId") or 0) for x in levels]
    lo, hi = min(ids), max(ids)
    if lo > hi:
        return None
    variants = sorted({int(x.get("variant") or 0) for x in levels})
    span = hi - lo + 1
    bin_w = max(1, (span + num_bins - 1) // num_bins)
    matrix: list[list[int]] = [[0 for _ in variants] for _ in range(num_bins)]
    for x in levels:
        lid = int(x.get("levelId") or 0)
        v = int(x.get("variant") or 0)
        if v not in variants:
            continue
        bi = min(num_bins - 1, max(0, (lid - lo) // bin_w))
        vi = variants.index(v)
        matrix[bi][vi] += 1
    row_labels: list[str] = []
    for bi in range(num_bins):
        a = lo + bi * bin_w
        b = min(hi, lo + (bi + 1) * bin_w - 1)
        row_labels.append(f"{a}–{b}")
    flat = [c for row in matrix for c in row]
    return {
        "rowLabels": row_labels,
        "colLabels": [str(v) for v in variants],
        "matrix": matrix,
        "maxCell": max(flat) if flat else 0,
        "note": "按 levels_index 行计数；同一 levelId+variant 可能在 Levels 与 DLCFallback 各占一行。",
    }


def pct_hist(values: list[int], bins: int = 12) -> list[dict]:
    if not values:
        return []
    lo, hi = min(values), max(values)
    if lo == hi:
        return [{"range": str(lo), "count": len(values)}]
    step = max(1, (hi - lo) // bins)
    c: Counter[str] = Counter()
    for v in values:
        b = lo + (v - lo) // step * step
        b2 = b + step - 1
        c[f"{b}-{b2}"] += 1
    return [{"range": k, "count": v} for k, v in sorted(c.items(), key=lambda x: int(x[0].split("-")[0]))]


def section_levels() -> dict:
    j = load_json("levels_index.json") or {}
    levels = j.get("levels") or []
    by_folder = Counter(x.get("folder") for x in levels)
    variants = Counter(x.get("variant") for x in levels)
    sizes = [int(x.get("bytes") or 0) for x in levels]
    heat = level_id_variant_heatmap(levels, num_bins=20) if levels else None
    return {
        "title": "关卡文件（.lvl）",
        "reverseNote": "二进制为 Google Protobuf；LevelBaseData（多为 *_00）与 LevelData（多为 *_01+）字段见 lvl_protobuf_schema.json。",
        "totalLevels": len(levels),
        "byFolder": dict(by_folder),
        "variantDistribution": {str(k): v for k, v in sorted(variants.items())},
        "bytesHistogram": pct_hist(sizes)[:20],
        "bytesMin": min(sizes) if sizes else 0,
        "bytesMax": max(sizes) if sizes else 0,
        "levelIdVariantHeatmap": heat,
        "protobufSchemaRef": "/research",
        "decodeRawRef": "/lvl",
    }


def _collect_int_column(rows: list[dict], col: str) -> list[int]:
    vals: list[int] = []
    for r in rows:
        v = str(r.get(col, "")).strip()
        if v.isdigit() or (v.startswith("-") and v[1:].isdigit()):
            vals.append(int(v))
    return vals


def numeric_col_stats(rows: list[dict], col_keys: list[str], sample: int = 2000) -> dict:
    out: dict = {}
    for ck in col_keys:
        vals = _collect_int_column(rows[:sample], ck)
        if len(vals) < 5:
            continue
        vals.sort()
        out[ck] = {
            "count": len(vals),
            "min": vals[0],
            "max": vals[-1],
            "median": vals[len(vals) // 2],
        }
    return out


def section_level_numerics() -> dict:
    out: dict = {
        "title": "关卡数值（模板表 CSV）",
        "reverseNote": "源文件无表头；ingest 后列为 col_0..。col_0 为模板 ID；col_1 在样本中多为时长类整数；其余列为棋盘/目标尺寸与布尔标记，需对照 LevelDataParserUtil / 模板工具链。",
        "sources": [
            "UnityDataAssetPack/assets/Editor/level_templates_normal.csv",
            "UnityDataAssetPack/assets/Editor/level_templates_ease.csv",
        ],
        "modes": {},
    }
    for mode in ("normal", "ease"):
        rows = load_json(f"level_templates_{mode}.json")
        if not isinstance(rows, list) or not rows:
            continue
        keys = list(rows[0].keys())[:56]
        stats = numeric_col_stats(rows, [k for k in keys if k.startswith("col_")][:24])
        out["modes"][mode] = {
            "rowCount": len(rows),
            "columnKeysSample": keys[:24],
            "numericColumnStats": stats,
        }
    return out


def level_numerics_research_paragraphs() -> list[str]:
    """基于全表整数列统计，为「研究报告」生成可复核的关卡数值结论（与专题 Tab 互补）。"""
    normal = load_json("level_templates_normal.json")
    ease = load_json("level_templates_ease.json")
    if not isinstance(normal, list) or not isinstance(ease, list) or not normal or not ease:
        return ["未能加载 level_templates_normal.json / level_templates_ease.json，本段自动数值对照跳过。"]
    rn, re_ = len(normal), len(ease)
    cols_n = {k for k in normal[0].keys() if k.startswith("col_")}
    cols_e = {k for k in ease[0].keys() if k.startswith("col_")}
    cols = sorted(cols_n & cols_e, key=lambda x: int(x.split("_")[1]))
    if not cols:
        return ["模板表无 col_* 列名，跳过数值分析。"]

    paras: list[str] = []
    paras.append(
        f"专题页「关卡数值」中的 min/median/max 条带图默认基于各模式前 2000 行抽样；**以下段落基于全表**：normal {rn} 行、ease {re_} 行。对每一列仅统计可解析为整数的单元格，空值或非整数不计入该列样本量 n。"
    )

    v0n = _collect_int_column(normal, "col_0")
    v0e = _collect_int_column(ease, "col_0")
    if len(v0n) >= 5 and len(v0e) >= 5:
        v0n.sort()
        v0e.sort()
        paras.append(
            f"`col_0`（模板行 ID 轴）：normal 整数样本 n={len(v0n)}，区间 [{v0n[0]}, {v0n[-1]}]，中位数 {v0n[len(v0n) // 2]}；ease n={len(v0e)}，区间 [{v0e[0]}, {v0e[-1]}]，中位数 {v0e[len(v0e) // 2]}。与「每行一条模板」索引一致。"
        )

    v1n = _collect_int_column(normal, "col_1")
    v1e = _collect_int_column(ease, "col_1")
    if len(v1n) >= 5 and len(v1e) >= 5:
        v1n.sort()
        v1e.sort()
        paras.append(
            f"`col_1`（样本中呈集中整数分布，常见解读为时长类秒数，需对照 LevelDataParserUtil 确认）：normal 中位 {v1n[len(v1n) // 2]}、区间 [{v1n[0]}, {v1n[-1]}]；ease 中位 {v1e[len(v1e) // 2]}、区间 [{v1e[0]}, {v1e[-1]}]。两模式极值与中位接近时，说明全局时长带一致，差异更多落在后续列。"
        )

    min_rows = min(rn, re_)
    sparse_thr = 0.45
    sparse: list[tuple[str, int, int]] = []
    relax: list[tuple[str, int, int, int, int]] = []
    tighten: list[tuple[str, int, int]] = []

    for col in cols:
        if col in ("col_0", "col_1"):
            continue
        vn = _collect_int_column(normal, col)
        ve = _collect_int_column(ease, col)
        if len(vn) < 5 or len(ve) < 5:
            continue
        vn.sort()
        ve.sort()
        med_n, med_e = vn[len(vn) // 2], ve[len(ve) // 2]
        max_n, max_e = vn[-1], ve[-1]
        if len(vn) < rn * sparse_thr or len(ve) < re_ * sparse_thr:
            sparse.append((col, len(vn), len(ve)))
        need = max(50, int(min_rows * 0.12))
        if len(vn) >= need and len(ve) >= need and med_e < med_n:
            relax.append((col, med_n, med_e, max_n, max_e))
        if len(vn) >= need and len(ve) >= need and med_e > med_n:
            tighten.append((col, med_n, med_e))

    relax.sort(key=lambda x: x[1] - x[2], reverse=True)
    if relax:
        bits = [
            f"{c}（normal 中位 {mn}→ease {me}；max {mxn}→{mxe}）"
            for c, mn, me, mxn, mxe in relax[:10]
        ]
        paras.append(
            "ease 相对 normal **中位数下降**的列（两表整数样本均 ≥12% 行数或至少 50 行）按降幅排序，前几项为："
            + "；".join(bits)
            + "。可归纳：宽松模板在多个数值维度上系统性地低于普通模板；各列对应棋盘/目标/标记位仍需反编译对齐。"
        )

    if sparse:
        sparse.sort(key=lambda t: min(t[1], t[2]))
        bits2 = [f"{c}（n_normal={a}，n_ease={b}）" for c, a, b in sparse[:14]]
        paras.append(
            "以下列在全表范围内整数稀疏（任一侧 n 低于约 45% 行数），更像条件字段或仅部分关卡生效的参数，与专题页上 `n` 明显小于 2000 的现象一致："
            + "；".join(bits2)
            + "。"
        )

    if tighten:
        tighten.sort(key=lambda x: x[2] - x[1], reverse=True)
        bits3 = [f"{c}（{mn}→{me}）" for c, mn, me in tighten[:8]]
        paras.append(
            "少数列在 ease 中位数**高于** normal：" + "；".join(bits3)
            + "。说明该列不一定单调表示「难度」，或为边界模板/噪声；建议按模板 ID 对齐抽查 `.lvl` 与运行时 Ease 字段。"
        )

    return paras


def section_items() -> dict:
    rows = load_json("items.json")
    if not isinstance(rows, list):
        return {"title": "物品", "error": "无 items.json"}
    c1 = Counter((r.get("Category1") or "").strip() or "(空)" for r in rows)
    c2 = Counter((r.get("Category2") or "").strip() or "(空)" for r in rows)
    shape = Counter((r.get("Shape") or "").strip() or "(空)" for r in rows)
    return {
        "title": "物品（items.csv）",
        "reverseNote": "策划向维度：Name、Category1/2、Color、Shape、Size 等；与关卡内 ItemType 枚举的映射在 Il2Cpp / 运行时表中。",
        "total": len(rows),
        "byCategory1": dict(c1.most_common(40)),
        "byCategory2": dict(c2.most_common(30)),
        "byShape": dict(shape.most_common(20)),
    }


def classify_lines(lines: list[str], rules: list[tuple[str, re.Pattern]]) -> dict[str, list[str]]:
    buckets: dict[str, list[str]] = {name: [] for name, _ in rules}
    buckets["其它"] = []
    seen: set[str] = set()
    for raw in lines:
        s = raw.strip()
        if len(s) < 6 or s in seen:
            continue
        seen.add(s)
        placed = False
        for name, pat in rules:
            if pat.search(s):
                if len(buckets[name]) < 120:
                    buckets[name].append(s)
                placed = True
                break
        if not placed and len(buckets["其它"]) < 80:
            buckets["其它"].append(s)
    return buckets


def classify_line_counts(lines: list[str], rules: list[tuple[str, re.Pattern]]) -> dict[str, int]:
    """与 classify_lines 相同去重与匹配顺序，仅统计命中条数（不截断样本）。"""
    counts: dict[str, int] = {name: 0 for name, _ in rules}
    counts["其它"] = 0
    seen: set[str] = set()
    for raw in lines:
        s = raw.strip()
        if len(s) < 6 or s in seen:
            continue
        seen.add(s)
        for name, pat in rules:
            if pat.search(s):
                counts[name] += 1
                break
        else:
            counts["其它"] += 1
    return counts


def dedup_sdk_candidate_count(lines: list[str]) -> int:
    seen: set[str] = set()
    n = 0
    for raw in lines:
        s = raw.strip()
        if len(s) < 6 or s in seen:
            continue
        seen.add(s)
        n += 1
    return n


MONETIZATION_STRING_RULES: list[tuple[str, re.Pattern]] = [
    ("GooglePlayBilling", re.compile(r"Billing|SkuDetails|Sku|purchase|subscription|InApp|PlayBilling|queryPurchases", re.I)),
    ("AppsFlyer_Revenue", re.compile(r"AppsFlyer|AFInApp|AFPurchase|PurchaseConnector", re.I)),
    ("Meta_Facebook", re.compile(r"facebook|FBSDK|AudienceNetwork", re.I)),
    ("Unity_Zynga_SDK", re.compile(r"Zynga|UnityPurchasing|IAP|Store", re.I)),
]

AD_STRING_RULES: list[tuple[str, re.Pattern]] = [
    ("AppLovin_MAX", re.compile(r"applovin|APPLOVIN_MAX|MaxSdk|MAX_", re.I)),
    ("AdMob_Google", re.compile(r"admob|AdRequest|MobileAds|GoogleMobileAds", re.I)),
    ("UnityAds", re.compile(r"UnityAds|unityads|UnityEngine\.Advertisements", re.I)),
    ("IronSource", re.compile(r"ironsource|IronSource", re.I)),
    ("Placement_Rewarded", re.compile(r"rewarded|interstitial|banner|placement|ad_unit|AdUnit", re.I)),
]


def section_monetization() -> dict:
    dex = load_json("dex_strings_sdk.json") or {}
    il2 = load_json("il2cpp_strings_sdk.json") or {}
    lines = list(dex.get("candidates") or []) + list(il2.get("candidates") or [])
    buckets = classify_lines(lines, MONETIZATION_STRING_RULES)
    return {
        "title": "计费点（客户端字符串证据）",
        "reverseNote": "来自 DEX + libil2cpp strings 过滤，非商店定价表；完整 SKU 与 offer 多在服务端或加密配置。",
        "lineSources": ["dex_strings_sdk.json", "il2cpp_strings_sdk.json"],
        "buckets": buckets,
    }


def section_ads() -> dict:
    dex = load_json("dex_strings_sdk.json") or {}
    il2 = load_json("il2cpp_strings_sdk.json") or {}
    lines = list(dex.get("candidates") or []) + list(il2.get("candidates") or [])
    buckets = classify_lines(lines, AD_STRING_RULES)
    return {
        "title": "广告点（客户端字符串证据）",
        "reverseNote": "聚合 SDK 与版位相关关键字；真实 placement 名需结合运行时配置与远程 bundle。",
        "buckets": buckets,
    }


def _pick_lines(items: list, patterns: list[str], limit: int = 28) -> list[str]:
    out: list[str] = []
    for x in items or []:
        s = str(x)
        if any(re.search(p, s) for p in patterns):
            if s not in out:
                out.append(s)
        if len(out) >= limit:
            break
    return out


def build_research_report() -> dict:
    """基于 Il2Cpp 类名/字符串与本地 schema 的「研究专题报告」（非运营真相表）。"""
    hints = load_json("il2cpp_hints.json") or {}
    classes = hints.get("classHits") or []
    strs = hints.get("stringLiteralHits") or []
    line_samples = hints.get("lineHitsSample") or []
    schema = load_json("lvl_protobuf_schema.json") or {}

    ev_level_classes = _pick_lines(
        classes,
        [
            r"LevelData",
            r"LevelBase",
            r"LevelDataParser",
            r"LevelDataResolver",
            r"LevelDataService",
            r"DefaultLevelDataLoader",
            r"ItemDlcFallback",
            r"DLCFallbackLevel",
            r"LevelBundle",
            r"ClientLevelAb",
            r"DynamicLevel",
        ],
        36,
    )
    ev_level_strings = _pick_lines(
        strs,
        [
            r"LevelTable",
            r"DLCFallbackLevels",
            r"DevLevels",
            r"Level difficulty",
            r"DynamicLevel",
            r"LevelModifier",
            r"Default Level Loader",
            r"Dynamic Level Loader",
        ],
        32,
    )
    ev_shop_classes = _pick_lines(
        classes,
        [
            r"Shop",
            r"Offer",
            r"Purchase",
            r"Bundle",
            r"Subscription",
            r"StarterOffer",
            r"FlashOffer",
            r"SpecialOffer",
            r"IAP",
            r"Gift",
            r"Pack",
            r"Billing",
        ],
        40,
    )
    ev_shop_strings = _pick_lines(
        strs,
        [
            r"Shop",
            r"Offer",
            r"Bundle",
            r"Purchase",
            r"FlashOffer",
            r"StarterOffer",
            r"SpecialOffer",
            r"CODASHOP",
            r"Sku",
            r"Billing",
            r"Dialogs/Shop",
            r"Datasets/",
            r"ABTest_Shop",
        ],
        40,
    )
    ev_ad_strings = _pick_lines(
        strs,
        [
            r"Banner",
            r"Rewarded",
            r"Interstitial",
            r"AdUnit",
            r"placement",
            r"MaxSdk",
            r"AppLovin",
            r"AdMob",
            r"UnityAds",
            r"IronSource",
        ],
        36,
    )
    ev_ad_classes = _pick_lines(
        classes,
        [r"Rewarded", r"Banner", r"Ad", r"Interstitial", r"Applovin", r"MaxSdk", r"Advertisement"],
        24,
    )
    ev_diff_classes = _pick_lines(
        classes,
        [
            r"LevelDifficulty",
            r"ClientLevelAb",
            r"LevelModifier",
            r"DynamicLevel",
            r"AbProcessor",
            r"AbService",
            r"AbTerminator",
        ],
        32,
    )
    ev_diff_strings = _pick_lines(
        strs,
        [
            r"Level difficulty",
            r"ABTest_Level",
            r"AbTestLevels",
            r"DynamicLevel",
            r"ClientLevel",
            r"decreaseItem",
            r"extraDuration",
            r"LevelModifier",
        ],
        28,
    )
    ev_diff_lines = _pick_lines(
        line_samples,
        [
            r"LevelModifier",
            r"Difficulty",
            r"DynamicLevel",
            r"ClientLevelAb",
            r"LevelDifficulty",
            r"decreaseItem",
            r"extraDuration",
        ],
        20,
    )

    msgs = (schema.get("messages") or {}) if isinstance(schema, dict) else {}
    level_fields = [f"{m.get('field')} (#{m.get('number')})" for m in msgs.get("LevelData", [])[:12]]

    dex_sdk = load_json("dex_strings_sdk.json") or {}
    il2_sdk = load_json("il2cpp_strings_sdk.json") or {}
    sdk_lines = list(dex_sdk.get("candidates") or []) + list(il2_sdk.get("candidates") or [])
    n_sdk = dedup_sdk_candidate_count(sdk_lines)
    mon_counts = classify_line_counts(sdk_lines, MONETIZATION_STRING_RULES)
    ad_counts = classify_line_counts(sdk_lines, AD_STRING_RULES)
    numerics_paras = level_numerics_research_paragraphs()

    mon_para0 = (
        f"在本包 `dex_strings_sdk.json` 与 `il2cpp_strings_sdk.json` 合并候选中，去重且最短长度过滤后约 **{n_sdk}** 条可读片段；按与「专题分析→计费点」相同的关键字规则（先匹配先入桶）统计："
        f"Google Play 计费相关 {mon_counts.get('GooglePlayBilling', 0)} 条、AppsFlyer 收入归因 {mon_counts.get('AppsFlyer_Revenue', 0)} 条、"
        f"Meta/Facebook 相关 {mon_counts.get('Meta_Facebook', 0)} 条、Unity/Zynga 商店相关 {mon_counts.get('Unity_Zynga_SDK', 0)} 条，"
        f"未命中上述计费桶的 {mon_counts.get('其它', 0)} 条。以上为**客户端字符串线索条数**，不是 SKU 或 offer 条目数；全文检索见 `/sdk`。"
    )
    ad_para0 = (
        f"同一 SDK 候选集上，按「专题分析→广告」规则统计：AppLovin/MAX {ad_counts.get('AppLovin_MAX', 0)} 条、AdMob/Google Mobile Ads {ad_counts.get('AdMob_Google', 0)} 条、"
        f"Unity Ads {ad_counts.get('UnityAds', 0)} 条、IronSource {ad_counts.get('IronSource', 0)} 条、"
        f"版位通用词（rewarded/interstitial/banner/placement 等，规则靠后）{ad_counts.get('Placement_Rewarded', 0)} 条，其余 {ad_counts.get('其它', 0)} 条。"
        f"分桶互斥：先匹配的 SDK 桶会占用同时含版位关键字的一行，版位桶可视作下限估计；精确 placement/AdUnit 多在远端配置。"
    )

    level_tpl_paragraphs = [
        "「关卡模板」在包内对应无表头的 `level_templates_normal.csv` / `level_templates_ease.csv`，ingest 后列为 `col_0..`。结合 `LevelData` Protobuf 字段（见 `lvl_protobuf_schema.json` 与 `/lvl` 页 decode_raw）：`LevelBaseData`（多为 `*_00.lvl`）描述关卡号、Goal/Board 最大尺寸等基底；`LevelData`（多为 `*_01+`）携带 `Name`、`Duration`、`Ease`、`Difficulty`、`Goals`、`Board`、`SeedRules`。",
        "「组合方式」可归纳为：① 静态行：模板 CSV 提供数值行（与 `col_*` 对齐，语义需对照 `LevelDataParserUtil`）；② 二进制层：同一 `levelId` 多文件 `_00`/`_01`… 变体，且 `Levels` 与 `DLCFallbackLevels` 两套目录并存（索引中可重复计数）；③ 运行时扩展：`DynamicLevel*`、`LevelBundle*`、`ItemDlcFallbackLevelDataLoader` 等类名表明存在动态关卡下载、DLC 回退与关卡包更新路径，与 Addressables/catalog 联动。",
        "专题页「关卡数值」Tab 对 normal / ease 的 min/median/max 条带图便于快速扫分布；下列为**全表整数列**自动统计摘要，可与 Tab 对照（Tab 默认各取前 2000 行抽样）。",
    ]
    level_tpl_paragraphs.extend(numerics_paras)

    return {
        "title": "逆向研究专题报告",
        "subtitle": "关卡模板 · 计费与礼包 · 广告版位 · 动态难度",
        "generatedNote": "证据来自离线包体 + il2cpp_hints（类名/字符串/行样例）及 lvl_protobuf_schema；第 1 节含关卡模板表全表数值自动摘要；第 2–3 节含 DEX+il2cpp 与专题页一致的分桶命中量。不含服务端实时价格、完整 SKU 列表与线上 AB 结果。",
        "limitations": "商城「每一个计费点」的 SKU 与定价由 Google Play / 第三方收银台与服务器 offer 下发，本仓库无法仅从静态文件枚举全量；下列为客户端可见的架构与命名线索。",
        "sections": [
            {
                "id": "levelTemplates",
                "heading": "1. 关卡模板设定逻辑与关卡配置组合",
                "paragraphs": level_tpl_paragraphs,
                "schemaFieldSummary": level_fields,
                "evidenceClasses": ev_level_classes,
                "evidenceStrings": ev_level_strings,
            },
            {
                "id": "monetization",
                "heading": "2. 计费点、商城与动态礼包逻辑（客户端视角）",
                "paragraphs": [
                    mon_para0,
                    "Google Play Billing / `SkuDetails` / `queryPurchases` 等 DEX 字符串（见 `/sdk` 与专题「计费点」分桶）说明内购走标准 BillingClient；`AppsFlyer` Purchase Connector 用于归因回传，不等于商品定义源。",
                    "Il2Cpp 中出现 `GetOffersInfoMessage`、`GetStarterOfferInfoResponseMessage`、`GetSpecialOfferInfoResponseMessage`、`PurchaseSpecialOfferMessage`、`SetStarterOfferStateMessage` 等类型名，表明 Offer 元数据与状态以网络消息拉取/同步，客户端只负责展示与发起购买；`Cannot find offer data for full sync request! OfferId` 等日志串说明 offer 由 OfferId 主键驱动。",
                    "商城 UI 侧可见 `ShopBundleItemView`、`ShopBundleItemViewCollection`；字符串侧出现「Beginner Bundle」「Giant Bundle」「Legendary Bundle」等命名型商品、`Datasets/FlashOffer`、`Datasets/StarterOffer`、`ABTest_Shop`、`ABTest_FlashOffer`、`ABTest_StarterOffer`、`ABTest_SpecialOffer` —— 说明礼包/闪购/首购与 AB 实验开关绑定，具体开哪些 bundle 由配置/实验决定，而非硬编码单一列表。",
                    "「动态计费点」在客户端体现为：Starter / Flash / Special 等 Offer 类型 + `AvailableOfferTypes` 等关键字 + 服务器同步；价格与折扣多在 activeOfferPackage、ShopDataService 相关路径解析（字符串中有 `Failed to parse activeOfferPackage default price` 类提示）。CODASHOP 字符串表明存在第三方收银台渠道。",
                    "礼包消耗侧可见 `ConsumeSupportGiftMessage`、`SupportGiftItemDatum` 等，与社交/支持类礼包链路相关；与 `MergeGiftbox*` UI 类并存，属不同业务线。",
                ],
                "evidenceClasses": ev_shop_classes,
                "evidenceStrings": ev_shop_strings,
            },
            {
                "id": "ads",
                "heading": "3. 游戏内广告点位（命名与 UI 线索）",
                "paragraphs": [
                    ad_para0,
                    "字符串字面量中出现成体系的 Banner* 前缀：`BannerCoin`、`BannerPreLevel`、`BannerCoinBooster`、`BannerCoinPreLevel`、`BannerPreLevelBooster` 等，可解读为：金币条、进关前、与道具(Booster)组合的横幅广告位命名习惯（具体瀑布与 eCPM 仍在 mediation 配置中）。",
                    "`MergeEventRewardedTreeItem`、`MergeRewardedItemClaimData` 等类名表明合成/活动树上存在激励视频领奖路径；与 `IAPButton` 同现于字符串表，说明部分入口同时承担 IAP 与广告变现。",
                    "DEX/il2cpp 通用 SDK 关键字（MAX、AdMob、UnityAds、IronSource、rewarded/interstitial）见专题「广告」分桶；精确 placement id 往往在运行时由远程配置注入，静态字符串仅为子集。",
                ],
                "evidenceClasses": ev_ad_classes,
                "evidenceStrings": ev_ad_strings,
            },
            {
                "id": "dynamicDifficulty",
                "heading": "4. 动态难度与关卡调节设计",
                "paragraphs": [
                    "`LevelData` 消息内已有 `Ease`、`Difficulty` 字段（Protobuf schema），说明单关文件可携带难度/宽松度标量或枚举。",
                    "`ClientLevelAbService` / `ClientLevelAbProcessor` / `ClientLevelAbTerminator` 与字符串 `ABTest_Level`、`ABTest_LevelTable`、`AbTestLevels`、`Datasets/LevelTable` 共同指向：关卡表或关卡参数可做 AB 实验，而非仅 UI。",
                    "`LevelDifficultyRewardService`、`LevelDifficultyCoinAbService`、`LevelDifficultyCoinRewardAbTerminator` 表明关卡难度与金币奖励存在 AB 调节链路（可能与失败率、留存挂钩）。",
                    "`DynamicLevelService`、`DynamicLevelLoader`、`GetDynamicLevelsConfigCommand` 等说明部分关卡远程下发/热更新；与 `Dynamic level {0} hash is changed` 类日志（字符串区）一致，用于检测动态关卡被覆盖。",
                    "dump.cs 行样例中出现 `LevelModifierService`、`ConsumeLevelModificationData`、`TryDecreaseItemMatches` / `TryIncreaseItemMatches` 等签名，方向为当局内修改目标数量或时长（与 `extraDurationRatio`、`decreaseItemRatio` 等构造参数呼应），属于运行时动态难度/补救一类逻辑，与静态模板 CSV 互补。",
                    "字符串 `Level difficulty:`、`DynamicLevelStreak`、`ActiveLevelStreak` 暗示存在连胜/难度 streak 与难度展示或调节；具体算法需结合 `LevelModifierService` 源码阅读。",
                ],
                "evidenceClasses": ev_diff_classes,
                "evidenceStrings": ev_diff_strings,
                "evidenceLineSamples": ev_diff_lines,
            },
        ],
        "references": [
            "public/data/lvl_protobuf_schema.json",
            "public/data/levels_index.json",
            "public/data/level_templates_normal.json",
            "public/data/il2cpp_hints.json",
            "public/data/dex_strings_sdk.json",
        ],
    }


def section_data_diagnostics() -> dict:
    """检查 public/data 关键产物是否存在，并列出仍可补充的研究方向（非运行时真相）。"""
    specs: list[tuple[str, str]] = [
        ("levels_index.json", "关卡 .lvl 索引与体积直方图数据源"),
        ("level_templates_normal.json", "普通模式关卡模板（ingest CSV）"),
        ("level_templates_ease.json", "宽松模式关卡模板（ingest CSV）"),
        ("items.json", "物品策划表 ingest"),
        ("catalog_extract.json", "Addressables catalog 本地 bundle 摘要"),
        ("dex_strings_sdk.json", "DEX 计费/广告相关字符串候选"),
        ("il2cpp_strings_sdk.json", "libil2cpp 计费/广告字符串候选"),
        ("il2cpp_hints.json", "Il2Cpp 类名/字符串/行样例，用于专题报告证据"),
        ("lvl_protobuf_schema.json", ".lvl Protobuf 字段结构推断"),
    ]
    checks: list[dict] = []
    for name, desc in specs:
        p = DATA / name
        present = p.is_file()
        size = int(p.stat().st_size) if present else None
        checks.append({"file": name, "description": desc, "present": present, "sizeBytes": size})

    gaps: list[dict] = []
    if not (DATA / "levels_index.json").is_file():
        gaps.append(
            {
                "title": "关卡索引缺失",
                "detail": "无法做关卡 ID 分布、变体热力图与 .lvl 体积分析；需先跑 ingest 生成 levels_index.json。",
            }
        )
    if not (DATA / "il2cpp_hints.json").is_file():
        gaps.append(
            {
                "title": "Il2Cpp 证据链未聚合",
                "detail": "专题「研究报告」中的类名/字符串证据会变少；建议从 dump 管线生成 il2cpp_hints.json。",
            }
        )
    if not (DATA / "lvl_protobuf_schema.json").is_file():
        gaps.append(
            {
                "title": "Protobuf 字段图缺失",
                "detail": "无法对照 LevelData / LevelBaseData 字段解读模板列与二进制；需 schema 推断或手工维护。",
            }
        )
    if not (DATA / "catalog_extract.json").is_file():
        gaps.append(
            {
                "title": "资源分包目录未解析",
                "detail": "Addressables 键与本地 .bundle 映射不完整，动态关卡/远程资源路径难对齐。",
            }
        )
    if not (DATA / "dex_strings_sdk.json").is_file() and not (DATA / "il2cpp_strings_sdk.json").is_file():
        gaps.append(
            {
                "title": "计费与广告字符串未抽取",
                "detail": "SDK 页与专题分桶将无数据；需对 DEX / libil2cpp 跑 strings 过滤脚本。",
            }
        )

    gaps.extend(
        [
            {
                "title": "服务端与实时配置",
                "detail": "Offer 定价、AB 实验分组结果、动态关卡哈希与远程 JSON 不在本地包内；仅能基于客户端字符串与类名做架构级推断。",
            },
            {
                "title": "用户行为与关卡通过率",
                "detail": "留存、失败率、难度调节的实际触发条件需遥测或抓包，静态包体无法还原。",
            },
            {
                "title": "模板列语义（col_*）",
                "detail": "level_templates_*.csv 无表头，各列与 LevelDataParser / 棋盘字段的精确映射需结合 C# 反编译逐列对照。",
            },
            {
                "title": "物品与关卡内枚举映射",
                "detail": "items.csv 与运行时 ItemType、关卡目标类型的对应关系需在 Il2Cpp 枚举与配置表中交叉验证。",
            },
        ]
    )

    recommendations = [
        "若仅缺专题 JSON：在项目根执行 `npm run ingest:topic`（需已有 levels_index 等前置文件）。",
        "若从零搭建：执行完整 `npm run ingest`，再打开本页的「数据缺口」核对缺失项。",
        "对动态难度：结合研究报告第 4 节线索，在 dump.cs 中精读 LevelModifierService、ClientLevelAb* 与 LevelDifficulty*。",
        "对商业化：用商店后台 / 抓包补全 SKU 与 offer，本工具仅提供客户端可见命名与 SDK 关键字。",
    ]

    return {
        "title": "数据产物与缺口",
        "subtitle": "列出 ingest 关键输出是否齐全，并标注静态分析天然无法覆盖的领域。",
        "checks": checks,
        "gaps": gaps,
        "recommendations": recommendations,
    }


def main() -> None:
    payload = {
        "version": 5,
        "generatedBy": "scripts/build_topic_analysis.py",
        "sections": {
            "levels": section_levels(),
            "levelNumerics": section_level_numerics(),
            "items": section_items(),
            "monetization": section_monetization(),
            "ads": section_ads(),
        },
        "dataDiagnostics": section_data_diagnostics(),
        "researchReport": build_research_report(),
        "visualizationHints": {
            "levels": ["关卡 ID 段×变体热力图（已实现）", "体积散点、模板关联见二期"],
            "levelNumerics": ["列数值 min/max/median 表", "normal vs ease 对照表", "热力图（列×模板抽样）"],
            "items": ["Category1/2 树状或旭日", "Shape 条形"],
            "monetization": ["分桶条形 + 可展开原文列表", "与 Il2Cpp 类名交叉过滤"],
            "ads": ["SDK 分桶 + placement 关键字云或条形"],
            "researchReport": ["报告正文由 ingest 聚合", "证据列表可对照 /il2cpp 与 /sdk"],
            "dataDiagnostics": ["按文件检查体积与缺失", "待补强维度与下一步建议"],
        },
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"topic_analysis -> {OUT}")


if __name__ == "__main__":
    main()
