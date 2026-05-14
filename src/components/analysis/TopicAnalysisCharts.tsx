"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const tickGray = { fontSize: 11, fill: "#6b7280" };

const tooltipContent = {
  contentStyle: {
    border: "1px solid #e5e7eb",
    borderRadius: 4,
    fontSize: 12,
    color: "#111827",
  },
};

export function recordToRows(rec: Record<string, number>, limit = 40) {
  return Object.entries(rec)
    .map(([name, value]) => ({ name, value: Number(value) || 0 }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
}

/** 直方图：x = 区间名，y = 数量 */
export function BytesHistogramChart({
  data,
}: {
  data: { range: string; count: number }[];
}) {
  if (!data.length) return null;
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 56 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
        <XAxis
          dataKey="range"
          tick={tickGray}
          interval={0}
          angle={-38}
          textAnchor="end"
          height={72}
        />
        <YAxis tick={tickGray} width={44} />
        <Tooltip cursor={{ fill: "#f3f4f6" }} wrapperStyle={{ outline: "none" }} contentStyle={tooltipContent.contentStyle} />
        <Bar dataKey="count" fill="#111827" radius={[2, 2, 0, 0]} maxBarSize={56} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/** 横向条形：类别名在左侧 */
export function CategoryBarChart({
  rows,
  title,
}: {
  rows: { name: string; value: number }[];
  title: string;
}) {
  if (!rows.length) return null;
  const h = Math.min(720, Math.max(220, rows.length * 26 + 48));
  return (
    <div className="space-y-2">
      <h4 className="text-xs font-medium text-gray-700">{title}</h4>
      <ResponsiveContainer width="100%" height={h}>
        <BarChart
          layout="vertical"
          data={rows}
          margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
          <XAxis type="number" tick={tickGray} />
          <YAxis type="category" dataKey="name" width={132} tick={{ ...tickGray, width: 128 }} />
          <Tooltip cursor={{ fill: "#f3f4f6" }} wrapperStyle={{ outline: "none" }} contentStyle={tooltipContent.contentStyle} />
          <Bar dataKey="value" fill="#111827" radius={[0, 2, 2, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** 分桶条数对比（计费 / 广告） */
export function BucketCountBarChart({
  counts,
}: {
  counts: { name: string; value: number }[];
}) {
  if (!counts.length) return null;
  const h = Math.min(480, Math.max(200, counts.length * 36 + 40));
  return (
    <ResponsiveContainer width="100%" height={h}>
      <BarChart
        layout="vertical"
        data={[...counts].sort((a, b) => b.value - a.value)}
        margin={{ top: 8, right: 20, left: 8, bottom: 8 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
        <XAxis type="number" tick={tickGray} />
        <YAxis type="category" dataKey="name" width={160} tick={tickGray} />
        <Tooltip cursor={{ fill: "#f3f4f6" }} wrapperStyle={{ outline: "none" }} contentStyle={tooltipContent.contentStyle} />
        <Bar dataKey="value" fill="#374151" radius={[0, 2, 2, 0]} name="条数" />
      </BarChart>
    </ResponsiveContainer>
  );
}
