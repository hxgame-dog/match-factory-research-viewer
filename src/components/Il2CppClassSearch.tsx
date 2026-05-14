"use client";

import { useMemo, useState } from "react";

type Props = {
  classHits: string[];
};

export function Il2CppClassSearch({ classHits }: Props) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return classHits;
    return classHits.filter((c) => c.toLowerCase().includes(s));
  }, [classHits, q]);

  return (
    <section>
      <h3 className="text-sm font-medium text-gray-900">类名列表</h3>
      <p className="mt-1 text-xs text-gray-500">
        共 {classHits.length} 条；支持前缀/子串筛选。
      </p>
      <input
        type="search"
        placeholder="筛选类名…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="mt-2 w-full max-w-md rounded-sm border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400"
      />
      <p className="mt-2 text-xs text-gray-500">
        当前显示 {filtered.length} 条
      </p>
      <ul className="mt-2 max-h-[28rem] overflow-y-auto rounded-md border border-gray-200 bg-white p-3 font-mono text-xs text-gray-800">
        {filtered.map((c) => (
          <li key={c} className="border-b border-gray-50 py-0.5">
            {c}
          </li>
        ))}
      </ul>
    </section>
  );
}
