"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type NavLinkProps = {
  href: string;
  children: ReactNode;
  className?: string;
  activeClassName?: string;
  exact?: boolean;
};

export function NavLink({
  href,
  children,
  className,
  activeClassName,
  exact = false,
}: NavLinkProps) {
  const pathname = usePathname();
  const isActive = exact ? pathname === href : pathname?.startsWith(href);

  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center rounded-md px-3 py-2 text-sm",
        className,
        isActive && activeClassName
      )}
    >
      {children}
    </Link>
  );
}
