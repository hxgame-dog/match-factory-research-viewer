"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItemClass } from "@/lib/navItemStyles";

type Props = {
  href: string;
  children: ReactNode;
};

export function NavLink({ href, children }: Props) {
  const pathname = usePathname();
  const active = pathname === href || (href !== "/" && pathname.startsWith(href + "/"));

  return (
    <Link href={href} className={navItemClass(active)}>
      {children}
    </Link>
  );
}
