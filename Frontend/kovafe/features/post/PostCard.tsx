'use client';

import Link from "next/link";
import { ArrowUpRight, Heart, MessageCircle, Share2 } from "lucide-react";
import { useState } from "react";
import type { FeedPost } from "@/lib/api-types";
import { formatINJ, pinataGatewayUrl } from "@/lib/format";
import { AddressChip } from "@/features/user/AddressChip";
import { useAuth } from "@/hooks/useAuth";
import { useMint } from "@/hooks/contracts/useMint";
import { useSocial } from "@/hooks/contracts/useSocial";

export function PostCard({ post }: { post: FeedPost }) {
  const { isAuthenticated, login } = useAuth();
  const mint = useMint();
  const social = useSocial();
  const [liked, setLiked] = useState(false);

  const isFree = !post.collection?.mint_price || post.collection.mint_price === "0";
  const mediaUrl = pinataGatewayUrl(post.content_uri);
  const minted = post.collection?.total_minted ?? 0;
  const maxSupply = post.collection?.max_supply ?? 0;

  async function handleLike() {
    if (!isAuthenticated) {
      login();
      return;
    }

    if (liked) {
      await social.unlikePost(BigInt(post.post_id));
      setLiked(false);
    } else {
      await social.likePost(BigInt(post.post_id));
      setLiked(true);
    }
  }

  async function handleMint() {
    if (!isAuthenticated) {
      login();
      return;
    }

    if (!post.collection) return;

    if (post.token_type === "ERC1155") {
      await mint.mintEdition(
        {
          address: post.nft_contract as `0x${string}`,
          minter_type: post.collection.minter_type,
        },
        BigInt(post.edition_token_id ?? 1),
        1n,
      );
      return;
    }

    await mint.mintNFT(
      {
        address: post.nft_contract as `0x${string}`,
        minter_type: post.collection.minter_type,
      },
      1n,
    );
  }

  return (
    <div className="card-surface overflow-hidden">
      <div className="flex items-center gap-3 p-4 pb-3">
        <Link href={`/profile/${post.creator}`}>
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-purple-400" />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Link href={`/profile/${post.creator}`} className="text-sm font-semibold text-foreground hover:underline">
              {post.profile?.username ?? "Unknown"}
            </Link>
            <AddressChip address={post.creator} />
          </div>
          <p className="text-xs text-muted-foreground">
            {new Date(post.created_at).toLocaleString()}
          </p>
        </div>
      </div>

      <Link href={`/post/${post.post_id}`}>
        <div className="relative aspect-square overflow-hidden">
          {post.media_type === "video" ? (
            <video src={mediaUrl} className="h-full w-full object-cover" muted playsInline />
          ) : (
            <img
              src={mediaUrl}
              alt={post.title}
              className="h-full w-full object-cover transition-transform duration-300 hover:scale-[1.02]"
            />
          )}
        </div>
      </Link>

      <div className="space-y-3 p-4">
        <div>
          <Link href={`/post/${post.post_id}`} className="text-base font-bold text-foreground hover:underline">
            {post.title}
          </Link>
          {post.description ? (
            <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{post.description}</p>
          ) : null}
        </div>

        <div className="flex items-center gap-6 text-xs text-muted-foreground">
          <div>
            <p className="text-[10px] uppercase tracking-wider">Mint Price</p>
            <p className={`text-sm font-semibold ${isFree ? "text-success" : "text-foreground"} font-mono`}>
              {isFree ? "FREE + gas" : formatINJ(post.collection?.mint_price)}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider">Collected</p>
            <p className="text-sm font-semibold text-foreground">
              {minted}
              {maxSupply ? <span className="font-normal text-muted-foreground"> / {maxSupply}</span> : null}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-border-subtle pt-2">
          <div className="flex items-center gap-4">
            <button onClick={() => void handleLike()} className="group flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
              <Heart className={`h-4 w-4 ${liked ? "fill-destructive text-destructive" : "group-hover:text-destructive"}`} />
              <span>{post.like_count + (liked ? 1 : 0)}</span>
            </button>
            <Link href={`/post/${post.post_id}`} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
              <MessageCircle className="h-4 w-4" />
              <span>{post.comment_count}</span>
            </Link>
            <button className="text-muted-foreground hover:text-foreground">
              <Share2 className="h-4 w-4" />
            </button>
          </div>
          <button
            onClick={() => void handleMint()}
            className="flex min-h-11 items-center gap-1.5 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground"
          >
            MINT
            <ArrowUpRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
