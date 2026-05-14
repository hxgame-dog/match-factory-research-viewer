"use client";

type HeatmapPayload = {
  rowLabels: string[];
  colLabels: string[];
  matrix: number[][];
  maxCell: number;
  note?: string;
};

export function LevelVariantHeatmap({ data }: { data: HeatmapPayload }) {
  const max = Math.max(data.maxCell, 1);
  const rows = data.matrix.length;
  if (!rows || !data.colLabels.length) return null;

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-medium text-gray-700">关卡 ID 段 × 变体（文件行数热力图）</h4>
      <div className="overflow-x-auto rounded-md border border-gray-200">
        <table className="w-full min-w-[480px] border-collapse text-left text-[11px]">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 border-b border-r border-gray-200 bg-gray-50 px-2 py-1.5 font-medium text-gray-800">
                关卡 ID
              </th>
              {data.colLabels.map((c) => (
                <th
                  key={c}
                  className="border-b border-gray-200 bg-gray-50 px-2 py-1.5 text-center font-medium text-gray-800"
                >
                  变体 {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.rowLabels.map((label, ri) => (
              <tr key={label} className="border-b border-gray-100 last:border-0">
                <td className="sticky left-0 z-10 border-r border-gray-200 bg-gray-50 px-2 py-1 font-mono text-gray-700">
                  {label}
                </td>
                {(data.matrix[ri] || []).map((cell, ci) => {
                  const t = cell / max;
                  const alpha = 0.06 + t * 0.88;
                  const dark = t > 0.42;
                  return (
                    <td
                      key={ci}
                      className={`border-l border-gray-100 px-1 py-0.5 text-center font-mono tabular-nums ${
                        dark ? "text-white" : "text-gray-900"
                      }`}
                      style={{ backgroundColor: `rgba(17, 24, 39, ${alpha})` }}
                      title={`${cell} 条索引记录`}
                    >
                      {cell > 0 ? cell.toLocaleString() : ""}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data.note ? <p className="text-[11px] leading-relaxed text-gray-500">{data.note}</p> : null}
    </div>
  );
}
