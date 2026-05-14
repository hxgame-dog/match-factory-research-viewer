"use client";

import { useRegisterExports } from "@/components/ExportToolbar";
import { downloadPublicAsset } from "@/lib/csvDownload";

/** 数据研究页：常用静态数据一键拉取 */
export function ResearchPageExports() {
  useRegisterExports([], () => [
    {
      id: "research-db",
      label: "下载 research.db",
      run: () => downloadPublicAsset("/data/research.db", "research.db"),
    },
    {
      id: "lvl-schema-json",
      label: "下载 lvl_protobuf_schema.json",
      run: () => downloadPublicAsset("/data/lvl_protobuf_schema.json", "lvl_protobuf_schema.json"),
    },
    {
      id: "catalog-blob-strings",
      label: "下载 catalog_blob_strings.json",
      run: () => downloadPublicAsset("/data/catalog_blob_strings.json", "catalog_blob_strings.json"),
    },
  ]);

  return null;
}
