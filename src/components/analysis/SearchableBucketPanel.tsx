"use client";

import { useMemo, useState } from "react";

export function SearchableBucketPanel({ sec }: { sec: Record<string, unknown> }) {
  const buckets = sec.buckets as Record<string, string[]> | undefined;
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    if (!buckets) return null;
    const needle = q.trim().toLowerCase();
    if (!needle) return buckets;
    const out: Record<string, string[]> = {};
    for (const [name, lines] of Object.entries(buckets)) {
      out[name] = lines.filter((l) => l.toLowerCase().includes(needle));
    }
    return out;
  }, [buckets, q]);

  if (!buckets) {
    return <pre className="text-xs">{JSON.stringify(sec, null, 2)}</pre>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <label className="text-xs text-gray-600">
          原文筛选
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="关键字过滤各分桶列表…"
            className="ml-0 mt-1 block w-full rounded-sm border border-gray-200 px-2 py-1.5 font-sans text-sm sm:ml-2 sm:mt-0 sm:inline-block sm:w-72"
          />
        </label>
        <p className="text-[11px] text-gray-500">
          展示为去重后的客户端字符串样本，非全量配置。
        </p>
      </div>
      <div className="space-y-6">
        {Object.entries(filtered || {}).map(([name, lines]) => (
          <div key={name}>
            <h4 className="text-xs font-medium text-gray-800">
              {name}
              <span className="ml-2 font-normal text-gray-500">（{lines.length} 条）</span>
            </h4>
            <ul className="mt-1 max-h-52 overflow-y-auto rounded border border-gray-100 bg-gray-50 p-2 font-mono text-[11px] text-gray-700">
              {lines.length === 0 ? (
                <li className="text-gray-400">无匹配</li>
              ) : (
                lines.map((l) => (
                  <li key={l} className="border-b border-gray-100 py-0.5 break-all last:border-0">
                    {l}
                  </li>
                ))
              )}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
