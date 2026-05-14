"use client";

import { useEffect, useState } from "react";
import { useRegisterExports } from "@/components/ExportToolbar";
import { HelpBlock, ModuleWithHelp } from "@/components/ModuleWithHelp";
import { lvlHelp } from "@/content/inlineHelp.zh";
import { downloadJson } from "@/lib/csvDownload";

type PbSample = {
  fileName?: string;
  relativePath?: string;
  bytes?: number;
  decodeRawText?: string;
  skipped?: string;
  error?: string;
  returncode?: number;
  stderr?: string;
};

type LvlDoc = {
  specialLvlFiles?: unknown[];
  fingerprints?: unknown;
  protocDecodeRaw?: {
    protoc: string | null;
    note?: string;
    sampleCount?: number;
    samples?: PbSample[];
  };
};

export default function LvlNotesPage() {
  const [raw, setRaw] = useState<LvlDoc | null>(null);

  useEffect(() => {
    fetch("/data/lvl_format_notes.json")
      .then((r) => r.json())
      .then(setRaw);
  }, []);

  useRegisterExports([raw], () =>
    !raw
      ? []
      : [
          {
            id: "lvl-format-notes-json",
            label: "导出 lvl_format_notes.json",
            run: () => downloadJson("lvl_format_notes.json", raw),
          },
        ],
  );

  if (!raw) return <p className="text-gray-500">加载中…</p>;

  const pb = raw.protocDecodeRaw;

  return (
    <div className="space-y-12">
      <ModuleWithHelp helpTitle="说明" help={<HelpBlock text={lvlHelp.header} />}>
        <div>
          <h2 className="font-serif text-lg font-semibold text-gray-900">`.lvl` 抽样与 `ud`/`gd` 文件头</h2>
          <p className="text-sm text-gray-500">
            详细说明见仓库 <code className="rounded bg-gray-100 px-1">LVL_NOTES.md</code>。完整 JSON 可自底部「本页导出」下载。
          </p>
        </div>
      </ModuleWithHelp>

      {pb && (
        <ModuleWithHelp helpTitle="说明" help={<HelpBlock text={lvlHelp.protoc} />}>
          <section>
            <h3 className="text-sm font-medium text-gray-900">protoc --decode_raw（Protobuf 无 schema 结构）</h3>
            {pb.protoc ? (
              <p className="mt-1 break-all text-xs text-gray-500">使用：{pb.protoc}</p>
            ) : (
              <p className="mt-1 text-sm text-amber-800">{pb.note ?? "未配置 protoc"}</p>
            )}
            <div className="mt-4 space-y-6">
              {(pb.samples ?? []).map((s) => (
                <div key={s.fileName ?? s.relativePath} className="rounded-md border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="text-sm font-medium text-gray-900">{s.fileName}</div>
                  {s.relativePath && (
                    <div className="mt-1 font-mono text-xs text-gray-500">{s.relativePath}</div>
                  )}
                  {s.bytes != null && <div className="text-xs text-gray-500">字节：{s.bytes}</div>}
                  {s.skipped && <div className="text-xs text-gray-600">跳过：{s.skipped}</div>}
                  {s.error && <div className="text-xs text-red-700">{s.error}</div>}
                  {s.returncode != null && s.returncode !== 0 && (
                    <div className="text-xs text-red-700">
                      protoc 退出码 {s.returncode}
                      {s.stderr && (
                        <pre className="mt-2 max-h-32 overflow-auto whitespace-pre-wrap rounded bg-red-50 p-2">
                          {s.stderr}
                        </pre>
                      )}
                    </div>
                  )}
                  {s.decodeRawText && (
                    <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap rounded bg-gray-50 p-3 font-mono text-xs text-gray-800">
                      {s.decodeRawText}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          </section>
        </ModuleWithHelp>
      )}

      <ModuleWithHelp helpTitle="说明" help={<HelpBlock text={lvlHelp.rawJson} />}>
        <section>
          <h3 className="text-sm font-medium text-gray-900">原始 JSON（指纹与特殊文件）</h3>
          <pre className="mt-2 max-h-[24rem] overflow-auto rounded-md border border-gray-200 bg-white p-4 text-xs text-gray-800 shadow-sm">
            {JSON.stringify({ specialLvlFiles: raw.specialLvlFiles, fingerprints: raw.fingerprints }, null, 2)}
          </pre>
        </section>
      </ModuleWithHelp>
    </div>
  );
}
