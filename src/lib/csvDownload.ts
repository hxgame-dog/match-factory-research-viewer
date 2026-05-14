/** 下载 UTF-8 BOM CSV，便于 Excel 正确识别中文 */
export function downloadCsv(
  filename: string,
  headers: string[],
  rows: Record<string, string | number | boolean | null | undefined>[],
): void {
  const esc = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
  const headerLine = headers.map((h) => esc(h)).join(",");
  const bodyLines = rows.map((row) =>
    headers.map((h) => esc(row[h] == null ? "" : String(row[h]))).join(","),
  );
  const csv = "\ufeff" + [headerLine, ...bodyLines].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

/** 触发浏览器下载 public 下的静态文件（同源） */
export function downloadPublicAsset(href: string, filename: string): void {
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export function downloadJson(filename: string, data: unknown): void {
  const text = JSON.stringify(data, null, 2);
  const blob = new Blob([text], { type: "application/json;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename.endsWith(".json") ? filename : `${filename}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}
