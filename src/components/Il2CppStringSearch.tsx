"use client";

import { useMemo, useState } from "react";

type Props = {
  strings: string[];
  title: string;
};

export function Il2CppStringSearch({ strings, title }: Props) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return strings;
    return strings.filter((x) => x.toLowerCase().includes(s));
  }, [strings, q]);

  return (
    <section>
      <h3 className="text-sm font-medium text-gray-900">{title}</h3>
      <p className="mt-1 text-xs text-gray-500">
        来自 <code className="rounded bg-gray-100 px-1">stringliteral.json</code> 的启发式筛选，共 {strings.length}{" "}
        条。
      </p>
      <input
        type="search"
        placeholder="筛选字符串…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="mt-2 w-full max-w-md rounded-sm border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400"
      />
      <p className="mt-2 text-xs text-gray-500">当前显示 {filtered.length} 条</p>
      <ul className="mt-2 max-h-80 overflow-y-auto rounded-md border border-gray-200 bg-white p-3 font-mono text-xs text-gray-800 break-all">
        {filtered.map((s) => (
          <li key={s} className="border-b border-gray-50 py-1">
            {s}
          </li>
        ))}
      </ul>
    </section>
  );
}
