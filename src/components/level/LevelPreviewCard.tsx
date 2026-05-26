"use client";

import Link from "next/link";
import { ItemGoalCard, type ItemRow } from "@/components/level/ItemGoalCard";

export type LevelPreviewEntry = {
  levelId: number;
  templateKey?: string | null;
  duration?: number | null;
  field5?: number | null;
  collectGoals: { itemId: number; count: number }[];
  boardGoals: { itemId: number; count: number }[];
  relativePath?: string;
  folder?: string;
  templateNormal?: {
    templateDuration?: string | null;
    templateDifficulty?: string | null;
    templateCounts?: number[];
  } | null;
  templateEase?: {
    templateDuration?: string | null;
    templateDifficulty?: string | null;
    templateCounts?: number[];
  } | null;
  base00?: {
    goalCounts?: number[];
    boardSlotBytes?: number[];
  } | null;
  dataSource?: string;
};

type Props = {
  level: LevelPreviewEntry;
  itemsById: Map<number, ItemRow>;
  spriteUrlByItemId: Map<number, string>;
  spriteUrlByName: Map<string, string>;
  hasSprite: Set<string>;
};

export function LevelPreviewCard({
  level,
  itemsById,
  spriteUrlByItemId,
  spriteUrlByName,
  hasSprite,
}: Props) {
  const tpl = level.templateNormal;
  const counts = tpl?.templateCounts ?? [];

  return (
    <article className="rounded-md border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-gray-100 pb-3">
        <div>
          <h3 className="font-serif text-base font-semibold text-gray-900">
            关卡 {level.levelId}
          </h3>
          <p className="mt-0.5 font-mono text-xs text-gray-500">
            {level.templateKey ?? "—"} · {level.duration ?? "—"}s · 字段5={level.field5 ?? "—"}
          </p>
        </div>
        <Link
          href={`/level-guide`}
          className="text-xs text-gray-500 underline hover:text-gray-800"
        >
          配置说明
        </Link>
      </div>

      {tpl && (
        <p className="mt-2 text-xs text-gray-500">
          模板 normal：时长 {tpl.templateDuration ?? "—"} · 难度标记 {tpl.templateDifficulty ?? "—"}
          {counts.length > 0 && (
            <span> · 数量列 [{counts.join(", ")}]（非道具 ID，仅作对照）</span>
          )}
        </p>
      )}

      {level.base00 && (level.base00.goalCounts?.length ?? 0) > 0 && (
        <p className="mt-2 rounded-sm border border-amber-200 bg-amber-50 px-2 py-1.5 text-xs text-amber-900">
          <strong>*_00.lvl</strong> 目标数量：[
          {level.base00.goalCounts?.join(", ")}]（与游戏顶部目标数常一致；道具种类见下方 _01，可能与真机画面不符）
        </p>
      )}

      <p className="mt-2 text-[10px] text-gray-400">
        数据源：{level.dataSource === "static_bundle" ? "包内静态 .lvl" : "—"} · 运行时可能被 DynamicLevel 覆盖
      </p>

      <div className="mt-3">
        <h4 className="text-xs font-medium text-gray-700">收集目标（*_01.lvl 字段 6 → ItemId）</h4>
        {level.collectGoals.length === 0 ? (
          <p className="mt-1 text-xs text-gray-400">无</p>
        ) : (
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {level.collectGoals.map((g) => (
              <ItemGoalCard
                key={`c-${g.itemId}-${g.count}`}
                itemId={g.itemId}
                count={g.count}
                label="收集"
                itemsById={itemsById}
                hasSprite={hasSprite}
                spriteUrlByItemId={spriteUrlByItemId}
                spriteUrlByName={spriteUrlByName}
              />
            ))}
          </div>
        )}
      </div>

      {level.boardGoals.length > 0 && (
        <div className="mt-3">
          <h4 className="text-xs font-medium text-gray-700">棋盘投放（.lvl 字段 7）</h4>
          <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {level.boardGoals.map((g) => (
              <ItemGoalCard
                key={`b-${g.itemId}-${g.count}`}
                itemId={g.itemId}
                count={g.count}
                label="投放"
                itemsById={itemsById}
                hasSprite={hasSprite}
                spriteUrlByItemId={spriteUrlByItemId}
                spriteUrlByName={spriteUrlByName}
              />
            ))}
          </div>
        </div>
      )}

      <p className="mt-3 truncate text-[10px] text-gray-400">{level.relativePath}</p>
    </article>
  );
}
