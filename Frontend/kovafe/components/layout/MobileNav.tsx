'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, PlusSquare, Bell, User } from "lucide-react";

const tabs = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/explore", icon: Compass, label: "Explore" },
  { href: "/create", icon: PlusSquare, label: "Create" },
  { href: "/notifications", icon: Bell, label: "Alerts" },
  { href: "/profile/me", icon: User, label: "Profile" },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-background/90 backdrop-blur-md border-t border-border z-40 flex items-center justify-around px-2">
      {tabs.map(({ href, icon: Icon, label }) => {
        const active = pathname === href || (href !== "/" && pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-default ${
              active ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
