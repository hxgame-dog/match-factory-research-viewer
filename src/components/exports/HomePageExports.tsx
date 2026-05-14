"use client";

import { useRegisterExports } from "@/components/ExportToolbar";
import { downloadPublicAsset } from "@/lib/csvDownload";

/** 概览页：inventory 原始 JSON */
export function HomePageExports({ enabled }: { enabled: boolean }) {
  useRegisterExports([enabled], () =>
    enabled
      ? [
          {
            id: "inventory-json",
            label: "下载 inventory_summary.json",
            run: () => downloadPublicAsset("/data/inventory_summary.json", "inventory_summary.json"),
          },
        ]
      : [],
  );

  return null;
}
