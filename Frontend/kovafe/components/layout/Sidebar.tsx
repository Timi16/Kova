'use client';

import { Link, useLocation } from "react-router-dom";
import {
  Home, Compass, PlusSquare, Bell, User,
  TrendingUp, Zap, Settings, LogOut, Wallet,
} from "lucide-react";
import { useStore } from "@/store/useStore";
import { truncateAddress, formatINJ } from "@/data/mockData";

const navItems = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/explore", icon: Compass, label: "Explore" },
  { to: "/create", icon: PlusSquare, label: "Create", accent: true },
  { to: "/notifications", icon: Bell, label: "Notifications" },
  { to: "/profile/me", icon: User, label: "Profile" },
  { to: "/marketplace", icon: TrendingUp, label: "Marketplace" },
  { to: "/activity", icon: Zap, label: "Activity" },
];

export function Sidebar() {
  const location = useLocation();
  const { isSignedIn, walletAddress, injBalance, signIn, signOut } = useStore();

  return (
    <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-60 flex-col border-r border-border bg-background z-40">
      <Link to="/" className="flex items-center gap-2 px-6 py-6">
        <span className="inline-block w-3 h-3 rounded-sm bg-primary" />
        <span className="text-lg font-bold tracking-tight text-foreground uppercase">
          Kalieso
        </span>
      </Link>

      <nav className="flex-1 px-3 space-y-1">
        {navItems.map(({ to, icon: Icon, label, accent }) => {
          const active = location.pathname === to || (to !== "/" && location.pathname.startsWith(to));
          return (
            <Link
              key={to}
              to={to}
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
        {isSignedIn && walletAddress ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-purple-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-mono text-foreground truncate">
                  {truncateAddress(walletAddress)}
                </p>
                <p className="text-xs font-mono text-muted-foreground">
                  {formatINJ(injBalance)}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link
                to="/settings"
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs text-muted-foreground hover:text-foreground rounded-lg hover:bg-surface transition-default"
              >
                <Settings className="w-3.5 h-3.5" />
                Settings
              </Link>
              <button
                onClick={signOut}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs text-muted-foreground hover:text-destructive rounded-lg hover:bg-surface transition-default"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={signIn}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-primary text-primary-foreground rounded-full text-sm font-semibold hover:opacity-90 transition-default"
          >
            <Wallet className="w-4 h-4" />
            Sign In
          </button>
        )}
      </div>
    </aside>
  );
}
