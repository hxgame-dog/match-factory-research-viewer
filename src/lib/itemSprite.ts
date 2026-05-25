export type SpriteIndexItem = {
  name: string;
  publicUrl?: string | null;
};

/** 优先使用索引中的 publicUrl（public/sprites 静态资源，线上可用） */
export function itemSpriteUrl(name: string, publicUrl?: string | null): string {
  if (publicUrl) return publicUrl;
  return `/sprites/itempack-01/${encodeURIComponent(name)}.png`;
}

export function buildSpriteUrlByName(items: SpriteIndexItem[]): Map<string, string> {
  const m = new Map<string, string>();
  for (const x of items) {
    if (x.publicUrl) m.set(x.name, x.publicUrl);
  }
  return m;
}

export function buildSpriteUrlByItemId(
  items: { itemId: number; name: string; publicUrl?: string | null }[],
): Map<number, string> {
  const m = new Map<number, string>();
  for (const x of items) {
    if (x.publicUrl) m.set(x.itemId, x.publicUrl);
  }
  return m;
}
