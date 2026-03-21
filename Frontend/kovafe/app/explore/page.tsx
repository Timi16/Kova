'use client';

import { useState } from "react";
import { Search } from "lucide-react";
import { posts, creators, categories, formatCount, formatINJ, truncateAddress } from "@/data/mockData";
import { Link } from "react-router-dom";
import { FollowButton } from "@/features/user/FollowButton";

export default function ExplorePage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const trending = [...posts].sort((a, b) => b.mintCount - a.mintCount).slice(0, 8);
  const topCreators = [...creators].sort((a, b) => b.totalVolume - a.totalVolume).slice(0, 8);

  return (
    <div className="max-w-[1200px] mx-auto px-4 lg:px-6 py-6 space-y-8">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          placeholder="Search creators, posts, collections..."
          className="w-full pl-12 pr-4 py-3.5 bg-surface border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary text-sm"
        />
      </div>

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-default ${
              activeCategory === cat
                ? "bg-primary text-primary-foreground"
                : "bg-surface text-muted-foreground hover:text-foreground border border-border"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Trending Posts */}
      <section>
        <h2 className="text-lg font-bold text-foreground mb-4">Trending Posts</h2>
        <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
          {trending.map((post) => (
            <Link key={post.id} to={`/post/${post.id}`} className="flex-shrink-0 w-[280px] card-surface overflow-hidden group">
              <div className="aspect-square overflow-hidden">
                <img src={post.media} alt={post.title} className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300" />
              </div>
              <div className="p-3">
                <h3 className="text-sm font-semibold text-foreground truncate">{post.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">{post.creator.name}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs font-mono text-foreground">{formatINJ(post.price)}</span>
                  <span className="text-xs text-muted-foreground">{formatCount(post.mintCount)} mints</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Top Creators */}
      <section>
        <h2 className="text-lg font-bold text-foreground mb-4">Top Creators</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {topCreators.map((c) => (
            <div key={c.id} className="card-surface p-4 flex flex-col items-center text-center">
              <Link to={`/profile/${c.address}`}>
                <img src={c.avatar} alt="" className="w-14 h-14 rounded-full object-cover mb-3" />
              </Link>
              <Link to={`/profile/${c.address}`} className="text-sm font-semibold text-foreground hover:underline">{c.name}</Link>
              <p className="text-xs font-mono text-muted-foreground mt-0.5">{truncateAddress(c.address)}</p>
              <p className="text-xs text-muted-foreground mt-1">{c.postCount} posts · {formatINJ(c.totalVolume)} vol</p>
              <div className="mt-3">
                <FollowButton creatorId={c.id} small />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* All Posts — masonry-ish grid */}
      <section>
        <h2 className="text-lg font-bold text-foreground mb-4">All Posts</h2>
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
          {posts.map((post) => (
            <Link key={post.id} to={`/post/${post.id}`} className="card-surface overflow-hidden block break-inside-avoid group">
              <div className="overflow-hidden">
                <img src={post.media} alt={post.title} className="w-full object-cover group-hover:scale-[1.02] transition-transform duration-300" />
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
      </section>
    </div>
  );
}
