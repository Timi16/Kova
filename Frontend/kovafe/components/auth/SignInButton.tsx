"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, Loader2, LogOut, Settings, User } from "lucide-react";
import { useBalance } from "wagmi";
import { useAuth } from "@/hooks/useAuth";
import { injectiveTestnet } from "@/lib/chains";
import { formatINJ, truncateAddress } from "@/lib/format";

function avatarGradient(address?: string) {
  if (!address) return "linear-gradient(135deg, #836EF9, #B38BFF)";
  const hueA = Number.parseInt(address.slice(2, 6), 16) % 360;
  const hueB = Number.parseInt(address.slice(6, 10), 16) % 360;
  return `linear-gradient(135deg, hsl(${hueA} 80% 55%), hsl(${hueB} 85% 62%))`;
}

export function SignInButton() {
  const { login, logout, address, isAuthenticated, isLoading } = useAuth();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { data: balance } = useBalance({
    address: address as `0x${string}` | undefined,
    chainId: injectiveTestnet.id,
    query: {
      enabled: Boolean(address),
    },
  });

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    window.addEventListener("mousedown", handleClickOutside);
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <button
        onClick={login}
        className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-default hover:opacity-90"
      >
        Sign In
      </button>
    );
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setOpen((current) => !current)}
        className="flex min-h-11 items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 transition-default hover:border-primary/50"
      >
          <span
            className="h-8 w-8 rounded-full"
            style={{ backgroundImage: avatarGradient(address) }}
          />
          <span className="hidden text-left sm:block">
            <span className="block text-xs font-mono text-foreground">
              {truncateAddress(address)}
            </span>
            <span className="block text-[11px] text-muted-foreground">
              {balance?.value ? formatINJ(balance.value) : "0.0000 INJ"}
            </span>
          </span>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </button>
      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-56 rounded-2xl border border-border bg-surface p-2 shadow-xl">
          <Link
            href={`/profile/${address}`}
            onClick={() => setOpen(false)}
            className="flex min-h-11 items-center rounded-xl px-3 text-sm text-foreground hover:bg-surface-elevated"
          >
            <User className="mr-2 h-4 w-4" />
            View Profile
          </Link>
          <Link
            href="/settings"
            onClick={() => setOpen(false)}
            className="flex min-h-11 items-center rounded-xl px-3 text-sm text-foreground hover:bg-surface-elevated"
          >
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Link>
          <div className="my-1 h-px bg-border" />
          <button
            onClick={() => {
              setOpen(false);
              logout();
            }}
            className="flex min-h-11 w-full items-center rounded-xl px-3 text-left text-sm text-foreground hover:bg-surface-elevated"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Disconnect
          </button>
        </div>
      ) : null}
    </div>
  );
}
