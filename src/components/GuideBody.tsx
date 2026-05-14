"use client";

import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const mdComponents: Components = {
  h1: ({ children }) => (
    <h1 className="mb-4 mt-10 border-b border-gray-200 pb-2 font-serif text-2xl font-semibold text-gray-900 first:mt-0">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="mb-3 mt-10 font-serif text-xl font-semibold text-gray-900">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="mb-2 mt-6 text-base font-semibold text-gray-900">{children}</h3>
  ),
  p: ({ children }) => <p className="mb-4 text-sm leading-relaxed text-gray-700">{children}</p>,
  hr: () => <hr className="my-8 border-gray-200" />,
  ul: ({ children }) => <ul className="mb-4 list-inside list-disc space-y-2 text-sm text-gray-700">{children}</ul>,
  ol: ({ children }) => <ol className="mb-4 list-inside list-decimal space-y-2 text-sm text-gray-700">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
  a: ({ href, children }) => (
    <a href={href} className="text-gray-900 underline decoration-gray-300 underline-offset-2 hover:decoration-gray-900">
      {children}
    </a>
  ),
  blockquote: ({ children }) => (
    <blockquote className="mb-4 border-l-2 border-gray-300 pl-4 text-sm text-gray-600">{children}</blockquote>
  ),
  table: ({ children }) => (
    <div className="mb-6 overflow-x-auto rounded-md border border-gray-200">
      <table className="w-full min-w-[320px] border-collapse text-left text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-gray-50">{children}</thead>,
  th: ({ children }) => (
    <th className="border-b border-gray-200 px-3 py-2 font-medium text-gray-800">{children}</th>
  ),
  td: ({ children }) => <td className="border-b border-gray-100 px-3 py-2 text-gray-700">{children}</td>,
  tr: ({ children }) => <tr>{children}</tr>,
  pre: ({ children }) => (
    <pre className="mb-4 overflow-x-auto rounded-md border border-gray-200 bg-gray-50 p-4 text-xs leading-relaxed text-gray-800">
      {children}
    </pre>
  ),
  code: ({ className, children, ...props }) => {
    const isBlock = Boolean(className?.includes("language-"));
    if (isBlock) {
      return (
        <code className={`font-mono text-xs text-gray-800 ${className || ""}`} {...props}>
          {children}
        </code>
      );
    }
    return (
      <code className="rounded-sm bg-gray-100 px-1 py-0.5 font-mono text-[13px] text-gray-900" {...props}>
        {children}
      </code>
    );
  },
};

export function GuideBody({ content }: { content: string }) {
  return (
    <article className="guide-md">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
        {content}
      </ReactMarkdown>
    </article>
  );
}
