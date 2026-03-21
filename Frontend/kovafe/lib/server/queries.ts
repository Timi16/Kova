import { supabaseAdmin } from "@/lib/supabase";
import { normalizeAddress } from "@/lib/format";
import { mapByKey } from "@/lib/server/api";
import type {
  ActivityRow,
  CollectionRow,
  CommentRow,
  FeedPost,
  ListingRow,
  MintRow,
  OfferRow,
  PostRow,
  ProfileRow,
} from "@/lib/api-types";

export async function fetchProfiles(wallets: string[]): Promise<ProfileRow[]> {
  const ids = [...new Set(wallets.map(normalizeAddress).filter(Boolean))];
  if (!ids.length) return [] as ProfileRow[];

  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("*")
    .in("wallet", ids);

  if (error) throw error;
  return (data ?? []) as ProfileRow[];
}

export async function fetchCollections(addresses: string[]): Promise<CollectionRow[]> {
  const ids = [...new Set(addresses.map(normalizeAddress).filter(Boolean))];
  if (!ids.length) return [] as CollectionRow[];

  const { data, error } = await supabaseAdmin
    .from("collections")
    .select("*")
    .in("address", ids);

  if (error) throw error;
  return (data ?? []) as CollectionRow[];
}

export async function fetchPostsByContracts(contracts: string[]): Promise<PostRow[]> {
  const ids = [...new Set(contracts.map(normalizeAddress).filter(Boolean))];
  if (!ids.length) return [] as PostRow[];

  const { data, error } = await supabaseAdmin
    .from("posts")
    .select("*")
    .in("nft_contract", ids);

  if (error) throw error;
  return (data ?? []) as PostRow[];
}

export async function hydratePosts(posts: PostRow[]): Promise<FeedPost[]> {
  const [profiles, collections] = await Promise.all([
    fetchProfiles(posts.map((post) => post.creator)),
    fetchCollections(posts.map((post) => post.nft_contract)),
  ]);

  const profileMap = mapByKey(profiles, "wallet");
  const collectionMap = mapByKey(collections, "address");

  return posts.map((post) => ({
    ...post,
    profile: profileMap.get(post.creator.toLowerCase()) ?? null,
    collection: collectionMap.get(post.nft_contract.toLowerCase()) ?? null,
  })) as FeedPost[];
}

export async function fetchPost(postId: number): Promise<PostRow | null> {
  const { data, error } = await supabaseAdmin
    .from("posts")
    .select("*")
    .eq("post_id", postId)
    .maybeSingle();

  if (error) throw error;
  return (data as PostRow | null) ?? null;
}

export async function fetchCommentsWithProfiles(comments: CommentRow[]) {
  const profiles = await fetchProfiles(comments.map((comment) => comment.commenter));
  const profileMap = mapByKey(profiles, "wallet");

  return comments.map((comment) => ({
    ...comment,
    profile: profileMap.get(comment.commenter.toLowerCase()) ?? null,
  }));
}

export async function fetchListingsWithContext(listings: ListingRow[]) {
  const [collections, posts] = await Promise.all([
    fetchCollections(listings.map((listing) => listing.contract)),
    fetchPostsByContracts(listings.map((listing) => listing.contract)),
  ]);

  const collectionMap = mapByKey(collections, "address");
  const postMap = mapByKey(posts, "nft_contract");

  return listings.map((listing) => ({
    ...listing,
    collection: collectionMap.get(listing.contract.toLowerCase()) ?? null,
    post: postMap.get(listing.contract.toLowerCase()) ?? null,
  }));
}

export async function fetchActivitiesWithProfiles(activities: ActivityRow[]) {
  const profiles = await fetchProfiles(activities.map((activity) => activity.actor));
  const profileMap = mapByKey(profiles, "wallet");

  return activities.map((activity) => ({
    ...activity,
    profile: profileMap.get(activity.actor.toLowerCase()) ?? null,
  }));
}

export function nextCursor<T>(items: T[], cursor: number, limit: number) {
  return items.length < limit ? null : cursor + limit;
}

export function sumPricePaid(mints: MintRow[]) {
  return mints.reduce((acc, mint) => acc + BigInt(mint.price_paid), BigInt(0)).toString();
}

export function uniqueOwners(mints: MintRow[]) {
  return new Set(mints.map((mint) => mint.minter.toLowerCase())).size;
}

export function sortListings(
  listings: ListingRow[],
  sort: string | null,
) {
  if (sort === "price_asc") {
    return [...listings].sort((a, b) => BigInt(a.price) < BigInt(b.price) ? -1 : 1);
  }

  if (sort === "price_desc") {
    return [...listings].sort((a, b) => BigInt(a.price) > BigInt(b.price) ? -1 : 1);
  }

  return [...listings].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}

export function filterOffers(offers: OfferRow[]) {
  return offers.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}
