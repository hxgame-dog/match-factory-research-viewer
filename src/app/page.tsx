import fs from "fs/promises";
import Link from "next/link";
import path from "path";
import { HomePageExports } from "@/components/exports/HomePageExports";
import { HelpBlock, ModuleWithHelp } from "@/components/ModuleWithHelp";
import { homeHelp } from "@/content/inlineHelp.zh";

type Inv = {
  matchFactoryRoot: string;
  unityDataAssetPack: {
    totalFiles: number;
    totalBytes: number;
    byExtension: { ext: string; count: number; bytes: number }[];
    lvlByTopFolder: Record<string, number>;
  };
  mainApkAssets: { totalFiles: number; totalBytes: number };
  globalMetadataDat: string[];
};

async function loadInv(): Promise<Inv | null> {
  try {
    const p = path.join(process.cwd(), "public", "data", "inventory_summary.json");
    const raw = await fs.readFile(p, "utf-8");
    return JSON.parse(raw) as Inv;
  } catch {
    return null;
  }
}

function fmtBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

export default async function HomePage() {
  const inv = await loadInv();
  if (!inv) {
    return (
      <div className="rounded-md border border-gray-200 bg-white p-6 text-gray-700">
        <HomePageExports enabled={false} />
        <p>未找到 `public/data/inventory_summary.json`。</p>
        <p className="mt-2 text-sm text-gray-500">
          请在项目根目录执行：<code className="rounded bg-gray-100 px-1">npm run ingest</code>
        </p>
      </div>
    );
  }

  const topExt = inv.unityDataAssetPack.byExtension.slice(0, 12);
  const buckets = inv.unityDataAssetPack.lvlByTopFolder;
  const maxBucket = Math.max(...Object.values(buckets), 1);

  return (
    <div className="space-y-12">
      <HomePageExports enabled />
      <ModuleWithHelp helpTitle="本模块说明" help={<HelpBlock text={homeHelp.topicShortcuts} />}>
        <section className="rounded-md border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="font-serif text-lg font-semibold text-gray-900">专题可视化</h2>
          <p className="mt-2 text-sm text-gray-600">
            关卡分布、模板数值、物品维度、计费与广告字符串分桶等已聚合到{" "}
            <code className="rounded bg-gray-100 px-1">topic_analysis.json</code>，在专题页用图表与热力图展示。
          </p>
          <p className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/analysis"
              className="inline-block rounded-sm border border-gray-900 bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-800"
            >
              打开专题分析（/analysis）
            </Link>
            <Link
              href="/guide"
              className="inline-block rounded-sm border border-gray-200 bg-white px-4 py-2 text-sm text-gray-800 hover:bg-gray-50"
            >
              使用说明（/guide）
            </Link>
          </p>
        </section>
      </ModuleWithHelp>

      <ModuleWithHelp helpTitle="本模块说明" help={<HelpBlock text={homeHelp.dataSource} />}>
        <section className="rounded-md border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="font-serif text-lg font-semibold text-gray-900">数据源</h2>
          <p className="mt-2 break-all text-sm text-gray-500">{inv.matchFactoryRoot}</p>
          <ul className="mt-4 list-inside list-disc text-sm text-gray-700">
            <li>
              Unity 资源包文件数：{inv.unityDataAssetPack.totalFiles.toLocaleString()}，约{" "}
              {fmtBytes(inv.unityDataAssetPack.totalBytes)}
            </li>
            <li>
              主包 assets 文件数：{inv.mainApkAssets.totalFiles.toLocaleString()}，约{" "}
              {fmtBytes(inv.mainApkAssets.totalBytes)}
            </li>
            <li>
              global-metadata.dat：{inv.globalMetadataDat.length} 处（Il2CppDumper 入口）
            </li>
          </ul>
        </section>
      </ModuleWithHelp>

      <ModuleWithHelp helpTitle="本模块说明" help={<HelpBlock text={homeHelp.lvlDistribution} />}>
        <section className="rounded-md border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="font-serif text-lg font-semibold text-gray-900">
            关卡 `.lvl` 分布（按顶层目录）
          </h2>
          <div className="mt-4 space-y-3">
            {Object.entries(buckets).map(([k, v]) => (
              <div key={k}>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>{k}</span>
                  <span>{v.toLocaleString()}</span>
                </div>
                <div className="mt-1 h-2 w-full rounded-sm bg-gray-100">
                  <div
                    className="h-2 rounded-sm bg-gray-800"
                    style={{ width: `${(v / maxBucket) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      </ModuleWithHelp>

      <ModuleWithHelp helpTitle="本模块说明" help={<HelpBlock text={homeHelp.extensions} />}>
        <section className="rounded-md border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="font-serif text-lg font-semibold text-gray-900">
            UnityDataAssetPack 扩展名 Top 12（按数量）
          </h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500">
                  <th className="py-2 pr-4 font-medium">扩展名</th>
                  <th className="py-2 pr-4 font-medium">数量</th>
                  <th className="py-2 font-medium">体积</th>
                </tr>
              </thead>
              <tbody>
                {topExt.map((r) => (
                  <tr key={r.ext} className="border-b border-gray-100">
                    <td className="py-2 pr-4 text-gray-900">{r.ext}</td>
                    <td className="py-2 pr-4 text-gray-600">{r.count.toLocaleString()}</td>
                    <td className="py-2 text-gray-600">{fmtBytes(r.bytes)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </ModuleWithHelp>

      <p className="text-xs text-gray-400">
        更完整的分级说明见仓库内 <code className="rounded bg-gray-100 px-1">INVENTORY.md</code>。各模块旁灰色框为「说明」，全文手册见{" "}
        <Link href="/guide" className="text-gray-600 underline">
          /guide
        </Link>
        。
      </p>
    </div>
  );
}
