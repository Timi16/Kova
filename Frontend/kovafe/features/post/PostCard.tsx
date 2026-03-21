import { Link } from "react-router-dom";
import { Heart, MessageCircle, Share2, ArrowUpRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { Post } from "@/data/mockData";
import { formatINJ, formatCount } from "@/data/mockData";
import { AddressChip } from "./AddressChip";
import { CountdownTimer } from "./CountdownTimer";
import { useStore } from "@/store/useStore";

export function PostCard({ post }: { post: Post }) {
  const { likedPosts, toggleLike, isSignedIn, signIn } = useStore();
  const liked = likedPosts.has(post.id);

  const handleLike = () => {
    if (!isSignedIn) { signIn(); return; }
    toggleLike(post.id);
  };

  const handleMint = () => {
    if (!isSignedIn) { signIn(); return; }
    // Mock mint
  };

  const isFree = post.price === 0;
  const isSoldOut = post.status === "sold_out";
  const isEnded = post.status === "ended";

  return (
    <div className="card-surface overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 pb-3">
        <Link to={`/profile/${post.creator.address}`}>
          <img src={post.creator.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Link to={`/profile/${post.creator.address}`} className="text-sm font-semibold text-foreground hover:underline">
              {post.creator.name}
            </Link>
            <AddressChip address={post.creator.address} />
          </div>
          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
          </p>
        </div>
      </div>

      {/* Media */}
      <Link to={`/post/${post.id}`}>
        <div className="aspect-square relative overflow-hidden">
          <img
            src={post.media}
            alt={post.title}
            className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-300"
          />
        </div>
      </Link>

      {/* Info */}
      <div className="p-4 space-y-3">
        <div>
          <Link to={`/post/${post.id}`} className="text-base font-bold text-foreground hover:underline">
            {post.title}
          </Link>
          {post.description && (
            <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{post.description}</p>
          )}
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-6 text-xs text-muted-foreground">
          <div>
            <p className="text-[10px] uppercase tracking-wider">Mint Price</p>
            <p className={`font-mono text-sm font-semibold ${isFree ? "text-success" : "text-foreground"}`}>
              {isFree ? "FREE + gas" : formatINJ(post.price)}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider">Collected</p>
            <p className="text-sm font-semibold text-foreground">
              {formatCount(post.mintCount)} ◆
              {post.type === "limited" && <span className="text-muted-foreground font-normal"> / {formatCount(post.supply)}</span>}
            </p>
          </div>
          {post.endsAt && post.status === "live" && (
            <div>
              <p className="text-[10px] uppercase tracking-wider">Ends In</p>
              <CountdownTimer endsAt={post.endsAt} />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-border-subtle">
          <div className="flex items-center gap-4">
            <button onClick={handleLike} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-default group">
              <Heart className={`w-4 h-4 ${liked ? "fill-destructive text-destructive" : "group-hover:text-destructive"}`} />
              <span>{formatCount(post.likes + (liked ? 1 : 0))}</span>
            </button>
            <Link to={`/post/${post.id}`} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-default">
              <MessageCircle className="w-4 h-4" />
              <span>{formatCount(post.comments)}</span>
            </Link>
            <button className="text-muted-foreground hover:text-foreground transition-default">
              <Share2 className="w-4 h-4" />
            </button>
          </div>

          {isSoldOut || isEnded ? (
            <span className="px-4 py-2 rounded-full bg-surface text-muted-foreground text-sm font-semibold">
              {isSoldOut ? "SOLD OUT" : "ENDED"}
            </span>
          ) : (
            <button
              onClick={handleMint}
              className="flex items-center gap-1.5 px-5 py-2 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-default"
            >
              MINT
              <ArrowUpRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
