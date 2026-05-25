"use client";

import { useEffect, useMemo, useState } from "react";
import { useRegisterExports } from "@/components/ExportToolbar";
import { HelpBlock, ModuleWithHelp } from "@/components/ModuleWithHelp";
import { itemsHelp } from "@/content/inlineHelp.zh";
import { downloadCsv } from "@/lib/csvDownload";
import { buildSpriteUrlByName, itemSpriteUrl } from "@/lib/itemSprite";

type Row = Record<string, string>;

export default function ItemsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [spriteUrlByName, setSpriteUrlByName] = useState<Map<string, string>>(new Map());
  const [q, setQ] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(true);

  useEffect(() => {
    fetch("/data/items.json")
      .then((r) => r.json())
      .then((data: Row[]) => {
        const enriched = data.map((r, i) => ({
          ItemId: r.ItemId != null && r.ItemId !== "" ? r.ItemId : String(i),
          ...r,
        }));
        setRows(enriched);
      })
      .catch(() => setErr("加载 items.json 失败"));
    fetch("/data/item_sprite_index.json")
      .then((r) => r.json())
      .then((j: { items?: { name: string; publicUrl?: string | null }[] }) => {
        setSpriteUrlByName(buildSpriteUrlByName(j.items ?? []));
      })
      .catch(() => setSpriteUrlByName(new Map()));
  }, []);

  const cols = useMemo(() => {
    if (!rows[0]) return [];
    const keys = Object.keys(rows[0]).filter((k) => k !== "ItemId");
    return ["ItemId", ...keys];
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
            共 {rows.length.toLocaleString()} 行；<strong>ItemId</strong> 与 .lvl 目标字段{" "}
            <code className="rounded bg-gray-100 px-1">6/7 {"{ 1: id }"}</code> 一致。对照贴图请开{" "}
            <a href="/level-guide" className="underline text-gray-700">
              关卡配置说明
            </a>
            。
          </p>
        </div>
      </ModuleWithHelp>

      <ModuleWithHelp helpTitle="说明" help={<HelpBlock text={itemsHelp.controls} />}>
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="search"
            placeholder="筛选关键字（含 ItemId、Name）…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full max-w-md rounded-sm border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400"
          />
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={showPreview}
              onChange={(e) => setShowPreview(e.target.checked)}
            />
            显示贴图预览（public/sprites，线上可用）
          </label>
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
                  {showPreview && (
                    <th className="whitespace-nowrap px-2 py-2 font-medium">贴图</th>
                  )}
                  {cols.map((c) => (
                    <th key={c} className="whitespace-nowrap px-2 py-2 font-medium">
                      {c === "ItemId" ? "ID" : c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {slice.map((r, i) => {
                  const name = r.Name ?? "";
                  const publicUrl = name ? spriteUrlByName.get(name) : undefined;
                  const canPreview = !!publicUrl;
                  return (
                    <tr key={i} className="border-b border-gray-100">
                      {showPreview && (
                        <td className="px-2 py-1.5">
                          {canPreview ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={itemSpriteUrl(name, publicUrl)}
                              alt={name}
                              width={40}
                              height={40}
                              className="h-10 w-10 object-contain"
                              loading="lazy"
                            />
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                      )}
                      {cols.map((c) => (
                        <td
                          key={c}
                          className={`max-w-[12rem] truncate px-2 py-1.5 text-gray-800 ${
                            c === "ItemId" ? "font-mono font-medium text-gray-900" : ""
                          }`}
                        >
                          {r[c]}
                        </td>
                      ))}
                    </tr>
                  );
                })}
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
