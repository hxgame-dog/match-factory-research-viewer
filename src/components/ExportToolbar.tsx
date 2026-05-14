"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type ExportToolbarAction = {
  id: string;
  label: string;
  run: () => void;
};

type Ctx = {
  register: (actions: ExportToolbarAction[]) => void;
};

const ExportToolbarContext = createContext<Ctx | null>(null);

function ExportToolbarStrip({ actions }: { actions: ExportToolbarAction[] }) {
  if (actions.length === 0) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-30 border-t border-gray-200 bg-white/95 backdrop-blur-sm shadow-[0_-4px_14px_rgba(0,0,0,0.06)]"
      role="region"
      aria-label="本页导出"
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2 px-4 py-2.5 sm:px-6">
        <span className="text-xs font-medium text-gray-500">本页导出</span>
        <div className="flex flex-wrap items-center gap-2">
          {actions.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => a.run()}
              className="rounded-sm border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-800 shadow-sm hover:border-gray-300 hover:bg-gray-50"
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ExportToolbarProvider({ children }: { children: ReactNode }) {
  const [actions, setActions] = useState<ExportToolbarAction[]>([]);
  const register = useCallback((next: ExportToolbarAction[]) => {
    setActions(next);
  }, []);

  const value = useMemo(() => ({ register }), [register]);

  return (
    <ExportToolbarContext.Provider value={value}>
      {children}
      <ExportToolbarStrip actions={actions} />
    </ExportToolbarContext.Provider>
  );
}

/** 在 deps 变化时刷新底部导出条；卸载时清空。factory 每次应返回最新闭包（含 run）。 */
export function useRegisterExports(deps: readonly unknown[], factory: () => ExportToolbarAction[]): void {
  const ctx = useContext(ExportToolbarContext);

  useEffect(() => {
    if (!ctx) return;
    ctx.register(factory());
    return () => {
      ctx.register([]);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 由调用方传入 deps 控制刷新
  }, [ctx, ...deps]);
}
