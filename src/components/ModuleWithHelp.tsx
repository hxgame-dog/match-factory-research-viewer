import type { ReactNode } from "react";

/** 将多段说明按空行拆成段落 */
export function HelpBlock({ text }: { text: string }) {
  if (!text.trim()) return null;
  return (
    <>
      {text
        .trim()
        .split(/\n\n+/)
        .map((para, i) => (
          <p key={i} className="text-xs leading-relaxed text-gray-600">
            {para}
          </p>
        ))}
    </>
  );
}

type ModuleWithHelpProps = {
  children: ReactNode;
  /** 右侧说明：可用 <HelpBlock text={...} /> 或任意 React 节点 */
  help: ReactNode;
  helpTitle?: string;
  className?: string;
};

/**
 * 大屏：左侧内容、右侧固定宽度说明（sticky）。
 * 小屏：说明在模块下方，避免遮挡。
 */
export function ModuleWithHelp({ children, help, helpTitle = "说明", className }: ModuleWithHelpProps) {
  return (
    <section
      className={`grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_min(100%,288px)] lg:items-start lg:gap-8 ${className ?? ""}`}
    >
      <div className="min-w-0">{children}</div>
      <aside className="rounded-md border border-gray-200 bg-gray-50 p-4 lg:sticky lg:top-6 lg:self-start">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">{helpTitle}</p>
        <div className="mt-2 space-y-2">{help}</div>
      </aside>
    </section>
  );
}
