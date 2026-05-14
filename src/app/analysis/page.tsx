import Link from "next/link";
import { HelpBlock, ModuleWithHelp } from "@/components/ModuleWithHelp";
import { TopicAnalysisView } from "@/components/TopicAnalysisView";
import { analysisPageHelp } from "@/content/inlineHelp.zh";

export default function AnalysisPage() {
  return (
    <div className="space-y-10">
      <ModuleWithHelp helpTitle="本页说明" help={<HelpBlock text={analysisPageHelp.header} />}>
        <div>
          <h2 className="font-serif text-lg font-semibold text-gray-900">专题逆向分析</h2>
          <p className="mt-1 text-sm text-gray-500">
            数据文件 <code className="rounded bg-gray-100 px-1">public/data/topic_analysis.json</code>：完整管线用{" "}
            <code className="rounded bg-gray-100 px-1">npm run ingest</code>；若仅需刷新专题聚合（含关卡 ID×变体热力图），用{" "}
            <code className="rounded bg-gray-100 px-1">npm run ingest:topic</code>。本页含 KPI、Recharts 图表、热力图、模板数值对照表、计费/广告分桶与原文筛选；二期见{" "}
            <code className="rounded bg-gray-100 px-1">VISUALIZATION_DESIGN.md</code>。
          </p>
          <p className="mt-2 text-xs text-gray-500">
            下方图表区域右侧有「当前 Tab 说明」，会随关卡 / 关卡数值等 Tab 切换；全文手册见{" "}
            <Link href="/guide" className="font-medium text-gray-800 underline">
              /guide
            </Link>
            。
          </p>
          <p className="mt-2 text-xs text-gray-500">
            更细的 Protobuf 字段见 <Link href="/research" className="text-gray-700 underline">数据研究</Link>；原始字符串见{" "}
            <Link href="/sdk" className="text-gray-700 underline">计费与广告</Link>。
          </p>
        </div>
      </ModuleWithHelp>
      <TopicAnalysisView />
    </div>
  );
}
