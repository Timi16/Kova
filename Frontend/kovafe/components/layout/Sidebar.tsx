'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home, Compass, PlusSquare, Bell, User,
  TrendingUp, Zap,
} from "lucide-react";
import { SignInButton } from "@/components/auth/SignInButton";

const navItems = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/explore", icon: Compass, label: "Explore" },
  { href: "/create", icon: PlusSquare, label: "Create", accent: true },
  { href: "/notifications", icon: Bell, label: "Notifications" },
  { href: "/profile/me", icon: User, label: "Profile" },
  { href: "/marketplace", icon: TrendingUp, label: "Marketplace" },
  { href: "/activity", icon: Zap, label: "Activity" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-60 flex-col border-r border-border bg-background z-40">
      <Link href="/" className="flex items-center gap-2 px-6 py-6">
        <span className="inline-block w-3 h-3 rounded-sm bg-primary" />
        <span className="text-lg font-bold tracking-tight text-foreground uppercase">
          Kalieso
        </span>
      </Link>

      <nav className="flex-1 px-3 space-y-1">
        {navItems.map(({ href, icon: Icon, label, accent }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-default ${
                active
                  ? "bg-surface-elevated text-foreground"
                  : accent
                  ? "text-primary hover:bg-accent-subtle"
                  : "text-muted-foreground hover:bg-surface hover:text-foreground"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border">
        <SignInButton />
      </div>
    </aside>
  );
}
