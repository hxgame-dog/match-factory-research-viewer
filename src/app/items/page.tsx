"use client";

import { useEffect, useMemo, useState } from "react";
import { useRegisterExports } from "@/components/ExportToolbar";
import { HelpBlock, ModuleWithHelp } from "@/components/ModuleWithHelp";
import { itemsHelp } from "@/content/inlineHelp.zh";
import { downloadCsv } from "@/lib/csvDownload";

type Row = Record<string, string>;

export default function ItemsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState("");
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetch("/data/items.json")
      .then((r) => r.json())
      .then(setRows)
      .catch(() => setErr("加载 items.json 失败"));
  }, []);

  const cols = useMemo(() => {
    if (!rows[0]) return [];
    return Object.keys(rows[0]);
  }, [rows]);

  const filtered = useMemo(() => {
    if (!q.trim()) return rows;
    const s = q.toLowerCase();
    return rows.filter((r) =>
      Object.values(r).some((v) => String(v).toLowerCase().includes(s)),
    );
  }, [rows, q]);

  useRegisterExports([err, cols, filtered], () => {
    if (err || !cols.length) return [];
    return [
      {
        id: "items-filtered-csv",
        label: "导出筛选 CSV",
        run: () => {
          const out = filtered.map((r) => {
            const o: Record<string, string | number | boolean | null | undefined> = {};
            for (const c of cols) o[c] = r[c] ?? "";
            return o;
          });
          downloadCsv("items_filtered.csv", cols, out);
        },
      },
    ];
  });

  const pageSize = 80;
  const [page, setPage] = useState(0);
  const slice = filtered.slice(page * pageSize, (page + 1) * pageSize);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  useEffect(() => {
    setPage(0);
  }, [q, rows.length]);

  if (err) {
    return <p className="text-red-600">{err}</p>;
  }

  return (
    <div className="space-y-12">
      <ModuleWithHelp helpTitle="说明" help={<HelpBlock text={itemsHelp.header} />}>
        <div>
          <h2 className="font-serif text-lg font-semibold text-gray-900">物品表（items.csv）</h2>
          <p className="mt-1 text-sm text-gray-500">
            共 {rows.length.toLocaleString()} 行；支持全文筛选；导出请用页面底部「本页导出」条。
          </p>
        </div>
      </ModuleWithHelp>

      <ModuleWithHelp helpTitle="说明" help={<HelpBlock text={itemsHelp.controls} />}>
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="search"
            placeholder="筛选关键字…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full max-w-md rounded-sm border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400"
          />
        </div>
      </ModuleWithHelp>

      <ModuleWithHelp helpTitle="说明" help={<HelpBlock text={itemsHelp.table} />}>
        <div className="space-y-3">
          <p className="text-sm text-gray-500">
            显示第 {page * pageSize + 1}–{Math.min((page + 1) * pageSize, filtered.length)} 条，共筛选{" "}
            {filtered.length.toLocaleString()} 条
          </p>
          <div className="overflow-x-auto rounded-md border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-gray-600">
                  {cols.map((c) => (
                    <th key={c} className="whitespace-nowrap px-2 py-2 font-medium">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {slice.map((r, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    {cols.map((c) => (
                      <td key={c} className="max-w-[12rem] truncate px-2 py-1.5 text-gray-800">
                        {r[c]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <button
              type="button"
              disabled={page <= 0}
              className="rounded-sm border border-gray-200 px-3 py-1 disabled:opacity-40"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              上一页
            </button>
            <span className="text-gray-500">
              {page + 1} / {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages - 1}
              className="rounded-sm border border-gray-200 px-3 py-1 disabled:opacity-40"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            >
              下一页
            </button>
          </div>
        </div>
      </ModuleWithHelp>
    </div>
  );
}
