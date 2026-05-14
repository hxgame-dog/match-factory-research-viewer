"use client";

import { useEffect, useState } from "react";
import { useRegisterExports } from "@/components/ExportToolbar";
import { HelpBlock, ModuleWithHelp } from "@/components/ModuleWithHelp";
import { SdkStringsExplorer } from "@/components/SdkStringsExplorer";
import { sdkHelp } from "@/content/inlineHelp.zh";
import { downloadCsv } from "@/lib/csvDownload";

type HitFile = { source: string; lines: string[] };

export default function SdkPage() {
  const [dex, setDex] = useState<string[]>([]);
  const [cpp, setCpp] = useState<HitFile | null>(null);

  useEffect(() => {
    fetch("/data/dex_strings_sdk.json")
      .then((r) => r.json())
      .then((j) => setDex(j.candidates ?? []));
    fetch("/data/il2cpp_strings_sdk.json")
      .then((r) => r.json())
      .then((j) => setCpp({ source: j.source ?? "", lines: j.candidates ?? [] }));
  }, []);

  useRegisterExports([dex, cpp], () => {
    const actions: { id: string; label: string; run: () => void }[] = [];
    if (dex.length) {
      actions.push({
        id: "dex-csv",
        label: "导出 DEX 字符串 CSV",
        run: () => downloadCsv("dex_strings_sdk.csv", ["line"], dex.map((l) => ({ line: l }))),
      });
    }
    if (cpp?.lines.length) {
      actions.push({
        id: "il2cpp-csv",
        label: "导出 libil2cpp 字符串 CSV",
        run: () =>
          downloadCsv(
            "il2cpp_strings_sdk.csv",
            ["source", "line"],
            cpp.lines.map((l) => ({ source: cpp.source, line: l })),
          ),
      });
    }
    return actions;
  });

  return (
    <div className="space-y-12">
      <ModuleWithHelp helpTitle="说明" help={<HelpBlock text={sdkHelp.header} />}>
        <div>
          <h2 className="font-serif text-lg font-semibold text-gray-900">计费与广告（客户端字符串证据）</h2>
          <p className="mt-1 text-sm text-gray-500">
            由 <code className="rounded bg-gray-100 px-1">strings</code> 从 DEX / <code className="rounded bg-gray-100 px-1">libil2cpp.so</code>{" "}
            过滤得到，非官方文档；价格与展示逻辑仍以商店与线上下发为准。可按分桶浏览、全文搜索；完整列表导出见底部「本页导出」。
          </p>
        </div>
      </ModuleWithHelp>

      <ModuleWithHelp helpTitle="说明" help={<HelpBlock text={sdkHelp.dex} />}>
        <SdkStringsExplorer title="classes.dex / classes2.dex 命中" lines={dex} fallbackTag="dex" />
      </ModuleWithHelp>

      <ModuleWithHelp helpTitle="说明" help={<HelpBlock text={sdkHelp.il2cpp} />}>
        {cpp && cpp.lines.length > 0 ? (
          <div className="space-y-2">
            <p className="text-xs text-gray-500 break-all">源文件：{cpp.source}</p>
            <SdkStringsExplorer title="libil2cpp.so 命中" lines={cpp.lines} fallbackTag="libil2cpp.so" />
          </div>
        ) : (
          <p className="text-sm text-gray-500">暂无 il2cpp 候选行。</p>
        )}
      </ModuleWithHelp>
    </div>
  );
}
