"use client";

import Link from "next/link";
import { TrendingUp, Zap } from "lucide-react";
import {
  activityEvents,
  creators,
  formatCount,
  formatINJ,
  posts,
  truncateAddress,
} from "@/data/mockData";
import { ActivityItem } from "@/features/activity/ActivityFeed";
import { PostCard } from "@/features/post/PostCard";
import { FollowButton } from "@/features/user/FollowButton";
import { useStore } from "@/store/useStore";

function TrendingSidebar() {
  const trending = [...posts].sort((a, b) => b.mintCount - a.mintCount).slice(0, 5);

  return (
    <div className="card-surface p-4">
      <div className="mb-4 flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-warning" />
        <h3 className="text-sm font-bold text-foreground">Trending Now</h3>
      </div>
      <div className="space-y-3">
        {trending.map((post, index) => (
          <Link
            key={post.id}
            href={`/post/${post.id}`}
            className="group flex items-center gap-3"
          >
            <span className="w-4 text-xs font-mono text-muted-foreground">{index + 1}</span>
            <img src={post.media} alt="" className="h-10 w-10 rounded object-cover" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground group-hover:underline">
                {post.title}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatCount(post.mintCount)} mints · {formatINJ(post.price)}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function WhoToFollow() {
  const suggestions = creators.slice(5, 9);

  return (
    <div className="card-surface p-4">
      <h3 className="mb-4 text-sm font-bold text-foreground">Who To Follow</h3>
      <div className="space-y-3">
        {suggestions.map((creator) => (
          <div key={creator.id} className="flex items-center gap-3">
            <Link href={`/profile/${creator.address}`}>
              <img src={creator.avatar} alt="" className="h-9 w-9 rounded-full object-cover" />
            </Link>
            <div className="min-w-0 flex-1">
              <Link
                href={`/profile/${creator.address}`}
                className="block truncate text-sm font-medium text-foreground hover:underline"
              >
                {creator.name}
              </Link>
              <p className="text-xs font-mono text-muted-foreground">
                {truncateAddress(creator.address)}
              </p>
            </div>
            <FollowButton creatorId={creator.id} small />
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
      <div className="space-y-0.5">
        {activityEvents.slice(0, 8).map((event) => (
          <ActivityItem key={event.id} event={event} />
        ))}
      </div>
    </div>
  );
}

export default function HomePage() {
  const { feedTab, setFeedTab } = useStore();

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
                  feedTab === tab
                    ? "bg-surface-elevated text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab === "foryou" ? "For You" : "Following"}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {posts.slice(0, 15).map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
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
