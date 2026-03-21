import { useState } from "react";
import { Link } from "react-router-dom";
import { Grid3x3, List, ArrowUpRight } from "lucide-react";
import { posts, creators, formatINJ, formatCount, truncateAddress, listings } from "@/data/mockData";

export default function MarketplacePage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  return (
    <div className="max-w-[1200px] mx-auto px-4 lg:px-6 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Marketplace</h1>
          <p className="text-sm text-muted-foreground">{listings.length} active listings</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setViewMode("grid")} className={`p-2 rounded-lg transition-default ${viewMode === "grid" ? "bg-surface-elevated text-foreground" : "text-muted-foreground"}`}>
            <Grid3x3 className="w-4 h-4" />
          </button>
          <button onClick={() => setViewMode("list")} className={`p-2 rounded-lg transition-default ${viewMode === "list" ? "bg-surface-elevated text-foreground" : "text-muted-foreground"}`}>
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          ["Total Volume", "48,230 INJ"],
          ["24h Volume", "2,140 INJ"],
          ["Active Listings", String(listings.length)],
          ["Unique Sellers", "142"],
        ].map(([label, val]) => (
          <div key={label} className="card-surface p-4 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
            <p className="text-lg font-mono font-bold text-foreground mt-1">{val}</p>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex gap-3 flex-wrap">
        {["Type: All", "Price: Any", "Sort: Recent"].map((f) => (
          <button key={f} className="px-4 py-2 bg-surface border border-border rounded-lg text-sm text-muted-foreground hover:text-foreground transition-default">
            {f} ▾
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {listings.map((listing) => (
          <Link
            key={listing.id}
            to={`/post/${listing.post.id}`}
            className="card-surface overflow-hidden group hover:scale-[1.01] transition-transform duration-150"
          >
            <div className="aspect-square overflow-hidden">
              <img src={listing.post.media} alt={listing.post.title} className="w-full h-full object-cover" />
            </div>
            <div className="p-3 space-y-2">
              <p className="text-xs text-muted-foreground truncate">{listing.post.creator.name}</p>
              <p className="text-sm font-semibold text-foreground truncate">{listing.post.title} #{listing.tokenId}</p>
              <p className="text-[10px] text-muted-foreground">
                Listed by <span className="font-mono">{truncateAddress(listing.seller.address)}</span>
              </p>
              <div className="flex items-center justify-between pt-2 border-t border-border-subtle">
                <span className="font-mono text-sm font-semibold text-foreground">{formatINJ(listing.price)}</span>
                <span className="flex items-center gap-1 text-xs font-semibold text-primary opacity-0 group-hover:opacity-100 transition-default">
                  BUY <ArrowUpRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
