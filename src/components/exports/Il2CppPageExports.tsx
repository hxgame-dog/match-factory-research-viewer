"use client";

import { useRegisterExports } from "@/components/ExportToolbar";
import { downloadPublicAsset } from "@/lib/csvDownload";

/** Il2Cpp 页：聚合 hints 原始 JSON */
export function Il2CppPageExports() {
  useRegisterExports([], () => [
    {
      id: "il2cpp-hints-json",
      label: "下载 il2cpp_hints.json",
      run: () => downloadPublicAsset("/data/il2cpp_hints.json", "il2cpp_hints.json"),
    },
  ]);

  return null;
}
