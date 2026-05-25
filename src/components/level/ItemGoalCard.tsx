"use client";

import { useState } from "react";
import { itemSpriteUrl } from "@/lib/itemSprite";

export type ItemRow = {
  ItemId?: string;
  Name?: string;
  Category1?: string;
  Category2?: string;
  Color1?: string;
  Shape?: string;
  Size?: string;
};

type Props = {
  itemId: number;
  count: number;
  label: string;
  itemsById: Map<number, ItemRow>;
  hasSprite?: Set<string>;
};

export function ItemGoalCard({ itemId, count, label, itemsById, hasSprite }: Props) {
  const row = itemsById.get(itemId);
  const name = row?.Name ?? `(无 itemId ${itemId})`;
  const showImg = hasSprite?.has(name) ?? true;
  const [imgErr, setImgErr] = useState(false);

  return (
    <div className="rounded-md border border-gray-200 bg-white p-3 shadow-sm">
      <div className="text-xs font-medium text-gray-500">{label}</div>
      <div className="mt-2 flex gap-3">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-sm border border-gray-100 bg-gray-50">
          {showImg && !imgErr ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={itemSpriteUrl(name)}
              alt={name}
              className="max-h-[72px] max-w-[72px] object-contain"
              onError={() => setImgErr(true)}
            />
          ) : (
            <span className="px-1 text-center text-[10px] text-gray-400">无预览</span>
          )}
        </div>
        <div className="min-w-0 text-sm">
          <div className="font-medium text-gray-900">
            ID {itemId} · {name}
          </div>
          <div className="mt-1 text-gray-600">
            数量 <span className="font-mono text-gray-900">{count}</span>
          </div>
          {row && (
            <div className="mt-1 text-xs text-gray-500">
              {[row.Category1, row.Category2, row.Color1, row.Shape, row.Size]
                .filter(Boolean)
                .join(" · ")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
