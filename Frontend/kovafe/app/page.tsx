"use client";

import Link from "next/link";
import { TrendingUp, Zap } from "lucide-react";
import { useStore } from "@/store/useStore";
import { PostCard } from "@/features/post/PostCard";
import { SkeletonCard } from "@/features/post/SkeletonCard";
import { EmptyState } from "@/features/common/EmptyState";
import { FollowButton } from "@/features/user/FollowButton";
import { useAuth } from "@/hooks/useAuth";
import { useForYouFeed, useFollowingFeed } from "@/hooks/data/useFeed";

function TrendingSidebar() {
  const feed = useForYouFeed(5);
  const posts = feed.data?.pages.flatMap((page) => page.posts) ?? [];

  return (
    <div className="card-surface p-4">
      <div className="mb-4 flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-warning" />
        <h3 className="text-sm font-bold text-foreground">Trending Now</h3>
      </div>
      <div className="space-y-3">
        {posts.slice(0, 5).map((post, index) => (
          <Link key={post.post_id} href={`/post/${post.post_id}`} className="group flex items-center gap-3">
            <span className="w-4 text-xs font-mono text-muted-foreground">{index + 1}</span>
            <div className="h-10 w-10 rounded bg-surface-elevated" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground group-hover:underline">
                {post.title}
              </p>
              <p className="text-xs text-muted-foreground">
                {post.collection?.total_minted ?? 0} mints
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function WhoToFollow() {
  const feed = useForYouFeed(8);
  const profiles = Array.from(
    new Map(
      (feed.data?.pages.flatMap((page) => page.posts) ?? [])
        .filter((post) => post.profile)
        .map((post) => [post.creator, post]),
    ).values(),
  ).slice(0, 4);

  return (
    <div className="card-surface p-4">
      <h3 className="mb-4 text-sm font-bold text-foreground">Who To Follow</h3>
      <div className="space-y-3">
        {profiles.map((item) => (
          <div key={item.creator} className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-purple-400" />
            <div className="min-w-0 flex-1">
              <Link href={`/profile/${item.creator}`} className="block truncate text-sm font-medium text-foreground hover:underline">
                {item.profile?.username ?? item.creator}
              </Link>
              <p className="text-xs font-mono text-muted-foreground">{item.creator}</p>
            </div>
            <FollowButton targetAddress={item.creator} small />
          </div>
        ))}
      </div>
    </div>
  );
}

function LiveActivity() {
  return (
    <div className="card-surface p-4">
      <div className="mb-4 flex items-center gap-2">
        <Zap className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-bold text-foreground">Live Activity</h3>
        <span className="h-2 w-2 rounded-full bg-success animate-pulse-dot" />
      </div>
      <p className="text-sm text-muted-foreground">
        Realtime activity is connected through Supabase subscriptions.
      </p>
    </div>
  );
}

export default function HomePage() {
  const { feedTab, setFeedTab } = useStore();
  const { address } = useAuth();
  const forYou = useForYouFeed();
  const following = useFollowingFeed(address);

  const active = feedTab === "foryou" ? forYou : following;
  const posts = active.data?.pages.flatMap((page) => page.posts) ?? [];

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-6 lg:px-6">
      <div className="flex gap-6">
        <div className="max-w-[640px] flex-1">
          <div className="mb-6 flex w-fit gap-1 rounded-lg bg-surface p-1">
            {(["foryou", "following"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFeedTab(tab)}
                className={`rounded-md px-4 py-2 text-sm font-medium transition-default ${
                  feedTab === tab ? "bg-surface-elevated text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab === "foryou" ? "For You" : "Following"}
              </button>
            ))}
          </div>

          {active.isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <SkeletonCard key={index} />
              ))}
            </div>
          ) : posts.length ? (
            <div className="space-y-4">
              {posts.map((post) => (
                <PostCard key={post.post_id} post={post} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Zap}
              title={feedTab === "following" ? "No following activity yet" : "No posts yet"}
              subtitle={
                feedTab === "following"
                  ? "Follow creators to build your personal feed."
                  : "The feed is empty right now. Create the first drop."
              }
              ctaLabel="Create Post"
              onCta={() => (window.location.href = "/create")}
            />
          )}
        </div>

        <div className="hidden w-80 flex-shrink-0 xl:block">
          <div className="sticky top-6 space-y-4">
            <TrendingSidebar />
            <WhoToFollow />
            <LiveActivity />
          </div>
        </div>
      </div>
    </div>
  );
}
