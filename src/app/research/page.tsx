import fs from "fs/promises";
import path from "path";
import Link from "next/link";
import { ResearchPageExports } from "@/components/exports/ResearchPageExports";
import { HelpBlock, ModuleWithHelp } from "@/components/ModuleWithHelp";
import { researchHelp } from "@/content/inlineHelp.zh";

async function readJson(name: string): Promise<unknown | null> {
  try {
    const p = path.join(process.cwd(), "public", "data", name);
    const raw = await fs.readFile(p, "utf-8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export default async function ResearchPage() {
  const [schema, remote, blobs, datapack] = await Promise.all([
    readJson("lvl_protobuf_schema.json"),
    readJson("remote_catalog_meta.json"),
    readJson("catalog_blob_strings.json"),
    readJson("datapack_scan.json"),
  ]);

  return (
    <div className="space-y-12">
      <ResearchPageExports />
      <ModuleWithHelp helpTitle="说明" help={<HelpBlock text={researchHelp.header} />}>
        <div>
          <h2 className="font-serif text-lg font-semibold text-gray-900">数据导出与研究</h2>
          <p className="mt-1 text-sm text-gray-500">
            由 <code className="rounded bg-gray-100 px-1">npm run ingest</code> 生成。SQLite 可用{" "}
            <a className="text-gray-700 underline" href="/data/research.db">
              下载 research.db
            </a>{" "}
            后用 DB Browser / <code className="rounded bg-gray-100 px-1">sqlite3</code> 打开。
          </p>
        </div>
      </ModuleWithHelp>

      <ModuleWithHelp helpTitle="说明" help={<HelpBlock text={researchHelp.schema} />}>
        <section className="rounded-md border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-medium text-gray-900">`.lvl` Protobuf 字段（来自 Il2Cpp dump.cs）</h3>
          <p className="mt-1 text-xs text-gray-500">
            与「.lvl 说明」页中 <code className="rounded bg-gray-100 px-1">protoc --decode_raw</code> 对照阅读。
          </p>
          <pre className="mt-3 max-h-80 overflow-auto rounded bg-gray-50 p-3 font-mono text-xs text-gray-800">
            {schema ? JSON.stringify(schema, null, 2) : "（未生成 lvl_protobuf_schema.json）"}
          </pre>
        </section>
      </ModuleWithHelp>

      <ModuleWithHelp helpTitle="说明" help={<HelpBlock text={researchHelp.remote} />}>
        <section className="rounded-md border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-medium text-gray-900">远程 Addressables 探测</h3>
          <pre className="mt-2 max-h-64 overflow-auto rounded bg-gray-50 p-3 font-mono text-xs text-gray-800">
            {remote ? JSON.stringify(remote, null, 2) : "（未生成，可检查网络或设置 SKIP_REMOTE_INGEST=1 跳过）"}
          </pre>
        </section>
      </ModuleWithHelp>

      <ModuleWithHelp helpTitle="说明" help={<HelpBlock text={researchHelp.blobs} />}>
        <section className="rounded-md border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-medium text-gray-900">catalog 二进制段中的 ASCII 高频串（启发式）</h3>
          <p className="mt-1 text-xs text-gray-500">
            非 Unity 官方完整解析，仅用于嗅探 key / 路径片段。
          </p>
          <pre className="mt-2 max-h-72 overflow-auto rounded bg-gray-50 p-3 font-mono text-xs text-gray-800">
            {blobs ? JSON.stringify(blobs, null, 2) : "（未生成 catalog_blob_strings.json）"}
          </pre>
        </section>
      </ModuleWithHelp>

      <ModuleWithHelp helpTitle="说明" help={<HelpBlock text={researchHelp.datapack} />}>
        <section className="rounded-md border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-medium text-gray-900">datapack / resources UnityPy 扫描</h3>
          <pre className="mt-2 max-h-72 overflow-auto rounded bg-gray-50 p-3 font-mono text-xs text-gray-800">
            {datapack ? JSON.stringify(datapack, null, 2) : "（未生成 datapack_scan.json）"}
          </pre>
        </section>
      </ModuleWithHelp>

      <p className="text-xs text-gray-400">
        返回 <Link href="/lvl">.lvl 说明</Link> · <Link href="/bundles">资源分包</Link>
      </p>
    </div>
  );
}
