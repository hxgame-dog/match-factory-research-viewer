"use client";

import { useEffect, useMemo, useState } from "react";
import { LevelPreviewCard, type LevelPreviewEntry } from "@/components/level/LevelPreviewCard";
import type { ItemRow } from "@/components/level/ItemGoalCard";
import { HelpBlock, ModuleWithHelp } from "@/components/ModuleWithHelp";
import { levelPreviewHelp } from "@/content/inlineHelp.zh";
import { buildSpriteUrlByItemId, buildSpriteUrlByName } from "@/lib/itemSprite";

type GoalsPayload = {
  levelCount?: number;
  levels?: LevelPreviewEntry[];
  note?: string;
  runtimeMismatchHint?: string;
};

export default function LevelPreviewPage() {
  const [payload, setPayload] = useState<GoalsPayload | null>(null);
  const [items, setItems] = useState<ItemRow[]>([]);
  const [spriteIndex, setSpriteIndex] = useState<{ items: { itemId: number; name: string; publicUrl?: string | null }[] } | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [minId, setMinId] = useState("1");
  const [maxId, setMaxId] = useState("100");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const pageSize = 24;

  useEffect(() => {
    setErr(null);
    fetch("/data/level_goals_index.json")
      .then((r) => {
        if (!r.ok) throw new Error("missing");
        return r.json();
      })
      .then(setPayload)
      .catch(() =>
        setErr("未找到 level_goals_index.json，请在项目根执行：python3 scripts/build_level_goals_index.py"),
      );
    fetch("/data/items.json")
      .then((r) => r.json())
      .then(setItems);
    fetch("/data/item_sprite_index.json")
      .then((r) => r.json())
      .then(setSpriteIndex)
      .catch(() => setSpriteIndex(null));
  }, []);

  const itemsById = useMemo(() => {
    const m = new Map<number, ItemRow>();
    items.forEach((row, i) => {
      const id = row.ItemId != null && row.ItemId !== "" ? Number(row.ItemId) : i;
      m.set(id, row);
    });
    return m;
  }, [items]);

  const spriteUrlByName = useMemo(
    () => buildSpriteUrlByName(spriteIndex?.items ?? []),
    [spriteIndex],
  );
  const spriteUrlByItemId = useMemo(
    () => buildSpriteUrlByItemId(spriteIndex?.items ?? []),
    [spriteIndex],
  );
  const hasSprite = useMemo(() => new Set(spriteUrlByName.keys()), [spriteUrlByName]);

  const filtered = useMemo(() => {
    const levels = payload?.levels ?? [];
    const mn = minId.trim() ? parseInt(minId, 10) : null;
    const mx = maxId.trim() ? parseInt(maxId, 10) : null;
    const s = q.trim().toLowerCase();
    return levels.filter((l) => {
      if (mn !== null && !Number.isNaN(mn) && l.levelId < mn) return false;
      if (mx !== null && !Number.isNaN(mx) && l.levelId > mx) return false;
      if (!s) return true;
      const names = [...l.collectGoals, ...l.boardGoals]
        .map((g) => itemsById.get(g.itemId)?.Name ?? "")
        .join(" ")
        .toLowerCase();
      return (
        String(l.levelId).includes(s) ||
        (l.templateKey ?? "").toLowerCase().includes(s) ||
        names.includes(s)
      );
    });
  }, [payload, minId, maxId, q, itemsById]);

  useEffect(() => setPage(0), [minId, maxId, q]);

  const slice = filtered.slice(page * pageSize, (page + 1) * pageSize);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  if (err) {
    return (
      <div className="space-y-4">
        <p className="text-red-600">{err}</p>
        <pre className="rounded-md bg-gray-100 p-3 text-xs">
          MATCH_FACTORY_ROOT=/Users/fulei/Downloads/match-factory-1-64-246 python3 scripts/build_level_goals_index.py
        </pre>
      </div>
    );
  }

  if (!payload) {
    return <p className="text-gray-500">加载关卡预览索引…（首次约 7MB JSON，请稍候）</p>;
  }

  return (
    <div className="space-y-10">
      <ModuleWithHelp helpTitle="说明" help={<HelpBlock text={levelPreviewHelp.header} />}>
        <div>
          <h2 className="font-serif text-lg font-semibold text-gray-900">关卡预览（贴图 + 配置）</h2>
          <p className="mt-1 text-sm text-gray-500">
            已索引 <strong>{payload.levelCount?.toLocaleString() ?? "—"}</strong> 关（各关一条{" "}
            <code className="rounded bg-gray-100 px-1">*_01.lvl</code>）。道具图来自{" "}
            <code className="rounded bg-gray-100 px-1">public/sprites</code>；模板表仅显示时长/难度/数量列。
          </p>
          {payload.note && <p className="mt-2 text-xs text-gray-500">{payload.note}</p>}
          {payload.runtimeMismatchHint && (
            <p className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950">
              {payload.runtimeMismatchHint}
            </p>
          )}
        </div>
      </ModuleWithHelp>

      <ModuleWithHelp helpTitle="说明" help={<HelpBlock text={levelPreviewHelp.filters} />}>
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-sm text-gray-600">
            最小关卡号
            <input
              type="number"
              value={minId}
              onChange={(e) => setMinId(e.target.value)}
              className="ml-2 w-24 rounded-sm border border-gray-200 px-2 py-1.5 text-sm"
            />
          </label>
          <label className="text-sm text-gray-600">
            最大关卡号
            <input
              type="number"
              value={maxId}
              onChange={(e) => setMaxId(e.target.value)}
              className="ml-2 w-24 rounded-sm border border-gray-200 px-2 py-1.5 text-sm"
            />
          </label>
          <input
            type="search"
            placeholder="搜索关卡号、模板名、道具名…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="min-w-[200px] flex-1 rounded-sm border border-gray-200 px-3 py-2 text-sm"
          />
        </div>
        <p className="text-sm text-gray-500">
          当前筛选 <strong>{filtered.length.toLocaleString()}</strong> 关 · 第 {page + 1}/{totalPages} 页
        </p>
      </ModuleWithHelp>

      <div className="grid gap-6 lg:grid-cols-2">
        {slice.map((level) => (
          <LevelPreviewCard
            key={level.levelId}
            level={level}
            itemsById={itemsById}
            spriteUrlByItemId={spriteUrlByItemId}
            spriteUrlByName={spriteUrlByName}
            hasSprite={hasSprite}
          />
        ))}
      </div>

      <div className="flex items-center gap-2 text-sm">
        <button
          type="button"
          disabled={page <= 0}
          className="rounded-sm border border-gray-200 px-3 py-1 disabled:opacity-40"
          onClick={() => setPage((p) => Math.max(0, p - 1))}
        >
          上一页
        </button>
        <span className="text-gray-500">
          {page + 1} / {totalPages}
        </span>
        <button
          type="button"
          disabled={page >= totalPages - 1}
          className="rounded-sm border border-gray-200 px-3 py-1 disabled:opacity-40"
          onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
        >
          下一页
        </button>
      </div>
    </div>
  );
}
