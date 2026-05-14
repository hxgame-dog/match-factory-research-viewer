import fs from "fs/promises";
import path from "path";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";

/** 每次请求读取磁盘上的 USER_GUIDE.zh-CN.md，改文档后无需重新 build 即可刷新看到（含 next start）。 */
export const dynamic = "force-dynamic";

const guideComponents: Components = {
  h1: ({ children }) => (
    <h1 className="mb-4 mt-2 font-serif text-2xl font-semibold tracking-tight text-gray-900">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="mb-3 mt-10 border-b border-gray-200 pb-2 font-serif text-xl font-semibold text-gray-900">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="mb-2 mt-8 font-serif text-lg font-semibold text-gray-900">{children}</h3>
  ),
  p: ({ children }) => <p className="mb-4 leading-relaxed text-gray-800">{children}</p>,
  ul: ({ children }) => <ul className="mb-4 list-disc space-y-2 pl-5 text-gray-800">{children}</ul>,
  ol: ({ children }) => <ol className="mb-4 list-decimal space-y-2 pl-5 text-gray-800">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
  hr: () => <hr className="my-10 border-gray-200" />,
  a: ({ href, children }) => {
    const h = href || "";
    if (h.startsWith("/")) {
      return (
        <Link href={h} className="text-gray-900 underline decoration-gray-300 underline-offset-2 hover:decoration-gray-900">
          {children}
        </Link>
      );
    }
    return (
      <a
        href={h}
        className="text-gray-900 underline decoration-gray-300 underline-offset-2 hover:decoration-gray-900"
        target="_blank"
        rel="noopener noreferrer"
      >
        {children}
      </a>
    );
  },
  code: ({ className, children, ...props }) => {
    const isBlock = /\blanguage-/.test(className || "");
    if (isBlock) {
      return (
        <code className={`${className || ""} text-[13px]`} {...props}>
          {children}
        </code>
      );
    }
    return (
      <code className="rounded-sm bg-gray-100 px-1.5 py-0.5 font-mono text-[13px] text-gray-900" {...props}>
        {children}
      </code>
    );
  },
  pre: ({ children }) => (
    <pre className="mb-6 overflow-x-auto rounded-md border border-gray-200 bg-gray-50 p-4 font-mono text-xs leading-relaxed text-gray-800">
      {children}
    </pre>
  ),
  table: ({ children }) => (
    <div className="mb-6 overflow-x-auto rounded-md border border-gray-200">
      <table className="min-w-full border-collapse text-left text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-gray-50">{children}</thead>,
  tbody: ({ children }) => <tbody className="divide-y divide-gray-100">{children}</tbody>,
  tr: ({ children }) => <tr className="border-b border-gray-100">{children}</tr>,
  th: ({ children }) => (
    <th className="border-b border-gray-200 px-3 py-2 font-medium text-gray-900">{children}</th>
  ),
  td: ({ children }) => <td className="px-3 py-2 text-gray-700">{children}</td>,
  blockquote: ({ children }) => (
    <blockquote className="mb-4 border-l-2 border-gray-300 pl-4 text-gray-600">{children}</blockquote>
  ),
};

export default async function GuidePage() {
  const mdPath = path.join(process.cwd(), "USER_GUIDE.zh-CN.md");
  let content = "";
  try {
    content = await fs.readFile(mdPath, "utf-8");
  } catch {
    content =
      "# 未找到说明文件\n\n请在项目根目录放置 `USER_GUIDE.zh-CN.md`，然后刷新本页。\n\n也可在仓库中查看 README 与 VISUALIZATION_DESIGN.md。";
  }

  return (
    <div className="pb-20">
      <div className="mb-8 rounded-md border border-gray-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">站内阅读</p>
        <h2 className="mt-1 font-serif text-xl font-semibold text-gray-900">详细使用说明</h2>
        <p className="mt-2 text-sm leading-relaxed text-gray-600">
          以下内容来自项目根目录的 <code className="rounded-sm bg-gray-100 px-1 font-mono text-xs">USER_GUIDE.zh-CN.md</code>
          ；本页每次加载都会重新读取该文件，在编辑器里保存后<strong>刷新浏览器</strong>即可看到最新正文。
        </p>
        <p className="mt-2 text-sm leading-relaxed text-gray-600">
          <strong className="text-gray-900">与界面对照：</strong>概览、物品表、关卡索引、专题分析等页面的<strong>每个大模块右侧</strong>都有灰色「说明」框（大屏在右侧，小屏在模块下方），文案集中在{" "}
          <code className="rounded-sm bg-gray-100 px-1 font-mono text-xs">src/content/inlineHelp.zh.ts</code>
          ，可与本文一起改。图表请用{" "}
          <Link href="/analysis" className="text-gray-900 underline decoration-gray-300 underline-offset-2 hover:decoration-gray-900">
            专题分析
          </Link>
          。
        </p>
      </div>

      <article className="max-w-3xl rounded-md border border-gray-200 bg-white p-6 shadow-sm md:p-10">
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={guideComponents}>
          {content}
        </ReactMarkdown>
      </article>
    </div>
  );
}
