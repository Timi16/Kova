'use client';

import Link from "next/link";
import { useParams } from "next/navigation";
import { Heart, MessageCircle, Share2, ArrowUpRight, Minus, Plus } from "lucide-react";
import { posts, formatINJ, formatCount, truncateAddress, creators, activityEvents } from "@/data/mockData";
import { AddressChip } from "@/features/user/AddressChip";
import { FollowButton } from "@/features/user/FollowButton";
import { CountdownTimer } from "@/features/common/CountdownTimer";
import { useStore } from "@/store/useStore";
import { useState } from "react";

export default function PostDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  const post = posts.find((p) => p.id === id) || posts[0];
  const { isSignedIn, signIn, likedPosts, toggleLike } = useStore();
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<"collectors" | "activity" | "comments" | "details">("collectors");
  const liked = likedPosts.has(post.id);

  const total = post.price * quantity;
  const collectors = creators.slice(0, 12);
  const relatedEvents = activityEvents.filter((e) => e.post.id === post.id).slice(0, 10);

  return (
    <div className="max-w-[1100px] mx-auto px-4 lg:px-6 py-6">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Media */}
        <div className="lg:w-[55%]">
          <div className="aspect-square rounded-xl overflow-hidden bg-surface">
            <img src={post.media} alt={post.title} className="w-full h-full object-cover" />
          </div>
          <div className="flex items-center gap-4 mt-4">
            <button onClick={() => { if (!isSignedIn) { signIn(); return; } toggleLike(post.id); }} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-default">
              <Heart className={`w-5 h-5 ${liked ? "fill-destructive text-destructive" : ""}`} />
              {formatCount(post.likes + (liked ? 1 : 0))}
            </button>
            <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-default">
              <MessageCircle className="w-5 h-5" />
              {formatCount(post.comments)}
            </button>
            <button className="text-muted-foreground hover:text-foreground transition-default">
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Info */}
        <div className="lg:w-[45%]">
          <div className="lg:sticky lg:top-[76px] space-y-6">
            {/* Creator */}
            <div className="flex items-center justify-between">
              <Link href={`/profile/${post.creator.address}`} className="flex items-center gap-3">
                <img src={post.creator.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                <div>
                  <p className="text-sm font-semibold text-foreground">{post.creator.name}</p>
                  <AddressChip address={post.creator.address} />
                </div>
              </Link>
              <FollowButton creatorId={post.creator.id} />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">{post.title}</h1>
              {post.description && <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{post.description}</p>}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              {[
                ["PRICE", post.price === 0 ? "FREE" : formatINJ(post.price)],
                ["MINTED", formatCount(post.mintCount)],
                ["OWNERS", formatCount(post.ownerCount)],
              ].map(([label, val]) => (
                <div key={label} className="card-surface p-3 text-center">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
                  <p className="text-sm font-mono font-semibold text-foreground mt-1">{val}</p>
                </div>
              ))}
            </div>

            {/* Countdown */}
            {post.endsAt && post.status === "live" && (
              <div className="card-surface p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground uppercase">Ends in</span>
                  <CountdownTimer endsAt={post.endsAt} />
                </div>
              </div>
            )}

            {/* Mint */}
            {post.status === "live" ? (
              <div className="card-surface p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Quantity</span>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-8 h-8 rounded-lg bg-surface-elevated flex items-center justify-center text-foreground hover:bg-border transition-default">
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="text-sm font-mono font-semibold text-foreground w-8 text-center">{quantity}</span>
                    <button onClick={() => setQuantity(quantity + 1)} className="w-8 h-8 rounded-lg bg-surface-elevated flex items-center justify-center text-foreground hover:bg-border transition-default">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total</span>
                  <span className="font-mono font-semibold text-foreground">{post.price === 0 ? "FREE + gas" : formatINJ(total)}</span>
                </div>
                <button
                  onClick={() => { if (!isSignedIn) signIn(); }}
                  className="w-full py-3 bg-primary text-primary-foreground rounded-full font-bold hover:opacity-90 transition-default flex items-center justify-center gap-2"
                >
                  MINT NOW <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="card-surface p-4 text-center">
                <span className="text-muted-foreground font-semibold">{post.status === "sold_out" ? "SOLD OUT" : "ENDED"}</span>
              </div>
            )}

            {/* Tabs */}
            <div className="flex gap-1 p-1 bg-surface rounded-lg">
              {(["collectors", "activity", "comments", "details"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 px-3 py-2 rounded-md text-xs font-medium capitalize transition-default ${
                    activeTab === tab ? "bg-surface-elevated text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {activeTab === "collectors" && (
              <div className="grid grid-cols-6 gap-2">
                {collectors.map((c) => (
                  <Link key={c.id} href={`/profile/${c.address}`} className="flex flex-col items-center gap-1">
                    <img src={c.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                    <span className="text-[10px] text-muted-foreground font-mono">{truncateAddress(c.address).slice(0, 6)}</span>
                  </Link>
                ))}
              </div>
            )}

            {activeTab === "activity" && (
              <div className="space-y-2 text-sm">
                {(relatedEvents.length > 0 ? relatedEvents : activityEvents.slice(0, 5)).map((e) => (
                  <div key={e.id} className="flex items-center justify-between py-2 border-b border-border-subtle">
                    <div>
                      <span className="font-mono text-xs text-muted-foreground">{truncateAddress(e.actor.address)}</span>
                      <span className="text-muted-foreground"> {e.type}ed</span>
                    </div>
                    <span className="font-mono text-xs text-foreground">{formatINJ(e.price)}</span>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "comments" && (
              <div className="space-y-4">
                <input placeholder="Add a comment..." className="w-full px-4 py-3 bg-surface border border-border rounded-lg text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:border-primary" />
                <div className="space-y-3">
                  {creators.slice(0, 4).map((c, i) => (
                    <div key={c.id} className="flex gap-3">
                      <img src={c.avatar} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                      <div>
                        <p className="text-xs font-mono text-muted-foreground">{truncateAddress(c.address)}</p>
                        <p className="text-sm text-foreground mt-0.5">{["Incredible work! 🔥", "minting this rn", "the color palette is insane", "added to my collection"][i]}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "details" && (
              <div className="space-y-3 text-sm">
                {[
                  { label: "Contract", value: <AddressChip address={post.contractAddress} /> },
                  { label: "Token Standard", value: post.tokenStandard },
                  { label: "Chain", value: "Injective inEVM" },
                  { label: "Royalty", value: `${post.royalty}%` },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between py-2 border-b border-border-subtle">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="text-foreground font-mono">{item.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
