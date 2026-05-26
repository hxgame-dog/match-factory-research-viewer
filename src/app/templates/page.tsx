"use client";

import { useEffect, useMemo, useState } from "react";
import { useRegisterExports } from "@/components/ExportToolbar";
import { HelpBlock, ModuleWithHelp } from "@/components/ModuleWithHelp";
import { templatesHelp } from "@/content/inlineHelp.zh";
import { downloadCsv } from "@/lib/csvDownload";

type Row = Record<string, string>;

export default function TemplatesPage() {
  const [mode, setMode] = useState<"normal" | "ease">("normal");
  const [rows, setRows] = useState<Row[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const url = mode === "normal" ? "/data/level_templates_normal.json" : "/data/level_templates_ease.json";
    setErr(null);
    fetch(url)
      .then((r) => r.json())
      .then(setRows)
      .catch(() => setErr("加载失败"));
  }, [mode]);

  const allCols = useMemo(() => {
    if (!rows[0]) return [];
    return Object.keys(rows[0]);
  }, [rows]);

  const displayCols = useMemo(() => allCols.slice(0, 24), [allCols]);

  const pageSize = 40;
  const [page, setPage] = useState(0);
  useEffect(() => setPage(0), [mode, rows.length]);
  const slice = rows.slice(page * pageSize, (page + 1) * pageSize);
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));

  useRegisterExports([err, allCols, rows, mode], () => {
    if (err || !allCols.length) return [];
    return [
      {
        id: `templates-${mode}-csv`,
        label: `导出 ${mode} 全列 CSV`,
        run: () => {
          const rowsCsv = rows.map((r) => {
            const o: Record<string, string | number | boolean | null | undefined> = {};
            for (const c of allCols) o[c] = r[c] ?? "";
            return o;
          });
          downloadCsv(`level_templates_${mode}_all_columns.csv`, allCols, rowsCsv);
        },
      },
    ];
  });

  return (
    <div className="space-y-12">
      <ModuleWithHelp helpTitle="说明" help={<HelpBlock text={templatesHelp.header} />}>
        <div>
          <h2 className="font-serif text-lg font-semibold text-gray-900">关卡模板 CSV</h2>
          <p className="mt-1 text-sm text-gray-500">
            对比 `level_templates_normal` 与 `level_templates_ease`；表格列较多，此处截取前 24 列展示。全列导出见底部「本页导出」。
            带贴图的关卡目标预览请用{" "}
            <a href="/level-preview" className="text-gray-700 underline">
              关卡预览
            </a>
            （需先执行 npm run ingest:level-goals）。
          </p>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => setMode("normal")}
              className={`rounded-sm border px-3 py-1.5 text-sm ${
                mode === "normal" ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 hover:bg-gray-50"
              }`}
            >
              normal
            </button>
            <button
              type="button"
              onClick={() => setMode("ease")}
              className={`rounded-sm border px-3 py-1.5 text-sm ${
                mode === "ease" ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 hover:bg-gray-50"
              }`}
            >
              ease
            </button>
          </div>
          {err && <p className="mt-2 text-red-600">{err}</p>}
        </div>
      </ModuleWithHelp>

      <ModuleWithHelp helpTitle="说明" help={<HelpBlock text={templatesHelp.table} />}>
        <div className="space-y-3">
          <p className="text-sm text-gray-500">共 {rows.length.toLocaleString()} 行</p>
          <div className="overflow-x-auto rounded-md border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-gray-600">
                  {displayCols.map((c) => (
                    <th key={c} className="whitespace-nowrap px-2 py-2 font-medium">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {slice.map((r, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    {displayCols.map((c) => (
                      <td key={c} className="whitespace-nowrap px-2 py-1.5 text-gray-800">
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
