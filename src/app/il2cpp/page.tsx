import path from "path";
import { Il2CppPageExports } from "@/components/exports/Il2CppPageExports";
import { HelpBlock, ModuleWithHelp } from "@/components/ModuleWithHelp";
import { Il2CppClassSearch } from "@/components/Il2CppClassSearch";
import { Il2CppStringSearch } from "@/components/Il2CppStringSearch";
import { il2cppHelp } from "@/content/inlineHelp.zh";

type Hints = {
  dumpCsExists: boolean;
  note?: string;
  dumpPath?: string;
  dumpSizeBytes?: number;
  scannedLineCap?: number;
  classHitsCount?: number;
  classHits?: string[];
  classGroups?: Record<string, string[]>;
  stringLiteralHitsCount?: number;
  stringLiteralHits?: string[];
  lineHitsSample?: string[];
};

async function loadHints(): Promise<Hints | null> {
  try {
    const fs = await import("fs/promises");
    const p = path.join(process.cwd(), "public", "data", "il2cpp_hints.json");
    const raw = await fs.readFile(p, "utf-8");
    return JSON.parse(raw) as Hints;
  } catch {
    return null;
  }
}

export default async function Il2CppPage() {
  const h = await loadHints();
  if (!h) {
    return (
      <p className="text-gray-500">
        未找到 il2cpp_hints.json，请先执行 <code className="rounded bg-gray-100 px-1">npm run ingest</code>
      </p>
    );
  }

  const groups = h.classGroups ?? {};
  const strs = h.stringLiteralHits ?? [];

  return (
    <div className="space-y-12">
      <Il2CppPageExports />
      <ModuleWithHelp helpTitle="说明" help={<HelpBlock text={il2cppHelp.header} />}>
        <div>
          <h2 className="font-serif text-lg font-semibold text-gray-900">Il2Cpp 类型与字符串线索</h2>
          <p className="mt-1 text-sm text-gray-500">
            由 <code className="rounded bg-gray-100 px-1">dump.cs</code> 与{" "}
            <code className="rounded bg-gray-100 px-1">stringliteral.json</code> 启发式抽取。重新生成：{" "}
            <code className="rounded bg-gray-100 px-1">npm run ingest:il2cpp</code> 或{" "}
            <code className="rounded bg-gray-100 px-1">npm run ingest:il2cpp-hints</code>。
          </p>
        </div>
      </ModuleWithHelp>

      <ModuleWithHelp helpTitle="说明" help={<HelpBlock text={il2cppHelp.dumpStatus} />}>
        <div>
          {!h.dumpCsExists ? (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              {h.note ?? "尚未生成 dump.cs"}
            </div>
          ) : (
            <ul className="list-inside list-disc text-sm text-gray-700">
              <li className="break-all">dump.cs：{h.dumpPath}</li>
              <li>大小：{h.dumpSizeBytes?.toLocaleString()} 字节</li>
              {h.scannedLineCap != null && <li>dump.cs 扫描行上限：{h.scannedLineCap.toLocaleString()}</li>}
              <li>命中类型数：{h.classHitsCount?.toLocaleString()}</li>
              <li>筛选字符串字面量：{h.stringLiteralHitsCount?.toLocaleString() ?? strs.length}</li>
            </ul>
          )}
        </div>
      </ModuleWithHelp>

      {Object.keys(groups).length > 0 && (
        <ModuleWithHelp helpTitle="说明" help={<HelpBlock text={il2cppHelp.classGroups} />}>
          <section>
            <h3 className="text-sm font-medium text-gray-900">类名分组（粗分类）</h3>
            <div className="mt-3 grid gap-4 md:grid-cols-2">
              {Object.entries(groups).map(([label, items]) => (
                <div key={label} className="rounded-md border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="text-xs font-medium text-gray-900">{label}</div>
                  <div className="mt-2 max-h-48 overflow-y-auto font-mono text-xs text-gray-700">
                    {items.slice(0, 80).map((c) => (
                      <div key={c} className="border-b border-gray-50 py-0.5">
                        {c}
                      </div>
                    ))}
                    {items.length > 80 && (
                      <div className="pt-2 text-xs text-gray-400">… 另有 {items.length - 80} 条，请用下方全表搜索</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </ModuleWithHelp>
      )}

      {(h.classHits && h.classHits.length > 0) || strs.length > 0 ? (
        <ModuleWithHelp helpTitle="说明" help={<HelpBlock text={il2cppHelp.search} />}>
          <div className="space-y-8">
            {h.classHits && h.classHits.length > 0 && <Il2CppClassSearch classHits={h.classHits} />}
            {strs.length > 0 && <Il2CppStringSearch strings={strs} title="字符串字面量（策划 / SDK 关键词）" />}
          </div>
        </ModuleWithHelp>
      ) : null}

      {h.lineHitsSample && h.lineHitsSample.length > 0 && (
        <ModuleWithHelp helpTitle="说明" help={<HelpBlock text={il2cppHelp.lineSample} />}>
          <section>
            <h3 className="text-sm font-medium text-gray-900">dump.cs 行样例</h3>
            <pre className="mt-2 max-h-96 overflow-auto whitespace-pre-wrap rounded-md border border-gray-200 bg-white p-3 font-mono text-xs text-gray-800">
              {h.lineHitsSample.join("\n")}
            </pre>
          </section>
        </ModuleWithHelp>
      )}
    </div>
  );
}
