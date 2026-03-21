'use client';

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Heart, MessageCircle, Minus, Plus, Share2 } from "lucide-react";
import { AddressChip } from "@/features/user/AddressChip";
import { FollowButton } from "@/features/user/FollowButton";
import { EmptyState } from "@/features/common/EmptyState";
import { useAuth } from "@/hooks/useAuth";
import { usePost, usePostComments } from "@/hooks/data/usePost";
import { useMint } from "@/hooks/contracts/useMint";
import { useSocial } from "@/hooks/contracts/useSocial";
import { formatINJ, pinataGatewayUrl } from "@/lib/format";

export default function PostDetailPage() {
  const params = useParams<{ id: string }>();
  const postId = Number.parseInt(params?.id ?? "", 10);
  const { address, isAuthenticated, login } = useAuth();
  const postQuery = usePost(postId, address);
  const commentsQuery = usePostComments(postId);
  const mint = useMint();
  const social = useSocial();
  const [quantity, setQuantity] = useState(1);
  const [comment, setComment] = useState("");
  const [liked, setLiked] = useState(false);

  const post = postQuery.data;
  const comments = commentsQuery.data?.pages.flatMap((page) => page.comments) ?? [];
  const mediaUrl = pinataGatewayUrl(post?.content_uri);
  const totalCost = useMemo(() => {
    if (!post?.collection?.mint_price) return "FREE + gas";
    return formatINJ(BigInt(post.collection.mint_price) * BigInt(quantity));
  }, [post?.collection?.mint_price, quantity]);

  if (postQuery.isLoading) {
    return <div className="px-4 py-10 text-sm text-muted-foreground">Loading post...</div>;
  }

  if (!post) {
    return (
      <EmptyState
        icon={MessageCircle}
        title="Post not found"
        subtitle="This post may not exist yet in Supabase."
        ctaLabel="Back Home"
        onCta={() => (window.location.href = "/")}
      />
    );
  }

  async function handleLike() {
    if (!isAuthenticated) {
      login();
      return;
    }

    if (liked || post.has_liked) {
      await social.unlikePost(BigInt(post.post_id));
      setLiked(false);
    } else {
      await social.likePost(BigInt(post.post_id));
      setLiked(true);
    }

    await postQuery.refetch();
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
        BigInt(quantity),
      );
    } else {
      await mint.mintNFT(
        {
          address: post.nft_contract as `0x${string}`,
          minter_type: post.collection.minter_type,
        },
        BigInt(quantity),
      );
    }
  }

  async function handleComment() {
    if (!isAuthenticated) {
      login();
      return;
    }

    if (!comment.trim()) return;
    await social.addComment(BigInt(post.post_id), comment);
    setComment("");
    await commentsQuery.refetch();
  }

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-6 lg:px-6">
      <div className="flex flex-col gap-8 lg:flex-row">
        <div className="lg:w-[55%]">
          <div className="aspect-square overflow-hidden rounded-xl bg-surface">
            {post.media_type === "video" ? (
              <video src={mediaUrl} className="h-full w-full object-cover" controls />
            ) : (
              <img src={mediaUrl} alt={post.title} className="h-full w-full object-cover" />
            )}
          </div>
          <div className="mt-4 flex items-center gap-4">
            <button onClick={() => void handleLike()} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
              <Heart className={`h-5 w-5 ${(liked || post.has_liked) ? "fill-destructive text-destructive" : ""}`} />
              {post.like_count_value + (liked && !post.has_liked ? 1 : 0)}
            </button>
            <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
              <MessageCircle className="h-5 w-5" />
              {post.comment_count_value}
            </button>
            <button className="text-muted-foreground hover:text-foreground">
              <Share2 className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="lg:w-[45%]">
          <div className="space-y-6 lg:sticky lg:top-[76px]">
            <div className="flex items-center justify-between">
              <Link href={`/profile/${post.creator}`} className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-purple-400" />
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {post.profile?.username ?? "Unknown"}
                  </p>
                  <AddressChip address={post.creator} />
                </div>
              </Link>
              <FollowButton targetAddress={post.creator} />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">{post.title}</h1>
              {post.description ? (
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{post.description}</p>
              ) : null}
            </div>

            <div className="grid grid-cols-3 gap-4">
              {[
                ["PRICE", post.collection?.mint_price === "0" ? "FREE" : formatINJ(post.collection?.mint_price)],
                ["MINTED", String(post.collection?.total_minted ?? 0)],
                ["MAX", String(post.collection?.max_supply ?? "∞")],
              ].map(([label, value]) => (
                <div key={label} className="card-surface p-3 text-center">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
                  <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
                </div>
              ))}
            </div>

            <div className="card-surface space-y-4 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Quantity</span>
                <div className="flex items-center gap-3">
                  <button onClick={() => setQuantity((current) => Math.max(1, current - 1))} className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-elevated">
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-8 text-center font-mono text-sm font-semibold text-foreground">{quantity}</span>
                  <button onClick={() => setQuantity((current) => current + 1)} className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-elevated">
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total</span>
                <span className="font-mono font-semibold text-foreground">{totalCost}</span>
              </div>
              <button onClick={() => void handleMint()} className="min-h-11 w-full rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-foreground">
                Mint Now
              </button>
            </div>

            <div className="card-surface space-y-4 p-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">Comments</h2>
              <div className="flex gap-2">
                <input
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  placeholder="Add a comment..."
                  className="min-h-11 flex-1 rounded-lg border border-border bg-surface-elevated px-4 text-sm text-foreground outline-none"
                />
                <button onClick={() => void handleComment()} className="min-h-11 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground">
                  Post
                </button>
              </div>
              <div className="space-y-3">
                {comments.map((item) => (
                  <div key={item.comment_id} className="flex gap-3">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-purple-400" />
                    <div>
                      <p className="text-xs font-mono text-muted-foreground">
                        {item.profile?.username ?? item.commenter}
                      </p>
                      <p className="mt-0.5 text-sm text-foreground">{item.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3 text-sm">
              {[
                { label: "Contract", value: <AddressChip address={post.nft_contract} /> },
                { label: "Token Standard", value: post.token_type },
                { label: "Chain", value: "Injective inEVM" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between border-b border-border-subtle py-2">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="font-mono text-foreground">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
