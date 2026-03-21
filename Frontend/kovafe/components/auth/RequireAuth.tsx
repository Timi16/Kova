"use client";

import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/data/useProfile";
import { useSocial } from "@/hooks/contracts/useSocial";

export function RequireAuth({
  children,
  requireProfile = false,
}: {
  children: React.ReactNode;
  requireProfile?: boolean;
}) {
  const { isAuthenticated, isLoading, login, address } = useAuth();
  const profileQuery = useProfile(address);
  const social = useSocial();
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const missingProfile = useMemo(() => {
    if (!requireProfile || !isAuthenticated || !address) return false;
    if (profileQuery.isLoading) return false;
    return Boolean(profileQuery.error);
  }, [address, isAuthenticated, profileQuery.error, profileQuery.isLoading, requireProfile]);

  if (isLoading || (requireProfile && isAuthenticated && profileQuery.isLoading)) {
    return (
      <div className="flex min-h-[240px] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 px-4 backdrop-blur-sm">
        <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-6 text-center">
          <h2 className="text-xl font-semibold text-foreground">Sign in to continue</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Connect your wallet or email to use this action.
          </p>
          <button
            onClick={login}
            className="mt-6 min-h-11 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  if (missingProfile) {
    return (
      <>
        <div className="pointer-events-none opacity-30">{children}</div>
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6">
            <h2 className="text-xl font-semibold text-foreground">Create Profile</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              You need a Kalieso profile before using this action.
            </p>
            <div className="mt-6 space-y-3">
              <input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="Username"
                className="min-h-11 w-full rounded-xl border border-border bg-surface-elevated px-4 text-sm text-foreground outline-none"
              />
              <textarea
                value={bio}
                onChange={(event) => setBio(event.target.value)}
                placeholder="Bio"
                rows={3}
                className="w-full rounded-xl border border-border bg-surface-elevated px-4 py-3 text-sm text-foreground outline-none"
              />
            </div>
            <button
              onClick={async () => {
                if (!username.trim()) {
                  toast.error("Username is required");
                  return;
                }

                setIsSubmitting(true);

                try {
                  await social.createProfile(username.trim(), bio.trim(), "", "");
                  await profileQuery.refetch();
                } catch {
                  // The contract hook already surfaces the error via toast/state.
                } finally {
                  setIsSubmitting(false);
                }
              }}
              disabled={isSubmitting || social.isLoading}
              className="mt-6 min-h-11 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
            >
              {isSubmitting || social.isLoading ? "Creating..." : "Create Profile"}
            </button>
          </div>
        </div>
      </>
    );
  }

  return <>{children}</>;
}
