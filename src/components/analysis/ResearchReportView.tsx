"use client";

type ReportSection = {
  id: string;
  heading: string;
  paragraphs: string[];
  schemaFieldSummary?: string[];
  evidenceClasses?: string[];
  evidenceStrings?: string[];
  evidenceLineSamples?: string[];
};

export type ResearchReportPayload = {
  title: string;
  subtitle?: string;
  generatedNote?: string;
  limitations?: string;
  sections: ReportSection[];
  references?: string[];
};

function EvidenceBlock({
  title,
  items,
  mono = true,
}: {
  title: string;
  items: string[] | undefined;
  mono?: boolean;
}) {
  if (!items?.length) return null;
  return (
    <details className="rounded-md border border-gray-200 bg-white">
      <summary className="cursor-pointer px-3 py-2 text-xs font-medium text-gray-800 hover:bg-gray-50">
        {title}（{items.length} 条）
      </summary>
      <ul
        className={`max-h-52 space-y-1 overflow-y-auto border-t border-gray-100 p-3 text-[11px] text-gray-700 ${
          mono ? "font-mono" : ""
        }`}
      >
        {items.map((s) => (
          <li key={s} className="break-all border-b border-gray-50 py-0.5 last:border-0">
            {s}
          </li>
        ))}
      </ul>
    </details>
  );
}

export function ResearchReportView({ report }: { report: ResearchReportPayload }) {
  return (
    <div className="space-y-10">
      <header className="space-y-3 border-b border-gray-200 pb-6">
        <h3 className="font-serif text-lg font-semibold text-gray-900">{report.title}</h3>
        {report.subtitle ? <p className="text-sm text-gray-600">{report.subtitle}</p> : null}
        {report.generatedNote ? <p className="text-xs leading-relaxed text-gray-500">{report.generatedNote}</p> : null}
        {report.limitations ? (
          <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-950">
            {report.limitations}
          </p>
        ) : null}
      </header>

      {report.sections.map((sec) => (
        <section key={sec.id} className="space-y-4 rounded-md border border-gray-200 bg-white p-5 shadow-sm">
          <h4 className="font-serif text-base font-semibold text-gray-900">{sec.heading}</h4>
          <div className="space-y-3 text-sm leading-relaxed text-gray-800">
            {sec.paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
          {sec.schemaFieldSummary?.length ? (
            <div>
              <p className="text-xs font-medium text-gray-700">LevelData 字段摘要（schema）</p>
              <p className="mt-1 font-mono text-[11px] text-gray-600">{sec.schemaFieldSummary.join(" · ")}</p>
            </div>
          ) : null}
          <div className="grid gap-3 md:grid-cols-2">
            <EvidenceBlock title="Il2Cpp 类名（节选）" items={sec.evidenceClasses} />
            <EvidenceBlock title="字符串字面量（节选）" items={sec.evidenceStrings} />
          </div>
          {sec.evidenceLineSamples?.length ? (
            <EvidenceBlock title="dump.cs 行样例（节选）" items={sec.evidenceLineSamples} />
          ) : null}
        </section>
      ))}

      {report.references?.length ? (
        <footer className="text-xs text-gray-500">
          <p className="font-medium text-gray-700">数据来源索引</p>
          <ul className="mt-2 list-inside list-disc space-y-1 font-mono">
            {report.references.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </footer>
      ) : null}
    </div>
  );
}
