"use client";

type Check = {
  file: string;
  description: string;
  present: boolean;
  sizeBytes?: number | null;
};

type Gap = { title: string; detail: string };

type Payload = {
  title: string;
  subtitle?: string;
  checks: Check[];
  gaps: Gap[];
  recommendations: string[];
};

function fmtSize(n: number | null | undefined) {
  if (n == null) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

export function DataDiagnosticsView({ data }: { data: Payload }) {
  return (
    <div className="space-y-8">
      <div>
        <h3 className="font-serif text-lg font-semibold text-gray-900">{data.title}</h3>
        {data.subtitle ? <p className="mt-1 text-sm text-gray-600">{data.subtitle}</p> : null}
      </div>

      <section className="rounded-md border border-gray-200 bg-white shadow-sm">
        <h4 className="border-b border-gray-100 px-4 py-3 text-sm font-medium text-gray-900">已生成数据文件</h4>
        <ul className="divide-y divide-gray-100">
          {data.checks.map((c) => (
            <li key={c.file} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-sm">
              <div>
                <code className="text-xs text-gray-800">{c.file}</code>
                <p className="text-xs text-gray-500">{c.description}</p>
              </div>
              <div className="text-right text-xs">
                {c.present ? (
                  <span className="text-gray-700">{fmtSize(c.sizeBytes)}</span>
                ) : (
                  <span className="text-amber-700">缺失</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-md border border-amber-200 bg-amber-50 p-4 shadow-sm">
        <h4 className="text-sm font-semibold text-amber-950">待补强的分析维度</h4>
        <ul className="mt-3 space-y-3 text-sm text-amber-950">
          {data.gaps.map((g) => (
            <li key={g.title}>
              <p className="font-medium">{g.title}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-amber-900/90">{g.detail}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-md border border-gray-200 bg-gray-50 p-4">
        <h4 className="text-sm font-medium text-gray-900">建议下一步</h4>
        <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm text-gray-700">
          {data.recommendations.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ol>
      </section>
    </div>
  );
}
