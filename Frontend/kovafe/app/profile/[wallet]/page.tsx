'use client';

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { creators, posts, formatCount, formatINJ, activityEvents } from "@/data/mockData";
import { FollowButton } from "@/features/user/FollowButton";
import { AddressChip } from "@/features/user/AddressChip";
import { Settings } from "lucide-react";

export default function ProfilePage() {
  const params = useParams<{ wallet: string }>();
  const wallet = params?.wallet ?? "me";
  const creator =
    wallet === "me"
      ? creators[0]
      : creators.find((c) => c.address === wallet) || creators[0];
  const isOwn = wallet === "me";
  const [tab, setTab] = useState<"posts" | "collected" | "listed" | "activity">("posts");
  const creatorPosts = posts.filter((p) => p.creator.id === creator.id);

  return (
    <div className="mx-auto max-w-[1100px] space-y-6 px-4 py-6 lg:px-6">
      <div className="relative h-40 rounded-xl bg-gradient-to-r from-primary/30 via-purple-600/20 to-primary/10">
        <div className="absolute -bottom-7 left-6">
          <img src={creator.avatar} alt="" className="h-16 w-16 rounded-full border-4 border-background object-cover" />
        </div>
      </div>

      <div className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">{creator.name}</h1>
          <AddressChip address={creator.address} />
          {creator.bio ? <p className="mt-2 max-w-md text-sm text-muted-foreground">{creator.bio}</p> : null}
          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm">
            {[
              [creator.postCount, "Posts"],
              [formatCount(creator.followers), "Followers"],
              [formatCount(creator.following), "Following"],
              [formatINJ(creator.totalVolume), "Volume"],
              [formatINJ(creator.totalEarned), "Earned"],
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
            <Link href="/settings" className="flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-surface transition-default">
              <Settings className="h-4 w-4" />
              Edit Profile
            </Link>
          ) : (
            <FollowButton creatorId={creator.id} />
          )}
        </div>
      </div>

      <div className="flex w-fit gap-1 rounded-lg bg-surface p-1">
        {(["posts", "collected", "listed", "activity"] as const).map((tabName) => (
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(creatorPosts.length > 0 ? creatorPosts : posts.slice(0, 6)).map((post) => (
            <Link key={post.id} href={`/post/${post.id}`} className="card-surface overflow-hidden group">
              <div className="aspect-square overflow-hidden">
                <img src={post.media} alt={post.title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]" />
              </div>
              <div className="p-3">
                <h3 className="truncate text-sm font-semibold text-foreground">{post.title}</h3>
                <div className="mt-1.5 flex items-center justify-between">
                  <span className="text-xs font-mono text-foreground">{formatINJ(post.price)}</span>
                  <span className="text-xs text-muted-foreground">{formatCount(post.mintCount)} ◆</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : null}

      {tab === "collected" ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {posts.slice(5, 17).map((post, index) => (
            <Link key={post.id} href={`/post/${post.id}`} className="card-surface overflow-hidden group">
              <div className="aspect-square overflow-hidden">
                <img src={post.media} alt={post.title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]" />
              </div>
              <div className="p-2.5">
                <p className="truncate text-xs font-semibold text-foreground">{post.title}</p>
                <p className="mt-0.5 text-[10px] font-mono text-muted-foreground">#{index + 1}</p>
              </div>
            </Link>
          ))}
        </div>
      ) : null}

      {tab === "listed" ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {posts.slice(0, 4).map((post) => (
            <div key={post.id} className="card-surface overflow-hidden">
              <div className="aspect-square overflow-hidden">
                <img src={post.media} alt={post.title} className="h-full w-full object-cover" />
              </div>
              <div className="p-2.5">
                <p className="truncate text-xs font-semibold text-foreground">{post.title}</p>
                <p className="mt-1 text-sm font-mono text-foreground">{formatINJ(post.price * 2.5)}</p>
                <button className="mt-2 w-full rounded-lg bg-primary py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90 transition-default">
                  Buy
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {tab === "activity" ? (
        <div className="card-surface space-y-2 p-4">
          {activityEvents.slice(0, 10).map((event) => (
            <div key={event.id} className="flex items-center justify-between border-b border-border-subtle py-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase text-primary">{event.type}</span>
                <span className="text-foreground">{event.post.title}</span>
              </div>
              <span className="text-xs font-mono text-foreground">{formatINJ(event.price)}</span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
