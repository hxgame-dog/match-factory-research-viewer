"use client";

import { useEffect, useMemo, useState } from "react";
import { useRegisterExports } from "@/components/ExportToolbar";
import { HelpBlock, ModuleWithHelp } from "@/components/ModuleWithHelp";
import { SdkStringsExplorer } from "@/components/SdkStringsExplorer";
import { ShopMallEvidencePanel } from "@/components/ShopMallEvidencePanel";
import { sdkHelp } from "@/content/inlineHelp.zh";
import { downloadCsv } from "@/lib/csvDownload";
import {
  SHOP_BUCKET_LABELS,
  assignShopBucketId,
  isLikelyShopEvidence,
  isShopRelatedClassName,
  type ShopBucketId,
} from "@/lib/shopEvidenceBuckets";
import { parseSdkLine } from "@/lib/sdkStringBuckets";

type HitFile = { source: string; lines: string[] };

type Hints = { stringLiteralHits?: string[]; classHits?: string[] };

function buildShopExportRows(hints: Hints | null, dexLines: string[]) {
  if (!hints) return [];
  const seen = new Set<string>();
  const rows: { bucket: string; source: string; body: string }[] = [];
  const push = (tag: string, body: string, bid: ShopBucketId) => {
    const key = `${tag}::${body}`;
    if (seen.has(key)) return;
    seen.add(key);
    rows.push({ bucket: SHOP_BUCKET_LABELS[bid].title, source: tag, body });
  };

  for (const s of hints.stringLiteralHits ?? []) {
    if (!isLikelyShopEvidence(s)) continue;
    const b = s.trim();
    push("字符串字面量", b, assignShopBucketId(b));
  }
  for (const c of hints.classHits ?? []) {
    if (!isShopRelatedClassName(c)) continue;
    const b = c.trim();
    push("类名（Il2Cpp）", b, assignShopBucketId(b));
  }
  for (const line of dexLines) {
    const p = parseSdkLine(line, "dex");
    if (!isLikelyShopEvidence(p.body)) continue;
    push(p.tag, p.body, assignShopBucketId(p.body));
  }
  return rows;
}

export default function SdkPage() {
  const [tab, setTab] = useState<"mall" | "sdk">("mall");
  const [dex, setDex] = useState<string[]>([]);
  const [cpp, setCpp] = useState<HitFile | null>(null);
  const [hints, setHints] = useState<Hints | null>(null);
  const [hintsLoad, setHintsLoad] = useState<"loading" | "ok" | "err">("loading");

  useEffect(() => {
    fetch("/data/dex_strings_sdk.json")
      .then((r) => r.json())
      .then((j) => setDex(j.candidates ?? []));
    fetch("/data/il2cpp_strings_sdk.json")
      .then((r) => r.json())
      .then((j) => setCpp({ source: j.source ?? "", lines: j.candidates ?? [] }));
    fetch("/data/il2cpp_hints.json")
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json();
      })
      .then((j: Hints) => {
        setHints(j);
        setHintsLoad("ok");
      })
      .catch(() => setHintsLoad("err"));
  }, []);

  const shopExportRows = useMemo(() => buildShopExportRows(hints, dex), [hints, dex]);

  useRegisterExports([tab, dex, cpp, shopExportRows], () => {
    if (tab === "mall") {
      if (!shopExportRows.length) return [];
      return [
        {
          id: "shop-mall-csv",
          label: "导出商城证据 CSV",
          run: () =>
            downloadCsv("shop_mall_evidence.csv", ["bucket", "source", "body"], shopExportRows),
        },
      ];
    }
    const actions: { id: string; label: string; run: () => void }[] = [];
    if (dex.length) {
      actions.push({
        id: "dex-csv",
        label: "导出 DEX 字符串 CSV",
        run: () => downloadCsv("dex_strings_sdk.csv", ["line"], dex.map((l) => ({ line: l }))),
      });
    }
    if (cpp?.lines.length) {
      actions.push({
        id: "il2cpp-csv",
        label: "导出 libil2cpp 字符串 CSV",
        run: () =>
          downloadCsv(
            "il2cpp_strings_sdk.csv",
            ["source", "line"],
            cpp!.lines.map((l) => ({ source: cpp!.source, line: l })),
          ),
      });
    }
    return actions;
  });

  return (
    <div className="space-y-10">
      <ModuleWithHelp helpTitle="说明" help={<HelpBlock text={sdkHelp.header} />}>
        <div>
          <h2 className="font-serif text-lg font-semibold text-gray-900">计费与广告（客户端证据）</h2>
          <p className="mt-1 text-sm text-gray-500">
            分两个视图：<strong>商城与礼包</strong>侧重内购、Offer、礼包命名与商城类名；<strong>广告与 SDK 底层</strong>为 DEX/il2cpp
            过滤后的完整字符串（含广告 mediation、Billing API 等）。导出见底部「本页导出」。
          </p>
        </div>
      </ModuleWithHelp>

      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-3">
        <button
          type="button"
          onClick={() => setTab("mall")}
          className={`rounded-sm border px-3 py-1.5 text-sm transition-colors ${
            tab === "mall" ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 text-gray-700 hover:bg-gray-50"
          }`}
        >
          商城与礼包
        </button>
        <button
          type="button"
          onClick={() => setTab("sdk")}
          className={`rounded-sm border px-3 py-1.5 text-sm transition-colors ${
            tab === "sdk" ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 text-gray-700 hover:bg-gray-50"
          }`}
        >
          广告与 SDK 底层字符串
        </button>
      </div>

      {tab === "mall" && (
        <ModuleWithHelp helpTitle="说明" help={<HelpBlock text={sdkHelp.mall} />}>
          <ShopMallEvidencePanel dexLines={dex} hints={hints} hintsLoad={hintsLoad} />
        </ModuleWithHelp>
      )}

      {tab === "sdk" && (
        <div className="space-y-12">
          <ModuleWithHelp helpTitle="说明" help={<HelpBlock text={sdkHelp.dex} />}>
            <SdkStringsExplorer title="classes.dex / classes2.dex 命中" lines={dex} fallbackTag="dex" />
          </ModuleWithHelp>

          <ModuleWithHelp helpTitle="说明" help={<HelpBlock text={sdkHelp.il2cpp} />}>
            {cpp && cpp.lines.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs text-gray-500 break-all">源文件：{cpp.source}</p>
                <SdkStringsExplorer title="libil2cpp.so 命中" lines={cpp.lines} fallbackTag="libil2cpp.so" />
              </div>
            ) : (
              <p className="text-sm text-gray-500">暂无 il2cpp 候选行。</p>
            )}
          </ModuleWithHelp>
        </div>
      )}
    </div>
  );
}
