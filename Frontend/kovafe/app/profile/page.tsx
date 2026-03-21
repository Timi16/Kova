import { useParams, Link } from "react-router-dom";
import { useState } from "react";
import { creators, posts, formatCount, formatINJ, truncateAddress, activityEvents } from "@/data/mockData";
import { FollowButton } from "@/components/FollowButton";
import { AddressChip } from "@/components/AddressChip";
import { Settings } from "lucide-react";

export default function ProfilePage() {
  const { wallet } = useParams();
  const creator = wallet === "me"
    ? creators[0]
    : creators.find((c) => c.address === wallet) || creators[0];
  const isOwn = wallet === "me";
  const [tab, setTab] = useState<"posts" | "collected" | "listed" | "activity">("posts");
  const creatorPosts = posts.filter((p) => p.creator.id === creator.id);

  return (
    <div className="max-w-[1100px] mx-auto px-4 lg:px-6 py-6 space-y-6">
      {/* Banner */}
      <div className="h-40 rounded-xl bg-gradient-to-r from-primary/30 via-purple-600/20 to-primary/10 relative">
        <div className="absolute -bottom-7 left-6">
          <img src={creator.avatar} alt="" className="w-16 h-16 rounded-full border-4 border-background object-cover" />
        </div>
      </div>

      {/* Header */}
      <div className="pt-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">{creator.name}</h1>
          <AddressChip address={creator.address} />
          {creator.bio && <p className="text-sm text-muted-foreground mt-2 max-w-md">{creator.bio}</p>}
          <div className="flex gap-6 mt-3 text-sm">
            {[
              [creator.postCount, "Posts"],
              [formatCount(creator.followers), "Followers"],
              [formatCount(creator.following), "Following"],
              [formatINJ(creator.totalVolume), "Volume"],
              [formatINJ(creator.totalEarned), "Earned"],
            ].map(([val, label]) => (
              <div key={String(label)}>
                <span className="font-semibold text-foreground font-mono">{val}</span>
                <span className="text-muted-foreground ml-1">{label}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          {isOwn ? (
            <Link to="/settings" className="flex items-center gap-2 px-4 py-2 border border-border rounded-full text-sm font-medium text-foreground hover:bg-surface transition-default">
              <Settings className="w-4 h-4" />
              Edit Profile
            </Link>
          ) : (
            <FollowButton creatorId={creator.id} />
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-surface rounded-lg w-fit">
        {(["posts", "collected", "listed", "activity"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-md text-sm font-medium capitalize transition-default ${
              tab === t ? "bg-surface-elevated text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "posts" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(creatorPosts.length > 0 ? creatorPosts : posts.slice(0, 6)).map((post) => (
            <Link key={post.id} to={`/post/${post.id}`} className="card-surface overflow-hidden group">
              <div className="aspect-square overflow-hidden">
                <img src={post.media} alt={post.title} className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300" />
              </div>
              <div className="p-3">
                <h3 className="text-sm font-semibold text-foreground truncate">{post.title}</h3>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-xs font-mono text-foreground">{formatINJ(post.price)}</span>
                  <span className="text-xs text-muted-foreground">{formatCount(post.mintCount)} ◆</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {tab === "collected" && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {posts.slice(5, 17).map((post) => (
            <Link key={post.id} to={`/post/${post.id}`} className="card-surface overflow-hidden group">
              <div className="aspect-square overflow-hidden">
                <img src={post.media} alt={post.title} className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300" />
              </div>
              <div className="p-2.5">
                <p className="text-xs font-semibold text-foreground truncate">{post.title}</p>
                <p className="text-[10px] font-mono text-muted-foreground mt-0.5">#{Math.floor(Math.random() * 100)}</p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {tab === "listed" && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {posts.slice(0, 4).map((post) => (
            <div key={post.id} className="card-surface overflow-hidden">
              <div className="aspect-square overflow-hidden">
                <img src={post.media} alt={post.title} className="w-full h-full object-cover" />
              </div>
              <div className="p-2.5">
                <p className="text-xs font-semibold text-foreground truncate">{post.title}</p>
                <p className="text-sm font-mono text-foreground mt-1">{formatINJ(post.price * 2.5)}</p>
                <button className="w-full mt-2 py-1.5 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:opacity-90 transition-default">Buy</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "activity" && (
        <div className="card-surface p-4 space-y-2">
          {activityEvents.slice(0, 10).map((e) => (
            <div key={e.id} className="flex items-center justify-between py-2 border-b border-border-subtle text-sm">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-primary uppercase">{e.type}</span>
                <span className="text-foreground">{e.post.title}</span>
              </div>
              <span className="font-mono text-xs text-foreground">{formatINJ(e.price)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
