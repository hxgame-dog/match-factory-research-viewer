"use client";

import { useEffect, useMemo, useState } from "react";
import { useRegisterExports } from "@/components/ExportToolbar";
import { HelpBlock, ModuleWithHelp } from "@/components/ModuleWithHelp";
import { levelsHelp } from "@/content/inlineHelp.zh";
import { downloadCsv } from "@/lib/csvDownload";

type LevelRow = {
  fileName: string;
  levelId: number;
  variant: number;
  folder: string;
  bytes: number;
  relativePath: string;
};

type Payload = {
  levels: LevelRow[];
  histogram: { byFolder: Record<string, number>; levelIdBuckets: Record<string, number> };
  total: number;
};

export default function LevelsPage() {
  const [data, setData] = useState<Payload | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [minId, setMinId] = useState("");
  const [maxId, setMaxId] = useState("");
  const [folder, setFolder] = useState<string>("");
  const [page, setPage] = useState(0);
  const pageSize = 100;

  useEffect(() => {
    fetch("/data/levels_index.json")
      .then((r) => r.json())
      .then(setData)
      .catch(() => setErr("加载 levels_index.json 失败（体积较大，请稍候）"));
  }, []);

  const filtered = useMemo(() => {
    if (!data) return [];
    let xs = data.levels;
    const mn = minId.trim() ? parseInt(minId, 10) : null;
    const mx = maxId.trim() ? parseInt(maxId, 10) : null;
    if (mn !== null && !Number.isNaN(mn)) xs = xs.filter((l) => l.levelId >= mn);
    if (mx !== null && !Number.isNaN(mx)) xs = xs.filter((l) => l.levelId <= mx);
    if (folder) xs = xs.filter((l) => l.folder === folder);
    return xs;
  }, [data, minId, maxId, folder]);

  useEffect(() => setPage(0), [minId, maxId, folder]);

  const slice = filtered.slice(page * pageSize, (page + 1) * pageSize);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  const folders = useMemo(() => {
    if (!data) return [];
    return Object.keys(data.histogram.byFolder).sort();
  }, [data]);

  useRegisterExports([err, data, filtered], () => {
    if (err || !data) return [];
    return [
      {
        id: "levels-filtered-csv",
        label: "导出当前筛选 CSV",
        run: () => {
          const headers = ["levelId", "variant", "folder", "bytes", "fileName", "relativePath"];
          const rows = filtered.map((r) => ({
            levelId: r.levelId,
            variant: r.variant,
            folder: r.folder,
            bytes: r.bytes,
            fileName: r.fileName,
            relativePath: r.relativePath,
          }));
          downloadCsv("levels_index_filtered.csv", headers, rows);
        },
      },
    ];
  });

  if (err) return <p className="text-red-600">{err}</p>;
  if (!data) return <p className="text-gray-500">正在加载关卡索引…</p>;

  const bucketEntries = Object.entries(data.histogram.levelIdBuckets).sort((a, b) => a[0].localeCompare(b[0]));
  const maxB = Math.max(...bucketEntries.map(([, v]) => v), 1);

  return (
    <div className="space-y-12">
      <ModuleWithHelp helpTitle="说明" help={<HelpBlock text={levelsHelp.header} />}>
        <div>
          <h2 className="font-serif text-lg font-semibold text-gray-900">关卡文件索引</h2>
          <p className="mt-1 text-sm text-gray-500">
            自{" "}
            <code className="rounded bg-gray-100 px-1">Level{"{"}id{"}"}_{"{"}variant{"}"}.lvl</code>{" "}
            解析；共 {data.total.toLocaleString()} 条；不含 <code className="rounded bg-gray-100 px-1">ud.lvl</code> /{" "}
            <code className="rounded bg-gray-100 px-1">gd.lvl</code>。导出当前筛选请用底部「本页导出」。
          </p>
        </div>
      </ModuleWithHelp>

      <ModuleWithHelp helpTitle="说明" help={<HelpBlock text={levelsHelp.histogram} />}>
        <section className="rounded-md border border-gray-200 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-medium text-gray-900">关卡 ID 千分位分布</h3>
          <div className="mt-3 max-h-48 space-y-2 overflow-y-auto">
            {bucketEntries.map(([k, v]) => (
              <div key={k}>
                <div className="flex justify-between text-xs text-gray-600">
                  <span>{k}</span>
                  <span>{v.toLocaleString()}</span>
                </div>
                <div className="h-1.5 w-full rounded-sm bg-gray-100">
                  <div className="h-1.5 rounded-sm bg-gray-700" style={{ width: `${(v / maxB) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>
      </ModuleWithHelp>

      <ModuleWithHelp helpTitle="说明" help={<HelpBlock text={levelsHelp.filtersTable} />}>
        <div className="space-y-4">
          <div className="flex flex-wrap items-end gap-3">
            <label className="text-sm text-gray-600">
              最小 levelId
              <input
                className="ml-2 rounded-sm border border-gray-200 px-2 py-1"
                value={minId}
                onChange={(e) => setMinId(e.target.value)}
              />
            </label>
            <label className="text-sm text-gray-600">
              最大 levelId
              <input
                className="ml-2 rounded-sm border border-gray-200 px-2 py-1"
                value={maxId}
                onChange={(e) => setMaxId(e.target.value)}
              />
            </label>
            <label className="text-sm text-gray-600">
              目录
              <select
                className="ml-2 rounded-sm border border-gray-200 px-2 py-1"
                value={folder}
                onChange={(e) => setFolder(e.target.value)}
              >
                <option value="">全部</option>
                {folders.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <p className="text-sm text-gray-500">
            筛选结果 {filtered.length.toLocaleString()} 条；本页 {slice.length} 条
          </p>

          <div className="overflow-x-auto rounded-md border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-gray-600">
                  <th className="px-3 py-2 font-medium">levelId</th>
                  <th className="px-3 py-2 font-medium">variant</th>
                  <th className="px-3 py-2 font-medium">folder</th>
                  <th className="px-3 py-2 font-medium">bytes</th>
                  <th className="px-3 py-2 font-medium">file</th>
                </tr>
              </thead>
              <tbody>
                {slice.map((r) => (
                  <tr key={r.relativePath} className="border-b border-gray-100">
                    <td className="px-3 py-1.5">{r.levelId}</td>
                    <td className="px-3 py-1.5">{r.variant}</td>
                    <td className="px-3 py-1.5 text-gray-600">{r.folder}</td>
                    <td className="px-3 py-1.5 text-gray-600">{r.bytes}</td>
                    <td className="max-w-md truncate px-3 py-1.5 text-xs text-gray-500">{r.fileName}</td>
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
