"use client";

import { useMemo, useState } from "react";
import {
  assignSdkBucketId,
  BUCKET_LABELS,
  BUCKET_ORDER,
  parseSdkLine,
  type ParsedSdkLine,
  type SdkBucketId,
} from "@/lib/sdkStringBuckets";

type Row = ParsedSdkLine & { bucket: SdkBucketId };

function buildRows(lines: string[], fallbackTag: string): Row[] {
  return lines.map((raw) => {
    const p = parseSdkLine(raw, fallbackTag);
    return { ...p, bucket: assignSdkBucketId(p.body) };
  });
}

export function SdkStringsExplorer({
  title,
  lines,
  fallbackTag,
}: {
  title: string;
  lines: string[];
  /** il2cpp 候选无 `[xxx]` 前缀时用此标签 */
  fallbackTag: string;
}) {
  const rows = useMemo(() => buildRows(lines, fallbackTag), [lines, fallbackTag]);

  const counts = useMemo(() => {
    const m = new Map<SdkBucketId, number>();
    for (const id of BUCKET_ORDER) m.set(id, 0);
    for (const r of rows) m.set(r.bucket, (m.get(r.bucket) ?? 0) + 1);
    return m;
  }, [rows]);

  const [bucket, setBucket] = useState<SdkBucketId | "__all__">("__all__");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (bucket !== "__all__" && r.bucket !== bucket) return false;
      if (!needle) return true;
      return r.raw.toLowerCase().includes(needle) || r.body.toLowerCase().includes(needle);
    });
  }, [rows, bucket, q]);

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
        <h3 className="text-sm font-medium text-gray-900">{title}</h3>
        <p className="text-xs text-gray-500">
          共 {rows.length} 条 · 当前列表 {filtered.length} 条
        </p>
      </div>

      <p className="text-xs leading-relaxed text-gray-600">
        下方按「计费 / 广告 SDK / 版位」自动分桶，便于下钻；同一行只归入第一个命中的桶。与专题页分桶规则同思路，不等价于运行时真实调用图。
      </p>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:gap-4">
        <div className="lg:w-56 lg:shrink-0">
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
              <span className="ml-1 font-normal text-gray-500 tabular-nums">({rows.length})</span>
            </button>
            {BUCKET_ORDER.map((id) => {
              const n = counts.get(id) ?? 0;
              if (n === 0) return null;
              const meta = BUCKET_LABELS[id];
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
                  <span
                    className={`ml-1 tabular-nums ${bucket === id ? "text-gray-300" : "text-gray-500"}`}
                  >
                    ({n})
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="min-w-0 flex-1 space-y-3">
          <label className="block text-xs text-gray-600">
            全文搜索（原始行 + 去掉前缀后的正文）
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="如 Billing、rewarded、AppsFlyer…"
              className="mt-1 block w-full rounded-sm border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400"
            />
          </label>

          <div className="overflow-hidden rounded-md border border-gray-200 bg-white shadow-sm">
            <div className="max-h-[min(70vh,32rem)] overflow-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead className="sticky top-0 z-10 border-b border-gray-200 bg-gray-50 text-gray-600">
                  <tr>
                    <th className="w-10 whitespace-nowrap px-2 py-2 font-medium">#</th>
                    <th className="w-28 whitespace-nowrap px-2 py-2 font-medium">分桶</th>
                    <th className="w-24 whitespace-nowrap px-2 py-2 font-medium">来源</th>
                    <th className="px-2 py-2 font-medium">文本</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-3 py-6 text-center text-gray-500">
                        无匹配，请调整搜索或换分桶。
                      </td>
                    </tr>
                  ) : (
                    filtered.map((r, i) => (
                      <tr key={`${r.raw}-${i}`} className="border-b border-gray-100 align-top odd:bg-white even:bg-gray-50/80">
                        <td className="whitespace-nowrap px-2 py-1.5 text-gray-400 tabular-nums">{i + 1}</td>
                        <td className="whitespace-nowrap px-2 py-1.5 text-gray-600">{BUCKET_LABELS[r.bucket].title}</td>
                        <td className="whitespace-nowrap px-2 py-1.5 font-mono text-[10px] text-gray-500">{r.tag}</td>
                        <td className="break-all px-2 py-1.5 font-mono text-[11px] leading-relaxed text-gray-900">
                          {r.body}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
