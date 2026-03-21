import type { Database } from "@/lib/database.types";

export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
export type CollectionRow = Database["public"]["Tables"]["collections"]["Row"];
export type PostRow = Database["public"]["Tables"]["posts"]["Row"];
export type CommentRow = Database["public"]["Tables"]["comments"]["Row"];
export type ListingRow = Database["public"]["Tables"]["listings"]["Row"];
export type OfferRow = Database["public"]["Tables"]["offers"]["Row"];
export type ActivityRow = Database["public"]["Tables"]["activity"]["Row"];
export type MintRow = Database["public"]["Tables"]["mints"]["Row"];

export type FeedPost = PostRow & {
  profile: ProfileRow | null;
  collection: CollectionRow | null;
};

export type PostDetails = FeedPost & {
  like_count_value: number;
  comment_count_value: number;
  has_liked: boolean;
};

export type CommentWithProfile = CommentRow & {
  profile: ProfileRow | null;
};

export type ProfileDetails = ProfileRow & {
  post_count: number;
  follower_count: number;
  following_count: number;
  total_earned: string;
};

export type CollectionDetails = CollectionRow & {
  mint_count: number;
  owner_count: number;
  latest_mint_at: string | null;
};

export type MarketplaceListing = ListingRow & {
  collection: CollectionRow | null;
  post: PostRow | null;
};

export type TokenMarket = {
  listing: MarketplaceListing | null;
  offers: OfferRow[];
};

export type SearchResults = {
  profiles: ProfileRow[];
  posts: PostRow[];
  collections: CollectionRow[];
};
