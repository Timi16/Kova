'use client';

import Link from "next/link";
import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Settings } from "lucide-react";
import { AddressChip } from "@/features/user/AddressChip";
import { EmptyState } from "@/features/common/EmptyState";
import { FollowButton } from "@/features/user/FollowButton";
import { PostCard } from "@/features/post/PostCard";
import { useAuth } from "@/hooks/useAuth";
import { useProfile, useProfileCollected, useProfilePosts } from "@/hooks/data/useProfile";
import { useWalletActivity } from "@/hooks/data/useActivity";
import { formatINJ } from "@/lib/format";

export default function ProfilePage() {
  const params = useParams<{ wallet: string }>();
  const { address } = useAuth();
  const wallet = params?.wallet === "me" ? address : params?.wallet;
  const profile = useProfile(wallet);
  const posts = useProfilePosts(wallet);
  const collected = useProfileCollected(wallet);
  const activity = useWalletActivity(wallet);
  const [tab, setTab] = useState<"posts" | "collected" | "activity">("posts");

  const isOwn = useMemo(
    () => Boolean(address && wallet && address.toLowerCase() === wallet.toLowerCase()),
    [address, wallet],
  );

  if (profile.isLoading) {
    return <div className="px-4 py-10 text-sm text-muted-foreground">Loading profile...</div>;
  }

  if (!profile.data || !wallet) {
    return (
      <EmptyState
        icon={Settings}
        title="Profile not found"
        subtitle="This wallet has not created a Kalieso profile yet."
        ctaLabel="Create Profile"
        onCta={() => (window.location.href = "/settings")}
      />
    );
  }

  const postItems = posts.data?.pages.flatMap((page) => page.posts) ?? [];
  const collectedItems = collected.data?.pages.flatMap((page) => page.mints) ?? [];
  const activityItems = activity.data?.activity ?? [];

  return (
    <div className="mx-auto max-w-[1100px] space-y-6 px-4 py-6 lg:px-6">
      <div className="relative h-40 rounded-xl bg-gradient-to-r from-primary/30 via-purple-600/20 to-primary/10">
        <div className="absolute -bottom-7 left-6">
          <div className="h-16 w-16 rounded-full border-4 border-background bg-gradient-to-br from-primary to-purple-400" />
        </div>
      </div>

      <div className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">{profile.data.username}</h1>
          <AddressChip address={profile.data.wallet} />
          {profile.data.bio ? <p className="mt-2 max-w-md text-sm text-muted-foreground">{profile.data.bio}</p> : null}
          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm">
            {[
              [profile.data.post_count, "Posts"],
              [profile.data.follower_count, "Followers"],
              [profile.data.following_count, "Following"],
              [formatINJ(profile.data.total_earned), "Earned"],
            ].map(([value, label]) => (
              <div key={String(label)}>
                <span className="font-mono font-semibold text-foreground">{value}</span>
                <span className="ml-1 text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          {isOwn ? (
            <Link href="/settings" className="flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground">
              <Settings className="h-4 w-4" />
              Edit Profile
            </Link>
          ) : (
            <FollowButton targetAddress={profile.data.wallet} />
          )}
        </div>
      </div>

      <div className="flex w-fit gap-1 rounded-lg bg-surface p-1">
        {(["posts", "collected", "activity"] as const).map((tabName) => (
          <button
            key={tabName}
            onClick={() => setTab(tabName)}
            className={`rounded-md px-4 py-2 text-sm font-medium capitalize transition-default ${
              tab === tabName ? "bg-surface-elevated text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tabName}
          </button>
        ))}
      </div>

      {tab === "posts" ? (
        postItems.length ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {postItems.map((post) => (
              <PostCard key={post.post_id} post={post} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Settings}
            title="No posts yet"
            subtitle="This profile has not published any drops."
            ctaLabel={isOwn ? "Create Post" : undefined}
            onCta={isOwn ? () => (window.location.href = "/create") : undefined}
          />
        )
      ) : null}

      {tab === "collected" ? (
        collectedItems.length ? (
          <div className="card-surface space-y-3 p-4">
            {collectedItems.map((mint) => (
              <div key={`${mint.collection}-${mint.token_id}-${mint.created_at}`} className="flex items-center justify-between border-b border-border-subtle py-2 text-sm">
                <span className="font-mono text-foreground">{mint.collection}</span>
                <span className="text-muted-foreground">
                  Token #{mint.token_id} · {mint.quantity}x
                </span>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Settings}
            title="No collected tokens"
            subtitle="This wallet has not minted anything yet."
          />
        )
      ) : null}

      {tab === "activity" ? (
        activityItems.length ? (
          <div className="card-surface space-y-2 p-4">
            {activityItems.map((event) => (
              <div key={event.id} className="flex items-center justify-between border-b border-border-subtle py-2 text-sm">
                <span className="font-medium text-foreground">{event.event_type}</span>
                <span className="font-mono text-muted-foreground">{event.amount ?? event.tx_hash ?? "-"}</span>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Settings}
            title="No activity yet"
            subtitle="This wallet has no indexed activity."
          />
        )
      ) : null}
    </div>
  );
}
