/** 本地 dev 时由 API 从 MATCH_FACTORY_ROOT 读取导出 PNG；无图时返回 404 */
export function itemSpriteUrl(name: string): string {
  const encoded = encodeURIComponent(name);
  return `/api/item-sprite/${encoded}`;
}
