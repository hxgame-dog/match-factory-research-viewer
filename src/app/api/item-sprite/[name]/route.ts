import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const BUNDLES = ["itempack-01", "itempack52", "itempackcommon"];
const DEFAULT_ROOT = "/Users/fulei/Downloads/match-factory-1-64-246";

export async function GET(
  _req: Request,
  { params }: { params: { name: string } },
) {
  const raw = params.name;
  const name = decodeURIComponent(raw).replace(/\.png$/i, "");
  if (!/^[\w.-]+$/.test(name)) {
    return NextResponse.json({ error: "非法文件名" }, { status: 400 });
  }

  for (const bundle of BUNDLES) {
    const pubPath = path.join(process.cwd(), "public", "sprites", bundle, `${name}.png`);
    try {
      const buf = await readFile(pubPath);
      return new NextResponse(buf, {
        headers: {
          "Content-Type": "image/png",
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    } catch {
      /* next */
    }
  }

  const root = process.env.MATCH_FACTORY_ROOT || DEFAULT_ROOT;
  for (const bundle of BUNDLES) {
    const filePath = path.join(
      root,
      "exported",
      "addressables_itempack",
      bundle,
      "sprites",
      `${name}.png`,
    );
    try {
      const buf = await readFile(filePath);
      return new NextResponse(buf, {
        headers: {
          "Content-Type": "image/png",
          "Cache-Control": "public, max-age=86400",
        },
      });
    } catch {
      /* next */
    }
  }

  return NextResponse.json({ error: "未找到贴图", name }, { status: 404 });
}
