"use client";

type ColStats = { count: number; min: number; max: number; median: number };

function RangeCell({ s }: { s: ColStats }) {
  const span = s.max - s.min;
  const medianPct = span <= 0 ? 50 : ((s.median - s.min) / span) * 100;
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex flex-wrap gap-x-1 font-mono text-[11px] text-gray-600">
        <span>min {s.min}</span>
        <span className="text-gray-400">·</span>
        <span className="font-medium text-gray-900">med {s.median}</span>
        <span className="text-gray-400">·</span>
        <span>max {s.max}</span>
        <span className="text-gray-400">（n={s.count}）</span>
      </div>
      <div
        className="relative h-2 w-full rounded-sm bg-gray-200"
        title={`范围 ${s.min}–${s.max}，中位数 ${s.median}`}
      >
        <div
          className="absolute bottom-0 top-0 w-px bg-gray-900 shadow-sm"
          style={{ left: `clamp(0%, ${medianPct}%, 100%)` }}
        />
      </div>
    </div>
  );
}

export function LevelNumericCompareTable({
  normal,
  ease,
}: {
  normal?: Record<string, ColStats>;
  ease?: Record<string, ColStats>;
}) {
  const keys = Array.from(
    new Set([...Object.keys(normal || {}), ...Object.keys(ease || {})]),
  ).sort((a, b) => {
    const na = parseInt(a.replace(/\D/g, ""), 10);
    const nb = parseInt(b.replace(/\D/g, ""), 10);
    return na - nb;
  });

  if (!keys.length) {
    return <p className="text-sm text-gray-500">暂无数值列统计</p>;
  }

  return (
    <div className="overflow-x-auto rounded-md border border-gray-200">
      <table className="w-full min-w-[640px] border-collapse text-left text-xs">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            <th className="px-3 py-2 font-medium text-gray-800">列</th>
            <th className="px-3 py-2 font-medium text-gray-800">normal（抽样数值列）</th>
            <th className="px-3 py-2 font-medium text-gray-800">ease（抽样数值列）</th>
          </tr>
        </thead>
        <tbody>
          {keys.map((k) => (
            <tr key={k} className="border-b border-gray-100 last:border-0">
              <td className="whitespace-nowrap px-3 py-2 font-mono text-gray-700">{k}</td>
              <td className="px-3 py-2 align-top">
                {normal?.[k] ? <RangeCell s={normal[k]} /> : <span className="text-gray-400">—</span>}
              </td>
              <td className="px-3 py-2 align-top">
                {ease?.[k] ? <RangeCell s={ease[k]} /> : <span className="text-gray-400">—</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
