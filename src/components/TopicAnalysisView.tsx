"use client";

import { useEffect, useMemo, useState } from "react";
import { DataDiagnosticsView } from "@/components/DataDiagnosticsView";
import { useRegisterExports } from "@/components/ExportToolbar";
import { HelpBlock } from "@/components/ModuleWithHelp";
import { LevelNumericCompareTable } from "@/components/analysis/LevelNumericCompareTable";
import { SearchableBucketPanel } from "@/components/analysis/SearchableBucketPanel";
import { LevelVariantHeatmap } from "@/components/analysis/LevelVariantHeatmap";
import { ResearchReportView, type ResearchReportPayload } from "@/components/analysis/ResearchReportView";
import {
  BucketCountBarChart,
  BytesHistogramChart,
  CategoryBarChart,
  recordToRows,
} from "@/components/analysis/TopicAnalysisCharts";
import { analysisTabHelp } from "@/content/inlineHelp.zh";
import { downloadJson } from "@/lib/csvDownload";

type DataDiagnosticsPayload = {
  title: string;
  subtitle?: string;
  checks: { file: string; description: string; present: boolean; sizeBytes?: number | null }[];
  gaps: { title: string; detail: string }[];
  recommendations: string[];
};

type TopicPayload = {
  version?: number;
  generatedBy?: string;
  researchReport?: ResearchReportPayload;
  dataDiagnostics?: DataDiagnosticsPayload;
  sections: {
    levels: Record<string, unknown>;
    levelNumerics: Record<string, unknown>;
    items: Record<string, unknown>;
    monetization: Record<string, unknown>;
    ads: Record<string, unknown>;
  };
  visualizationHints?: Record<string, string[]>;
};

const TABS = [
  { id: "levels", label: "关卡" },
  { id: "levelNumerics", label: "关卡数值" },
  { id: "items", label: "物品" },
  { id: "monetization", label: "计费点" },
  { id: "ads", label: "广告" },
  { id: "dataDiagnostics", label: "数据缺口" },
  { id: "researchReport", label: "研究报告" },
] as const;

function KpiCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-md border border-gray-200 bg-white px-4 py-3 shadow-sm">
      <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1 font-serif text-xl font-semibold text-gray-900">{value}</p>
      {hint ? <p className="mt-1 text-[11px] text-gray-500">{hint}</p> : null}
    </div>
  );
}

export function TopicAnalysisView() {
  const [loadState, setLoadState] = useState<"loading" | "ok" | "error">("loading");
  const [data, setData] = useState<TopicPayload | null>(null);
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("levels");

  useEffect(() => {
    let cancelled = false;
    setLoadState("loading");
    fetch("/data/topic_analysis.json")
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json();
      })
      .then((json: TopicPayload) => {
        if (!cancelled && json?.sections) {
          setData(json);
          setLoadState("ok");
        } else if (!cancelled) setLoadState("error");
      })
      .catch(() => {
        if (!cancelled) {
          setData(null);
          setLoadState("error");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useRegisterExports([loadState, data], () => {
    if (loadState !== "ok" || !data) return [];
    return [
      {
        id: "topic-analysis-json",
        label: "导出 topic_analysis.json（当前快照）",
        run: () => downloadJson("topic_analysis.json", data),
      },
    ];
  });

  const sec = useMemo(() => {
    if (!data?.sections) return null;
    if (tab === "researchReport" || tab === "dataDiagnostics") return null;
    return data.sections[tab];
  }, [data, tab]);

  const kpi = useMemo(() => {
    if (!data?.sections) return null;
    const L = data.sections.levels as {
      totalLevels?: number;
      bytesMin?: number;
      bytesMax?: number;
    };
    const I = data.sections.items as { total?: number };
    const N = data.sections.levelNumerics as {
      modes?: Record<string, { rowCount?: number }>;
    };
    const nRow = N.modes?.normal?.rowCount;
    const eRow = N.modes?.ease?.rowCount;
    const tmpl =
      nRow != null && eRow != null
        ? `${nRow.toLocaleString()} / ${eRow.toLocaleString()}`
        : "—";
    return {
      levels: L.totalLevels != null ? L.totalLevels.toLocaleString() : "—",
      bytes:
        L.bytesMin != null && L.bytesMax != null
          ? `${L.bytesMin} – ${L.bytesMax} B`
          : "—",
      items: I.total != null ? I.total.toLocaleString() : "—",
      templates: tmpl,
    };
  }, [data]);

  if (loadState === "loading") {
    return <p className="text-sm text-gray-500">正在加载 topic_analysis.json…</p>;
  }

  if (loadState === "error" || !data) {
    return (
      <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
        <p className="font-medium">未能加载专题数据</p>
        <p className="mt-2 text-amber-900/90">
          请在项目根目录执行完整管线{" "}
          <code className="rounded bg-white/80 px-1">npm run ingest</code>，或已有{" "}
          <code className="rounded bg-white/80 px-1">public/data/levels_index.json</code> 等前置文件时仅刷新专题：{" "}
          <code className="rounded bg-white/80 px-1">npm run ingest:topic</code>
          ，然后刷新本页。
        </p>
      </div>
    );
  }

  const levelsSec = data.sections.levels as {
    byFolder?: Record<string, number>;
    variantDistribution?: Record<string, number>;
    bytesHistogram?: { range: string; count: number }[];
    levelIdVariantHeatmap?: {
      rowLabels: string[];
      colLabels: string[];
      matrix: number[][];
      maxCell: number;
      note?: string;
    };
  };

  const numericsSec = data.sections.levelNumerics as {
    modes?: Record<
      string,
      {
        rowCount?: number;
        numericColumnStats?: Record<string, { count: number; min: number; max: number; median: number }>;
      }
    >;
  };

  const itemsSec = data.sections.items as {
    byCategory1?: Record<string, number>;
    byCategory2?: Record<string, number>;
    byShape?: Record<string, number>;
  };

  const bucketCounts = (b?: Record<string, string[]>) =>
    b
      ? Object.entries(b).map(([name, lines]) => ({ name, value: lines.length }))
      : [];

  const tabHelpText = analysisTabHelp[tab] ?? "";

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_min(100%,288px)] lg:items-start">
      <div className="min-w-0 space-y-8">
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard label="关卡 .lvl 文件" value={kpi?.levels ?? "—"} hint="Levels + DLCFallback" />
          <KpiCard label="单文件体积" value={kpi?.bytes ?? "—"} hint="索引中的字节数范围" />
          <KpiCard label="物品词条" value={kpi?.items ?? "—"} hint="items.csv 行数" />
          <KpiCard label="模板行数 N / E" value={kpi?.templates ?? "—"} hint="normal / ease CSV" />
        </section>

        <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-3">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`rounded-sm border px-3 py-1.5 text-sm transition-colors ${
                tab === t.id
                  ? "border-gray-900 bg-gray-900 text-white"
                  : "border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {sec && typeof sec === "object" && "title" in sec && (
          <div>
            <h3 className="font-serif text-base font-semibold text-gray-900">{(sec as { title: string }).title}</h3>
            {"reverseNote" in sec && (
              <p className="mt-2 text-sm leading-relaxed text-gray-600">
                {(sec as { reverseNote: string }).reverseNote}
              </p>
            )}
          </div>
        )}

        {tab === "levels" && sec && (
          <div className="grid gap-8">
            <div className="grid gap-8 lg:grid-cols-2">
              {levelsSec.byFolder && (
                <CategoryBarChart rows={recordToRows(levelsSec.byFolder, 24)} title="目录分布（Levels / DLCFallback）" />
              )}
              {levelsSec.variantDistribution && (
                <CategoryBarChart
                  rows={recordToRows(
                    Object.fromEntries(
                      Object.entries(levelsSec.variantDistribution).map(([k, v]) => [
                        `_variant ${k}`,
                        Number(v),
                      ]),
                    ),
                    24,
                  )}
                  title="变体编号分布"
                />
              )}
            </div>
            <div>
              <h4 className="mb-2 text-xs font-medium text-gray-700">关卡文件体积分布（分桶计数）</h4>
              {levelsSec.bytesHistogram && <BytesHistogramChart data={levelsSec.bytesHistogram} />}
            </div>
            {levelsSec.levelIdVariantHeatmap && (
              <LevelVariantHeatmap data={levelsSec.levelIdVariantHeatmap} />
            )}
          </div>
        )}

        {tab === "levelNumerics" && sec && (
          <div className="space-y-6">
            <div className="flex flex-wrap gap-4 text-xs text-gray-600">
              {numericsSec.modes &&
                Object.entries(numericsSec.modes).map(([mode, m]) => (
                  <span key={mode}>
                    <span className="font-medium text-gray-800">{mode}</span>：{m.rowCount?.toLocaleString() ?? "—"} 行
                  </span>
                ))}
            </div>
            <LevelNumericCompareTable
              normal={numericsSec.modes?.normal?.numericColumnStats}
              ease={numericsSec.modes?.ease?.numericColumnStats}
            />
            <details className="rounded-md border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600">
              <summary className="cursor-pointer font-medium text-gray-800">原始 JSON（调试用）</summary>
              <pre className="mt-2 max-h-64 overflow-auto font-mono text-[11px] text-gray-700">
                {JSON.stringify(sec, null, 2)}
              </pre>
            </details>
          </div>
        )}

        {tab === "items" && sec && (
          <div className="grid gap-10 lg:grid-cols-1">
            {itemsSec.byCategory1 && (
              <CategoryBarChart rows={recordToRows(itemsSec.byCategory1, 40)} title="Category1 分布" />
            )}
            {itemsSec.byCategory2 && (
              <CategoryBarChart rows={recordToRows(itemsSec.byCategory2, 30)} title="Category2（Top 30）" />
            )}
            {itemsSec.byShape && (
              <CategoryBarChart rows={recordToRows(itemsSec.byShape, 24)} title="Shape 分布" />
            )}
          </div>
        )}

        {tab === "monetization" && sec && (
          <div className="grid gap-8 lg:grid-cols-2">
            <div>
              <h4 className="mb-2 text-xs font-medium text-gray-700">分桶条数</h4>
              <BucketCountBarChart counts={bucketCounts((sec as { buckets?: Record<string, string[]> }).buckets)} />
            </div>
            <div className="min-w-0">
              <SearchableBucketPanel sec={sec} />
            </div>
          </div>
        )}

        {tab === "ads" && sec && (
          <div className="grid gap-8 lg:grid-cols-2">
            <div>
              <h4 className="mb-2 text-xs font-medium text-gray-700">分桶条数</h4>
              <BucketCountBarChart counts={bucketCounts((sec as { buckets?: Record<string, string[]> }).buckets)} />
            </div>
            <div className="min-w-0">
              <SearchableBucketPanel sec={sec} />
            </div>
          </div>
        )}

        {tab === "researchReport" && data.researchReport && (
          <ResearchReportView report={data.researchReport} />
        )}

        {tab === "dataDiagnostics" && data.dataDiagnostics && (
          <DataDiagnosticsView data={data.dataDiagnostics} />
        )}

        {tab === "dataDiagnostics" && !data.dataDiagnostics && (
          <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
            未找到 dataDiagnostics 字段。请执行 <code className="rounded bg-white/80 px-1">npm run ingest:topic</code>{" "}
            或完整 <code className="rounded bg-white/80 px-1">npm run ingest</code> 以生成 version≥4 的 topic_analysis.json。
          </div>
        )}

        {tab === "researchReport" && !data.researchReport && (
          <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
            未找到 researchReport 字段。请执行 <code className="rounded bg-white/80 px-1">npm run ingest:topic</code>{" "}
            或完整 <code className="rounded bg-white/80 px-1">npm run ingest</code> 以生成 version≥3 的 topic_analysis.json。
          </div>
        )}

        {((data.visualizationHints?.[tab] ?? []).length > 0) && (
          <section className="rounded-md border border-dashed border-gray-300 p-4 text-xs text-gray-600">
            <h4 className="font-medium text-gray-800">二期可视化建议</h4>
            <ul className="mt-2 list-inside list-disc space-y-1">
              {(data.visualizationHints?.[tab] ?? []).map((h) => (
                <li key={h}>{h}</li>
              ))}
            </ul>
          </section>
        )}

        {(data.version != null || data.generatedBy) && (
          <p className="text-[11px] text-gray-400">
            数据版本 {data.version ?? "—"}
            {data.generatedBy ? ` · ${data.generatedBy}` : ""}
          </p>
        )}
      </div>

      <aside className="rounded-md border border-gray-200 bg-gray-50 p-4 lg:sticky lg:top-6 lg:self-start">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">当前 Tab 说明</p>
        <p className="mt-1 text-sm font-medium text-gray-900">{TABS.find((x) => x.id === tab)?.label}</p>
        <div className="mt-3 border-t border-gray-200 pt-3">
          <HelpBlock text={tabHelpText} />
        </div>
        <div className="mt-4 border-t border-gray-200 pt-3 text-[11px] leading-relaxed text-gray-500">
          <p className="font-medium text-gray-700">关于上方 KPI 四格</p>
          <p className="mt-1">
            在所有 Tab 通用：关卡文件条数（索引行）、单文件字节范围、物品表行数、两套模板 CSV 行数。切换 Tab 时右侧文字会跟着变。
          </p>
        </div>
      </aside>
    </div>
  );
}
