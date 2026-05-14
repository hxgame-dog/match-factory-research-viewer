"use client";

import { useEffect, useState } from "react";
import { useRegisterExports } from "@/components/ExportToolbar";
import { HelpBlock, ModuleWithHelp } from "@/components/ModuleWithHelp";
import { bundlesHelp } from "@/content/inlineHelp.zh";
import { downloadCsv } from "@/lib/csvDownload";

type Cat = {
  locatorId: string;
  buildResultHash: string;
  internalIdCount: number;
  assetKeyCount: number;
  bundlesWithLocalFile: {
    internalId: string;
    fileName: string;
    localPath: string;
    bytes: number | null;
  }[];
  sampleAssetKeys: string[];
};

export default function BundlesPage() {
  const [c, setC] = useState<Cat | null>(null);

  useEffect(() => {
    fetch("/data/catalog_extract.json")
      .then((r) => r.json())
      .then(setC);
  }, []);

  useRegisterExports([c], () => {
    if (!c) return [];
    return [
      {
        id: "catalog-local-bundles",
        label: "导出本地 bundle 表 CSV",
        run: () =>
          downloadCsv(
            "catalog_local_bundles.csv",
            ["internalId", "fileName", "localPath", "bytes"],
            c.bundlesWithLocalFile.map((b) => ({
              internalId: b.internalId,
              fileName: b.fileName,
              localPath: b.localPath,
              bytes: b.bytes ?? "",
            })),
          ),
      },
      {
        id: "catalog-sample-keys",
        label: "导出示例资源键 CSV",
        run: () =>
          downloadCsv(
            "catalog_sample_asset_keys.csv",
            ["index", "assetKey"],
            c.sampleAssetKeys.map((k, i) => ({ index: i, assetKey: k })),
          ),
      },
    ];
  });

  if (!c) return <p className="text-gray-500">加载中…</p>;

  return (
    <div className="space-y-12">
      <ModuleWithHelp helpTitle="说明" help={<HelpBlock text={bundlesHelp.header} />}>
        <div>
          <h2 className="font-serif text-lg font-semibold text-gray-900">Addressables 资源目录</h2>
          <ul className="mt-4 list-inside list-disc text-sm text-gray-700">
            <li>Locator：{c.locatorId}</li>
            <li>Build hash：{c.buildResultHash}</li>
            <li>InternalId 数量：{c.internalIdCount.toLocaleString()}</li>
            <li>其中 `.asset` 等键约：{c.assetKeyCount.toLocaleString()}</li>
          </ul>
          <p className="mt-3 text-xs text-gray-500">CSV 导出请使用页面底部「本页导出」条。</p>
        </div>
      </ModuleWithHelp>

      <ModuleWithHelp helpTitle="说明" help={<HelpBlock text={bundlesHelp.localFiles} />}>
        <section>
          <h3 className="text-sm font-medium text-gray-900">本地 bundle 文件</h3>
          <div className="mt-2 overflow-x-auto rounded-md border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-gray-600">
                  <th className="px-3 py-2">文件</th>
                  <th className="px-3 py-2">字节</th>
                </tr>
              </thead>
              <tbody>
                {c.bundlesWithLocalFile.map((b) => (
                  <tr key={b.internalId} className="border-b border-gray-100">
                    <td className="px-3 py-2 font-mono text-xs">{b.fileName}</td>
                    <td className="px-3 py-2 text-gray-600">{b.bytes?.toLocaleString() ?? "缺失"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </ModuleWithHelp>

      <ModuleWithHelp helpTitle="说明" help={<HelpBlock text={bundlesHelp.keys} />}>
        <section>
          <h3 className="text-sm font-medium text-gray-900">资源键示例（前 200）</h3>
          <p className="mt-1 text-xs text-gray-500">可用于检索道具/皮肤等 Addressable 键名。</p>
          <ul className="mt-2 max-h-80 overflow-y-auto rounded-md border border-gray-200 bg-white p-3 font-mono text-xs text-gray-700">
            {c.sampleAssetKeys.map((k) => (
              <li key={k}>{k}</li>
            ))}
          </ul>
        </section>
      </ModuleWithHelp>
    </div>
  );
}
