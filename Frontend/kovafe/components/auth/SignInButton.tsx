"use client";

import Link from "next/link";
import { ChevronDown, Loader2, LogOut, Settings, User } from "lucide-react";
import { useBalance } from "wagmi";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  const { data: balance } = useBalance({
    address: address as `0x${string}` | undefined,
    chainId: injectiveTestnet.id,
    query: {
      enabled: Boolean(address),
    },
  });

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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex min-h-11 items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 transition-default hover:border-primary/50">
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
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem asChild>
          <Link href={`/profile/${address}`} className="cursor-pointer">
            <User className="mr-2 h-4 w-4" />
            View Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings" className="cursor-pointer">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout} className="cursor-pointer">
          <LogOut className="mr-2 h-4 w-4" />
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
