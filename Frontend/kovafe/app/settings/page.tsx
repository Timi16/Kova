'use client';

import { useEffect, useState } from "react";
import { LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/data/useProfile";
import { useSocial } from "@/hooks/contracts/useSocial";
import { truncateAddress } from "@/lib/format";
import { RequireAuth } from "@/components/auth/RequireAuth";

export default function SettingsPage() {
  const { address, logout } = useAuth();
  const profile = useProfile(address);
  const social = useSocial();
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [website, setWebsite] = useState("");

  useEffect(() => {
    if (profile.data) {
      setUsername(profile.data.username);
      setBio(profile.data.bio ?? "");
      setWebsite(profile.data.website_url ?? "");
    }
  }, [profile.data]);

  return (
    <RequireAuth requireProfile>
      <div className="mx-auto max-w-[600px] space-y-8 px-4 py-6 lg:px-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Settings</h1>

        <section className="card-surface space-y-4 p-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">Profile</h2>
          <div>
            <label className="mb-1.5 block text-xs text-muted-foreground">Username</label>
            <input value={username} onChange={(event) => setUsername(event.target.value)} className="w-full rounded-lg border border-border bg-surface-elevated px-4 py-3 text-sm text-foreground outline-none" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs text-muted-foreground">Bio</label>
            <textarea value={bio} onChange={(event) => setBio(event.target.value)} rows={3} className="w-full resize-none rounded-lg border border-border bg-surface-elevated px-4 py-3 text-sm text-foreground outline-none" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs text-muted-foreground">Website</label>
            <input value={website} onChange={(event) => setWebsite(event.target.value)} className="w-full rounded-lg border border-border bg-surface-elevated px-4 py-3 text-sm text-foreground outline-none" />
          </div>
          <button onClick={() => void social.updateProfile(username, bio, website)} className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">
            Save Changes
          </button>
        </section>

        <section className="card-surface space-y-4 p-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">Wallet</h2>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-purple-400" />
              <span className="font-mono text-sm text-foreground">{truncateAddress(address)}</span>
            </div>
            <button onClick={logout} className="flex items-center gap-2 rounded-full border border-destructive px-4 py-2 text-sm font-medium text-destructive">
              <LogOut className="h-4 w-4" />
              Disconnect
            </button>
          </div>
        </section>

        <section className="card-surface space-y-4 p-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">Network</h2>
          <div className="flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-success" />
            <span className="text-sm text-foreground">Injective inEVM</span>
            <span className="text-xs font-mono text-muted-foreground">Chain ID: 1439</span>
          </div>
        </section>
      </div>
    </RequireAuth>
  );
}
