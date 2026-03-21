'use client';

import { usePathname } from "next/navigation";
import { Search, Bell, Wallet } from "lucide-react";
import { useStore } from "@/store/useStore";
import { truncateAddress } from "@/data/mockData";
import { useState } from "react";

const pageTitles: Record<string, string> = {
  "/": "Home",
  "/explore": "Explore",
  "/create": "Create",
  "/notifications": "Notifications",
  "/marketplace": "Marketplace",
  "/activity": "Activity",
  "/settings": "Settings",
  "/drops": "Drops",
};

export function TopBar() {
  const pathname = usePathname();
  const { isSignedIn, walletAddress, signIn } = useStore();
  const [searchOpen, setSearchOpen] = useState(false);

  const title =
    pageTitles[pathname] ||
    (pathname.startsWith("/profile") ? "Profile" :
    pathname.startsWith("/post") ? "Post" :
    pathname.startsWith("/token") ? "Token" : "");

  return (
    <header className="fixed top-0 right-0 left-0 lg:left-60 h-[60px] border-b border-border bg-background/80 backdrop-blur-md z-30 flex items-center justify-between px-4 lg:px-6">
      <h1 className="text-lg font-bold tracking-tight text-foreground hidden lg:block">
        {title}
      </h1>

      {/* Mobile logo */}
      <div className="flex items-center gap-2 lg:hidden">
        <span className="inline-block w-2.5 h-2.5 rounded-sm bg-primary" />
        <span className="text-base font-bold tracking-tight text-foreground uppercase">
          Kalieso
        </span>
      </div>

      <div className="flex items-center gap-3">
        {searchOpen ? (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              autoFocus
              onBlur={() => setSearchOpen(false)}
              placeholder="Search creators, posts..."
              className="w-48 sm:w-64 pl-9 pr-3 py-2 text-sm bg-surface border border-border rounded-full text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
            />
          </div>
        ) : (
          <button
            onClick={() => setSearchOpen(true)}
            className="p-2 rounded-full hover:bg-surface transition-default text-muted-foreground hover:text-foreground"
          >
            <Search className="w-5 h-5" />
          </button>
        )}

        <button className="p-2 rounded-full hover:bg-surface transition-default text-muted-foreground hover:text-foreground relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full" />
        </button>

        {isSignedIn && walletAddress ? (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-surface rounded-full border border-border">
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary to-purple-400" />
            <span className="text-xs font-mono text-foreground">
              {truncateAddress(walletAddress)}
            </span>
          </div>
        ) : (
          <button
            onClick={signIn}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-full text-sm font-semibold hover:opacity-90 transition-default"
          >
            <Wallet className="w-4 h-4" />
            <span className="hidden sm:inline">Sign In</span>
          </button>
        )}
      </div>
    </header>
  );
}
