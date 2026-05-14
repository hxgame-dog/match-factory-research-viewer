"use client";

import { useMemo, useState } from "react";
import {
  assignShopBucketId,
  isLikelyShopEvidence,
  isShopRelatedClassName,
  SHOP_BUCKET_LABELS,
  SHOP_BUCKET_ORDER,
  type ShopBucketId,
} from "@/lib/shopEvidenceBuckets";
import { parseSdkLine } from "@/lib/sdkStringBuckets";

type Hints = { stringLiteralHits?: string[]; classHits?: string[] };

type Row = { raw: string; tag: string; body: string; bucket: ShopBucketId };

function buildShopRows(hints: Hints | null, dexLines: string[]): Row[] {
  if (!hints) return [];
  const seen = new Set<string>();
  const out: Row[] = [];

  const push = (raw: string, tag: string, body: string) => {
    const key = `${tag}::${body}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ raw, tag, body, bucket: assignShopBucketId(body) });
  };

  for (const s of hints.stringLiteralHits ?? []) {
    if (!isLikelyShopEvidence(s)) continue;
    push(s, "字符串字面量", s.trim());
  }
  for (const c of hints.classHits ?? []) {
    if (!isShopRelatedClassName(c)) continue;
    push(c, "类名（Il2Cpp）", c.trim());
  }
  for (const line of dexLines) {
    const p = parseSdkLine(line, "dex");
    if (!isLikelyShopEvidence(p.body)) continue;
    push(p.raw, p.tag, p.body);
  }

  return out;
}

export function ShopMallEvidencePanel({
  dexLines,
  hints,
  hintsLoad,
}: {
  dexLines: string[];
  hints: Hints | null;
  hintsLoad: "loading" | "ok" | "err";
}) {
  const rows = useMemo(() => buildShopRows(hints, dexLines), [hints, dexLines]);

  const counts = useMemo(() => {
    const m = new Map<ShopBucketId, number>();
    for (const id of SHOP_BUCKET_ORDER) m.set(id, 0);
    for (const r of rows) m.set(r.bucket, (m.get(r.bucket) ?? 0) + 1);
    return m;
  }, [rows]);

  const [bucket, setBucket] = useState<ShopBucketId | "__all__">("__all__");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (bucket !== "__all__" && r.bucket !== bucket) return false;
      if (!needle) return true;
      return r.raw.toLowerCase().includes(needle) || r.body.toLowerCase().includes(needle);
    });
  }, [rows, bucket, q]);

  if (hintsLoad === "loading") {
    return <p className="text-sm text-gray-500">正在加载 il2cpp_hints.json（商城证据）…</p>;
  }
  if (hintsLoad === "err" || !hints) {
    return (
      <p className="text-sm text-amber-800">
        未能加载 il2cpp_hints.json。请先在本机执行 <code className="rounded bg-gray-100 px-1">npm run ingest</code> 或{" "}
        <code className="rounded bg-gray-100 px-1">npm run ingest:il2cpp-hints</code>，并确保{" "}
        <code className="rounded bg-gray-100 px-1">public/data/il2cpp_hints.json</code> 存在。
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
        <p className="font-medium text-gray-900">如何理解本区</p>
        <ul className="mt-2 list-inside list-disc space-y-1 text-xs leading-relaxed text-gray-600">
          <li>这里聚合的是<strong>商城、礼包、Offer、Billing、通行证</strong>等在 Il2Cpp 字符串/类名与 DEX 中出现的线索，已尽量去掉纯广告版位与裸 HTTP 行。</li>
          <li>
            <strong>「可见商品命名」</strong>（如 Beginner Bundle）多为客户端展示或默认文案；<strong>完整 SKU、价格、折扣</strong>通常在服务端或加密配置，本工具无法替代抓包 / 商店后台。
          </li>
          <li>
            需要对照实现时，在本地 dump 中搜索表内<strong>类名</strong>；更细的专题叙述见{" "}
            <a href="/analysis" className="font-medium text-gray-800 underline">
              专题分析 → 研究报告
            </a>{" "}
            第 2 节。
          </li>
        </ul>
      </div>

      <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
        <p className="text-xs text-gray-500">
          共 {rows.length} 条证据（去重后） · 当前列表 {filtered.length} 条
        </p>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:gap-4">
        <div className="lg:w-60 lg:shrink-0">
          <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">分桶</p>
          <div className="mt-2 flex flex-wrap gap-1.5 lg:flex-col lg:flex-nowrap">
            <button
              type="button"
              onClick={() => setBucket("__all__")}
              className={`rounded-sm border px-2.5 py-1.5 text-left text-xs transition-colors ${
                bucket === "__all__"
                  ? "border-gray-900 bg-gray-900 text-white"
                  : "border-gray-200 bg-white text-gray-800 hover:bg-gray-50"
              }`}
            >
              全部
              <span className={`ml-1 tabular-nums ${bucket === "__all__" ? "text-gray-300" : "text-gray-500"}`}>
                ({rows.length})
              </span>
            </button>
            {SHOP_BUCKET_ORDER.map((id) => {
              const n = counts.get(id) ?? 0;
              if (n === 0) return null;
              const meta = SHOP_BUCKET_LABELS[id];
              return (
                <button
                  key={id}
                  type="button"
                  title={meta.hint}
                  onClick={() => setBucket(id)}
                  className={`rounded-sm border px-2.5 py-1.5 text-left text-xs transition-colors ${
                    bucket === id
                      ? "border-gray-900 bg-gray-900 text-white"
                      : "border-gray-200 bg-white text-gray-800 hover:bg-gray-50"
                  }`}
                >
                  {meta.title}
                  <span className={`ml-1 tabular-nums ${bucket === id ? "text-gray-300" : "text-gray-500"}`}>
                    ({n})
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="min-w-0 flex-1 space-y-3">
          <label className="block text-xs text-gray-600">
            全文搜索
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="如 StarterOffer、ShopBundle、Beginner…"
              className="mt-1 block w-full rounded-sm border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400"
            />
          </label>

          <div className="overflow-hidden rounded-md border border-gray-200 bg-white shadow-sm">
            <div className="max-h-[min(70vh,32rem)] overflow-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead className="sticky top-0 z-10 border-b border-gray-200 bg-gray-50 text-gray-600">
                  <tr>
                    <th className="w-8 whitespace-nowrap px-2 py-2 font-medium">#</th>
                    <th className="w-32 whitespace-nowrap px-2 py-2 font-medium">分桶</th>
                    <th className="w-28 whitespace-nowrap px-2 py-2 font-medium">来源</th>
                    <th className="px-2 py-2 font-medium">文本</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-3 py-6 text-center text-gray-500">
                        无匹配。可清空搜索或切换到「全部」。
                      </td>
                    </tr>
                  ) : (
                    filtered.map((r, i) => (
                      <tr
                        key={`${r.tag}-${i}-${r.body.slice(0, 48)}`}
                        className="border-b border-gray-100 align-top odd:bg-white even:bg-gray-50/80"
                      >
                        <td className="whitespace-nowrap px-2 py-1.5 text-gray-400 tabular-nums">{i + 1}</td>
                        <td className="whitespace-nowrap px-2 py-1.5 text-gray-600">{SHOP_BUCKET_LABELS[r.bucket].title}</td>
                        <td className="whitespace-nowrap px-2 py-1.5 font-mono text-[10px] text-gray-500">{r.tag}</td>
                        <td className="break-all px-2 py-1.5 font-mono text-[11px] leading-relaxed text-gray-900">{r.body}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
