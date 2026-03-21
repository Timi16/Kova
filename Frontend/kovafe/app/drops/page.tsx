'use client';

import { useState } from "react";
import { Link } from "react-router-dom";
import { posts, formatINJ, formatCount } from "@/data/mockData";
import { ArrowUpRight } from "lucide-react";

const filters = ["All", "Live", "Upcoming", "Sold Out"] as const;

export default function DropsPage() {
  const [active, setActive] = useState<string>("All");

  const limitedPosts = posts.filter((p) => p.type === "limited");
  const filtered = active === "All" ? limitedPosts : limitedPosts.filter((p) => {
    if (active === "Live") return p.status === "live";
    if (active === "Upcoming") return p.status === "upcoming";
    if (active === "Sold Out") return p.status === "sold_out";
    return true;
  });

  return (
    <div className="max-w-[1200px] mx-auto px-4 lg:px-6 py-6 space-y-6">
      <h1 className="text-2xl font-bold text-foreground tracking-tight">Drops</h1>

      <div className="flex gap-2">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setActive(f)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-default ${
              active === f ? "bg-primary text-primary-foreground" : "bg-surface text-muted-foreground border border-border"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((post) => {
          const progress = post.supply > 0 ? (post.mintCount / post.supply) * 100 : 0;
          return (
            <Link key={post.id} to={`/post/${post.id}`} className="card-surface overflow-hidden group">
              <div className="aspect-square overflow-hidden">
                <img src={post.media} alt={post.title} className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300" />
              </div>
              <div className="p-4 space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground">{post.creator.name}</p>
                  <h3 className="text-base font-semibold text-foreground">{post.title}</h3>
                </div>
                {post.supply > 0 && (
                  <div>
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>{formatCount(post.mintCount)} minted</span>
                      <span>{formatCount(post.supply)} total</span>
                    </div>
                    <div className="h-1.5 bg-surface-elevated rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${Math.min(progress, 100)}%` }} />
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-semibold text-foreground">{formatINJ(post.price)}</span>
                  {post.status === "sold_out" ? (
                    <span className="text-xs font-semibold text-muted-foreground">SOLD OUT</span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-semibold text-primary">
                      MINT <ArrowUpRight className="w-3 h-3" />
                    </span>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
