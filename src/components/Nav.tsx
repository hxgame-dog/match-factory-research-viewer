import Link from "next/link";
import { NavLink } from "@/components/NavLink";

const links = [
  { href: "/guide", label: "使用说明" },
  { href: "/", label: "概览" },
  { href: "/analysis", label: "专题分析" },
  { href: "/items", label: "物品表" },
  { href: "/level-guide", label: "关卡配置" },
  { href: "/templates", label: "关卡模板" },
  { href: "/levels", label: "关卡索引" },
  { href: "/bundles", label: "资源分包" },
  { href: "/sdk", label: "计费与广告" },
  { href: "/lvl", label: ".lvl 说明" },
  { href: "/il2cpp", label: "Il2Cpp" },
  { href: "/research", label: "数据研究" },
];

export function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-4">
          <div className="min-w-0 shrink-0">
            <Link href="/" className="block hover:opacity-90">
              <h1 className="font-serif text-xl font-semibold tracking-tight text-gray-900">
                Match Factory 研究视图
              </h1>
            </Link>
            <p className="mt-0.5 text-xs text-gray-500 sm:text-sm">本地包体解析数据，仅供个人学习研究</p>
          </div>
          <nav
            className="-mx-1 flex max-w-full flex-nowrap gap-1.5 overflow-x-auto px-1 pb-1 pt-0.5 [scrollbar-width:thin] lg:min-w-0 lg:flex-1 lg:justify-end"
            aria-label="主导航"
          >
            {links.map((l) => (
              <NavLink key={l.href} href={l.href}>
                {l.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}
