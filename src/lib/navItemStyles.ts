/** 主导航链接样式（Notion Lite） */
export function navItemClass(active: boolean): string {
  return [
    "inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-sm border px-3 py-1.5 text-sm transition-colors",
    active
      ? "border-gray-900 bg-gray-900 text-white"
      : "border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50",
  ].join(" ");
}
