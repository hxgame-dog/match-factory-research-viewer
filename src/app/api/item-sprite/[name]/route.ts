import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const DEFAULT_ROOT = "/Users/fulei/Downloads/match-factory-1-64-246";

const SPRITE_DIRS = [
  "exported/addressables_itempack/itempack-01/sprites",
  "exported/addressables_itempack/itempack52/sprites",
  "exported/addressables_itempack/itempackcommon/sprites",
];

export async function GET(
  _req: Request,
  { params }: { params: { name: string } },
) {
  const raw = params.name;
  const name = decodeURIComponent(raw).replace(/\.png$/i, "");
  if (!/^[\w.-]+$/.test(name)) {
    return NextResponse.json({ error: "非法文件名" }, { status: 400 });
  }

  const root = process.env.MATCH_FACTORY_ROOT || DEFAULT_ROOT;
  for (const sub of SPRITE_DIRS) {
    const filePath = path.join(root, sub, `${name}.png`);
    try {
      const buf = await readFile(filePath);
      return new NextResponse(buf, {
        headers: {
          "Content-Type": "image/png",
          "Cache-Control": "public, max-age=86400",
        },
      });
    } catch {
      /* try next dir */
    }
  }

  return NextResponse.json(
    {
      error: "未找到贴图",
      hint: "请确认已 export:itempack，且 MATCH_FACTORY_ROOT 指向包体目录",
      name,
    },
    { status: 404 },
  );
}
