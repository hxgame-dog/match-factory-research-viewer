"use client";

import { useEffect, useMemo, useState } from "react";
import { ItemGoalCard, type ItemRow } from "@/components/level/ItemGoalCard";
import { HelpBlock, ModuleWithHelp } from "@/components/ModuleWithHelp";
import { levelGuideHelp } from "@/content/inlineHelp.zh";
import { buildSpriteUrlByItemId, buildSpriteUrlByName } from "@/lib/itemSprite";
import { parseDecodeRaw } from "@/lib/parseLvlGoals";

type PbSample = {
  fileName?: string;
  relativePath?: string;
  decodeRawText?: string;
};

type LvlDoc = {
  protocDecodeRaw?: {
    samples?: PbSample[];
  };
};

type SpriteIndex = {
  items: { itemId: number; name: string; publicUrl?: string | null; spriteFile: string | null }[];
};

export default function LevelGuidePage() {
  const [lvlDoc, setLvlDoc] = useState<LvlDoc | null>(null);
  const [items, setItems] = useState<ItemRow[]>([]);
  const [spriteIndex, setSpriteIndex] = useState<SpriteIndex | null>(null);
  const [selectedSample, setSelectedSample] = useState("");
  const [customRaw, setCustomRaw] = useState("");
  const [lookupIds, setLookupIds] = useState("852,61,853");

  useEffect(() => {
    fetch("/data/lvl_format_notes.json")
      .then((r) => r.json())
      .then((d: LvlDoc) => {
        setLvlDoc(d);
        const first = d.protocDecodeRaw?.samples?.find((s) => s.decodeRawText)?.fileName ?? "";
        setSelectedSample(first);
      });
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

  const samples = useMemo(
    () => (lvlDoc?.protocDecodeRaw?.samples ?? []).filter((s) => s.decodeRawText),
    [lvlDoc],
  );

  const activeRaw = useMemo(() => {
    if (customRaw.trim()) return customRaw;
    const s = samples.find((x) => x.fileName === selectedSample);
    return s?.decodeRawText ?? "";
  }, [customRaw, samples, selectedSample]);

  const parsed = useMemo(() => (activeRaw ? parseDecodeRaw(activeRaw) : null), [activeRaw]);

  const lookupGoals = useMemo(() => {
    return lookupIds
      .split(/[,，\s]+/)
      .map((x) => x.trim())
      .filter((x) => /^\d+$/.test(x))
      .map((x) => ({ itemId: Number(x), count: 0 }));
  }, [lookupIds]);

  return (
    <div className="space-y-12">
      <ModuleWithHelp helpTitle="说明" help={<HelpBlock text={levelGuideHelp.header} />}>
        <div>
          <h2 className="font-serif text-lg font-semibold text-gray-900">关卡配置与贴图对照</h2>
          <p className="mt-1 text-sm text-gray-500">
            对照 <code className="rounded bg-gray-100 px-1">.lvl</code> 的{" "}
            <code className="rounded bg-gray-100 px-1">protoc --decode_raw</code>、物品表{" "}
            <strong>ItemId</strong> 与本地导出的 itempack 贴图。完整长文见仓库{" "}
            <code className="rounded bg-gray-100 px-1">docs/LEVEL_CONFIG_GUIDE.zh-CN.md</code>。
          </p>
          <p className="mt-2 text-xs text-gray-500">
            贴图已托管在站点 <code className="rounded bg-gray-100 px-1">public/sprites/</code>（约
            11MB），线上与本地均可预览。
          </p>
        </div>
      </ModuleWithHelp>

      <ModuleWithHelp helpTitle="说明" help={<HelpBlock text={levelGuideHelp.fieldLegend} />}>
        <section className="rounded-md border border-gray-200 bg-gray-50 p-4 text-sm text-gray-800">
          <ul className="list-inside list-disc space-y-1 text-gray-700">
            <li>
              <strong>字段 6</strong>：收集目标（要收进槽位的道具），子字段 <code>1</code> = ItemId，<code>2</code>{" "}
              = 数量
            </li>
            <li>
              <strong>字段 7</strong>：棋盘投放（场上已有的道具），结构同上
            </li>
            <li>
              <strong>ItemId</strong> = <code>items.csv</code> 数据行从 0 起的行号（与物品表 ID 列一致）
            </li>
            <li>
              <strong>贴图</strong> = <code>sprites/{"{Name}"}.png</code>
            </li>
          </ul>
        </section>
      </ModuleWithHelp>

      <ModuleWithHelp helpTitle="说明" help={<HelpBlock text={levelGuideHelp.samplePicker} />}>
        <section className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-sm text-gray-600">
              样例关卡
              <select
                value={selectedSample}
                onChange={(e) => {
                  setCustomRaw("");
                  setSelectedSample(e.target.value);
                }}
                className="ml-2 rounded-sm border border-gray-200 px-2 py-1.5 text-sm"
              >
                {samples.map((s) => (
                  <option key={s.fileName} value={s.fileName}>
                    {s.fileName} ({s.relativePath})
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">或粘贴 decode_raw 文本</label>
            <textarea
              value={customRaw}
              onChange={(e) => setCustomRaw(e.target.value)}
              placeholder="1: 1&#10;2: &quot;1_M_1_1&quot;&#10;..."
              rows={6}
              className="mt-1 w-full max-w-2xl rounded-sm border border-gray-200 px-3 py-2 font-mono text-xs"
            />
          </div>
        </section>
      </ModuleWithHelp>

      {parsed && (
        <>
          <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-md border border-gray-200 bg-white p-3 text-sm">
              <div className="text-gray-500">关卡号</div>
              <div className="font-mono text-lg text-gray-900">{parsed.levelId ?? "—"}</div>
            </div>
            <div className="rounded-md border border-gray-200 bg-white p-3 text-sm">
              <div className="text-gray-500">模板</div>
              <div className="font-mono text-gray-900">{parsed.template ?? "—"}</div>
            </div>
            <div className="rounded-md border border-gray-200 bg-white p-3 text-sm">
              <div className="text-gray-500">时长（秒）</div>
              <div className="font-mono text-lg text-gray-900">{parsed.duration ?? "—"}</div>
            </div>
            <div className="rounded-md border border-gray-200 bg-white p-3 text-sm">
              <div className="text-gray-500">字段 5</div>
              <div className="font-mono text-lg text-gray-900">{parsed.field5 ?? "—"}</div>
            </div>
          </section>

          <ModuleWithHelp helpTitle="说明" help={<HelpBlock text={levelGuideHelp.goalsPreview} />}>
            <section className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-gray-900">收集目标（字段 6）</h3>
                {parsed.collectGoals.length === 0 ? (
                  <p className="mt-2 text-sm text-gray-500">本样例无字段 6</p>
                ) : (
                  <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {parsed.collectGoals.map((g) => (
                      <ItemGoalCard
                        key={`c-${g.itemId}-${g.count}`}
                        itemId={g.itemId}
                        count={g.count}
                        label="收集目标"
                        itemsById={itemsById}
                        hasSprite={hasSprite}
                        spriteUrlByItemId={spriteUrlByItemId}
                        spriteUrlByName={spriteUrlByName}
                      />
                    ))}
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900">棋盘投放（字段 7）</h3>
                {parsed.boardGoals.length === 0 ? (
                  <p className="mt-2 text-sm text-gray-500">本样例无字段 7</p>
                ) : (
                  <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {parsed.boardGoals.map((g) => (
                      <ItemGoalCard
                        key={`b-${g.itemId}-${g.count}`}
                        itemId={g.itemId}
                        count={g.count}
                        label="棋盘投放"
                        itemsById={itemsById}
                        hasSprite={hasSprite}
                        spriteUrlByItemId={spriteUrlByItemId}
                        spriteUrlByName={spriteUrlByName}
                      />
                    ))}
                  </div>
                )}
              </div>
            </section>
          </ModuleWithHelp>

          <ModuleWithHelp helpTitle="说明" help={<HelpBlock text={levelGuideHelp.rawBlock} />}>
            <pre className="max-h-64 overflow-auto rounded-md border border-gray-200 bg-gray-900 p-4 text-xs text-gray-100">
              {activeRaw}
            </pre>
          </ModuleWithHelp>
        </>
      )}

      <ModuleWithHelp helpTitle="说明" help={<HelpBlock text={levelGuideHelp.idLookup} />}>
        <section className="space-y-3">
          <input
            type="text"
            value={lookupIds}
            onChange={(e) => setLookupIds(e.target.value)}
            placeholder="输入 ItemId，逗号分隔，如 852,61,853"
            className="w-full max-w-md rounded-sm border border-gray-200 px-3 py-2 text-sm"
          />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {lookupGoals.map((g) => (
              <ItemGoalCard
                key={`l-${g.itemId}`}
                itemId={g.itemId}
                count={g.count}
                label="ID 查询"
                itemsById={itemsById}
                hasSprite={hasSprite}
                spriteUrlByItemId={spriteUrlByItemId}
                spriteUrlByName={spriteUrlByName}
              />
            ))}
          </div>
        </section>
      </ModuleWithHelp>
    </div>
  );
}
