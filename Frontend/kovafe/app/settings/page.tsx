'use client';

import { useState } from "react";
import { useStore } from "@/store/useStore";
import { truncateAddress } from "@/data/mockData";
import { LogOut, Wallet } from "lucide-react";

export default function SettingsPage() {
  const { isSignedIn, walletAddress, signIn, signOut } = useStore();
  const [name, setName] = useState("Luna Voss");
  const [bio, setBio] = useState("Digital sculptor exploring void and form");

  return (
    <div className="max-w-[600px] mx-auto px-4 lg:px-6 py-6 space-y-8">
      <h1 className="text-2xl font-bold text-foreground tracking-tight">Settings</h1>

      {/* Profile */}
      <section className="card-surface p-6 space-y-4">
        <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">Profile</h2>
        <div>
          <label className="text-xs text-muted-foreground block mb-1.5">Display Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-3 bg-surface-elevated border border-border rounded-lg text-foreground text-sm focus:outline-none focus:border-primary" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground block mb-1.5">Bio</label>
          <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} className="w-full px-4 py-3 bg-surface-elevated border border-border rounded-lg text-foreground text-sm focus:outline-none focus:border-primary resize-none" />
        </div>
        <button className="px-5 py-2.5 bg-primary text-primary-foreground rounded-full text-sm font-semibold hover:opacity-90 transition-default">
          Save Changes
        </button>
      </section>

      {/* Notifications */}
      <section className="card-surface p-6 space-y-4">
        <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">Notifications</h2>
        {["New mints on your posts", "New followers", "Offers received", "Comments", "Trending alerts"].map((label) => (
          <div key={label} className="flex items-center justify-between py-2">
            <span className="text-sm text-foreground">{label}</span>
            <input type="checkbox" defaultChecked className="accent-primary w-4 h-4" />
          </div>
        ))}
      </section>

      {/* Wallet */}
      <section className="card-surface p-6 space-y-4">
        <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">Wallet</h2>
        {isSignedIn && walletAddress ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple-400" />
              <span className="font-mono text-sm text-foreground">{truncateAddress(walletAddress)}</span>
            </div>
            <button onClick={signOut} className="flex items-center gap-2 px-4 py-2 border border-destructive text-destructive rounded-full text-sm font-medium hover:bg-destructive/10 transition-default">
              <LogOut className="w-4 h-4" /> Disconnect
            </button>
          </div>
        ) : (
          <button onClick={signIn} className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-full text-sm font-semibold hover:opacity-90 transition-default">
            <Wallet className="w-4 h-4" /> Sign In
          </button>
        )}
      </section>

      {/* Network */}
      <section className="card-surface p-6 space-y-4">
        <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">Network</h2>
        <div className="flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-success" />
          <span className="text-sm text-foreground">Injective inEVM</span>
          <span className="text-xs font-mono text-muted-foreground">Chain ID: 2525</span>
        </div>
      </section>
    </div>
  );
}
