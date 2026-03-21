"use client";
import { posts, creators, activityEvents, formatCount, truncateAddress, formatINJ } from "@/data/mockData";
import { PostCard } from "@/components/PostCard";
import { FollowButton } from "@/components/FollowButton";
import { ActivityItem } from "@/components/ActivityFeed";
import { useStore } from "@/store/useStore";
import { Link } from "react-router-dom";
import { TrendingUp, Zap } from "lucide-react";
import { use } from "react";

function TrendingSidebar() {
  const trending = [...posts].sort((a, b) => b.mintCount - a.mintCount).slice(0, 5);
  return (
    <div className="card-surface p-4">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-4 h-4 text-warning" />
        <h3 className="text-sm font-bold text-foreground">Trending Now</h3>
      </div>
      <div className="space-y-3">
        {trending.map((post, i) => (
          <Link key={post.id} to={`/post/${post.id}`} className="flex items-center gap-3 group">
            <span className="text-xs font-mono text-muted-foreground w-4">{i + 1}</span>
            <img src={post.media} alt="" className="w-10 h-10 rounded object-cover" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate group-hover:underline">{post.title}</p>
              <p className="text-xs text-muted-foreground">{formatCount(post.mintCount)} mints · {formatINJ(post.price)}</p>
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
      <h3 className="text-sm font-bold text-foreground mb-4">Who To Follow</h3>
      <div className="space-y-3">
        {suggestions.map((c) => (
          <div key={c.id} className="flex items-center gap-3">
            <Link to={`/profile/${c.address}`}>
              <img src={c.avatar} alt="" className="w-9 h-9 rounded-full object-cover" />
            </Link>
            <div className="flex-1 min-w-0">
              <Link to={`/profile/${c.address}`} className="text-sm font-medium text-foreground hover:underline block truncate">{c.name}</Link>
              <p className="text-xs font-mono text-muted-foreground">{truncateAddress(c.address)}</p>
            </div>
            <FollowButton creatorId={c.id} small />
          </div>
        ))}
      </div>
    </div>
  );
}

function LiveActivity() {
  return (
    <div className="card-surface p-4">
      <div className="flex items-center gap-2 mb-4">
        <Zap className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-bold text-foreground">Live Activity</h3>
        <span className="w-2 h-2 rounded-full bg-success animate-pulse-dot" />
      </div>
      <div className="space-y-0.5">
        {activityEvents.slice(0, 8).map((e) => (
          <ActivityItem key={e.id} event={e} />
        ))}
      </div>
    </div>
  );
}

export default function HomePage() {
  const { feedTab, setFeedTab } = useStore();

  return (
    <div className="max-w-[1200px] mx-auto px-4 lg:px-6 py-6">
      <div className="flex gap-6">
        {/* Main Feed */}
        <div className="flex-1 max-w-[640px]">
          {/* Tab Switcher */}
          <div className="flex gap-1 mb-6 p-1 bg-surface rounded-lg w-fit">
            {(["foryou", "following"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFeedTab(tab)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-default ${
                  feedTab === tab ? "bg-surface-elevated text-foreground" : "text-muted-foreground hover:text-foreground"
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

        {/* Right Sidebar */}
        <div className="hidden xl:block w-80 flex-shrink-0">
          <div className="sticky top-[76px] space-y-4">
            <TrendingSidebar />
            <WhoToFollow />
            <LiveActivity />
          </div>
        </div>
      </div>
    </div>
  );
}
