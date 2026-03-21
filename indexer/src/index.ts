import { createClient } from "@supabase/supabase-js";
import { ponder } from "@/generated";

const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceRoleKey) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for the indexer.");
}

const supabaseAdmin = createClient(
  "https://vhhbggxrnsqpdbnvvnuk.supabase.co",
  supabaseServiceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);

const normalizeAddress = (value?: string | null) => value?.toLowerCase() ?? null;
const timestampFromEvent = (event: { block: { timestamp: bigint } }) =>
  new Date(Number(event.block.timestamp) * 1000).toISOString();

const getMinterTypeName = (value: number | bigint) => {
  switch (Number(value)) {
    case 1:
      return "Free";
    case 2:
      return "Timed";
    case 3:
      return "Allowlist";
    default:
      return "FixedPrice";
  }
};

const getTokenTypeName = (value: number | bigint) =>
  Number(value) === 1 ? "ERC1155" : "ERC721";

async function incrementCollectionValue(
  address: string,
  field: "total_minted" | "total_volume",
  amount: number | bigint,
) {
  const lower = normalizeAddress(address);
  const { data: current } = await supabaseAdmin
    .from("collections")
    .select(field)
    .eq("address", lower)
    .maybeSingle();

  if (field === "total_minted") {
    const nextValue = Number(current?.total_minted ?? 0) + Number(amount);
    await supabaseAdmin
      .from("collections")
      .update({ total_minted: nextValue })
      .eq("address", lower);
    return;
  }

  const nextValue = BigInt(current?.total_volume ?? "0") + BigInt(amount);
  await supabaseAdmin
    .from("collections")
    .update({ total_volume: nextValue.toString() })
    .eq("address", lower);
}

async function incrementPostValue(postId: number, field: "comment_count" | "like_count", amount: number) {
  const { data: post } = await supabaseAdmin
    .from("posts")
    .select(field)
    .eq("post_id", postId)
    .maybeSingle();

  const current = Number(post?.[field] ?? 0);
  await supabaseAdmin
    .from("posts")
    .update({ [field]: Math.max(0, current + amount) })
    .eq("post_id", postId);
}

async function insertActivity(data: Record<string, unknown>) {
  await supabaseAdmin.from("activity").insert(data);
}

ponder.on("Factory:NFTDropDeployed", async ({ event }) => {
  const timestamp = timestampFromEvent(event);

  await supabaseAdmin.from("collections").insert({
    address: normalizeAddress(event.args.collection),
    creator: normalizeAddress(event.args.creator),
    name: event.args.name,
    token_type: "ERC721",
    minter_type: getMinterTypeName(event.args.minterType),
    minter_address: normalizeAddress(event.args.minter),
    deployed_at: timestamp,
    tx_hash: event.transaction.hash,
  });

  await insertActivity({
    event_type: "deploy",
    actor: normalizeAddress(event.args.creator),
    contract: normalizeAddress(event.args.collection),
    tx_hash: event.transaction.hash,
    created_at: timestamp,
  });
});

ponder.on("Factory:EditionDeployed", async ({ event }) => {
  const timestamp = timestampFromEvent(event);

  await supabaseAdmin.from("collections").insert({
    address: normalizeAddress(event.args.collection),
    creator: normalizeAddress(event.args.creator),
    name: event.args.name,
    token_type: "ERC1155",
    minter_type: getMinterTypeName(event.args.minterType),
    minter_address: normalizeAddress(event.args.minter),
    deployed_at: timestamp,
    tx_hash: event.transaction.hash,
  });

  await insertActivity({
    event_type: "deploy",
    actor: normalizeAddress(event.args.creator),
    contract: normalizeAddress(event.args.collection),
    tx_hash: event.transaction.hash,
    created_at: timestamp,
  });
});

ponder.on("FixedPriceMinter:MintExecuted", async ({ event }) => {
  const timestamp = timestampFromEvent(event);

  await supabaseAdmin.from("mints").insert({
    collection: normalizeAddress(event.args.collection),
    token_id: Number(event.args.tokenId),
    minter: normalizeAddress(event.args.to),
    quantity: Number(event.args.quantity),
    price_paid: event.args.totalPaid.toString(),
    tx_hash: event.transaction.hash,
    created_at: timestamp,
  });

  await incrementCollectionValue(
    event.args.collection,
    "total_minted",
    Number(event.args.quantity),
  );

  await insertActivity({
    event_type: "mint",
    actor: normalizeAddress(event.args.to),
    contract: normalizeAddress(event.args.collection),
    token_id: Number(event.args.tokenId),
    amount: event.args.totalPaid.toString(),
    tx_hash: event.transaction.hash,
    created_at: timestamp,
  });
});

ponder.on("Marketplace:Listed", async ({ event }) => {
  await supabaseAdmin.from("listings").insert({
    listing_id: Number(event.args.listingId),
    contract: normalizeAddress(event.args.contractAddress),
    token_id: Number(event.args.tokenId),
    seller: normalizeAddress(event.args.seller),
    price: event.args.price.toString(),
    token_type: getTokenTypeName(event.args.tokenType),
    quantity: 1,
    status: "active",
    tx_hash: event.transaction.hash,
    created_at: timestampFromEvent(event),
  });

  await insertActivity({
    event_type: "list",
    actor: normalizeAddress(event.args.seller),
    contract: normalizeAddress(event.args.contractAddress),
    token_id: Number(event.args.tokenId),
    amount: event.args.price.toString(),
    listing_id: Number(event.args.listingId),
    tx_hash: event.transaction.hash,
    created_at: timestampFromEvent(event),
  });
});

ponder.on("Marketplace:Sale", async ({ event }) => {
  await supabaseAdmin
    .from("listings")
    .update({ status: "sold" })
    .eq("listing_id", Number(event.args.listingId));

  const { data: listing } = await supabaseAdmin
    .from("listings")
    .select("contract, token_id")
    .eq("listing_id", Number(event.args.listingId))
    .maybeSingle();

  if (listing?.contract) {
    await incrementCollectionValue(listing.contract, "total_volume", BigInt(event.args.price));
  }

  await insertActivity({
    event_type: "sale",
    actor: normalizeAddress(event.args.buyer),
    target: normalizeAddress(event.args.seller),
    contract: normalizeAddress(listing?.contract ?? null),
    token_id: listing?.token_id ?? null,
    listing_id: Number(event.args.listingId),
    amount: event.args.price.toString(),
    tx_hash: event.transaction.hash,
    created_at: timestampFromEvent(event),
  });
});

ponder.on("Marketplace:ListingCancelled", async ({ event }) => {
  await supabaseAdmin
    .from("listings")
    .update({ status: "cancelled" })
    .eq("listing_id", Number(event.args.listingId));
});

ponder.on("Offers:OfferMade", async ({ event }) => {
  await supabaseAdmin.from("offers").insert({
    offer_id: Number(event.args.offerId),
    contract: normalizeAddress(event.args.contractAddress),
    token_id: Number(event.args.tokenId),
    buyer: normalizeAddress(event.args.buyer),
    amount: event.args.amount.toString(),
    token_type: "ERC721",
    quantity: 1,
    status: "active",
    tx_hash: event.transaction.hash,
    created_at: timestampFromEvent(event),
  });
});

ponder.on("Offers:OfferAccepted", async ({ event }) => {
  await supabaseAdmin
    .from("offers")
    .update({ status: "accepted" })
    .eq("offer_id", Number(event.args.offerId));

  await insertActivity({
    event_type: "offer_accepted",
    actor: normalizeAddress(event.args.seller),
    offer_id: Number(event.args.offerId),
    tx_hash: event.transaction.hash,
    created_at: timestampFromEvent(event),
  });
});

ponder.on("Offers:OfferCancelled", async ({ event }) => {
  await supabaseAdmin
    .from("offers")
    .update({ status: "cancelled" })
    .eq("offer_id", Number(event.args.offerId));
});

ponder.on("KaliesoProfiles:ProfileCreated", async ({ event }) => {
  await supabaseAdmin.from("profiles").insert({
    wallet: normalizeAddress(event.args.wallet),
    username: event.args.username,
    created_at: timestampFromEvent(event),
  });
});

ponder.on("KaliesoProfiles:ProfileUpdated", async ({ event }) => {
  await supabaseAdmin
    .from("profiles")
    .update({ username: event.args.username })
    .eq("wallet", normalizeAddress(event.args.wallet));
});

ponder.on("KaliesoProfiles:AvatarUpdated", async ({ event }) => {
  await supabaseAdmin
    .from("profiles")
    .update({ avatar_uri: event.args.avatarURI })
    .eq("wallet", normalizeAddress(event.args.wallet));
});

ponder.on("KaliesoFollow:Followed", async ({ event }) => {
  await supabaseAdmin.from("follows").insert({
    follower: normalizeAddress(event.args.follower),
    following: normalizeAddress(event.args.following),
    created_at: timestampFromEvent(event),
  });

  await insertActivity({
    event_type: "follow",
    actor: normalizeAddress(event.args.follower),
    target: normalizeAddress(event.args.following),
    tx_hash: event.transaction.hash,
    created_at: timestampFromEvent(event),
  });
});

ponder.on("KaliesoFollow:Unfollowed", async ({ event }) => {
  await supabaseAdmin
    .from("follows")
    .delete()
    .eq("follower", normalizeAddress(event.args.follower))
    .eq("following", normalizeAddress(event.args.following));
});

ponder.on("KaliesoPosts:PostCreated", async ({ event }) => {
  await supabaseAdmin.from("posts").insert({
    post_id: Number(event.args.postId),
    creator: normalizeAddress(event.args.creator),
    nft_contract: normalizeAddress(event.args.nftContract),
    token_type: getTokenTypeName(event.args.tokenType),
    title: event.args.title,
    content_uri: "",
    created_at: timestampFromEvent(event),
    tx_hash: event.transaction.hash,
  });

  await insertActivity({
    event_type: "post",
    actor: normalizeAddress(event.args.creator),
    contract: normalizeAddress(event.args.nftContract),
    post_id: Number(event.args.postId),
    tx_hash: event.transaction.hash,
    created_at: timestampFromEvent(event),
  });
});

ponder.on("KaliesoPosts:PostDeleted", async ({ event }) => {
  await supabaseAdmin
    .from("posts")
    .update({ deleted: true })
    .eq("post_id", Number(event.args.postId));
});

ponder.on("KaliesoPosts:CommentAdded", async ({ event }) => {
  await supabaseAdmin.from("comments").insert({
    comment_id: Number(event.args.commentId),
    post_id: Number(event.args.postId),
    commenter: normalizeAddress(event.args.commenter),
    content: event.args.content,
    created_at: timestampFromEvent(event),
  });

  await incrementPostValue(Number(event.args.postId), "comment_count", 1);
});

ponder.on("KaliesoPosts:PostLiked", async ({ event }) => {
  await supabaseAdmin.from("likes").insert({
    post_id: Number(event.args.postId),
    wallet: normalizeAddress(event.args.liker),
    created_at: timestampFromEvent(event),
  });

  await incrementPostValue(Number(event.args.postId), "like_count", 1);
});

ponder.on("KaliesoPosts:PostUnliked", async ({ event }) => {
  await supabaseAdmin
    .from("likes")
    .delete()
    .eq("post_id", Number(event.args.postId))
    .eq("wallet", normalizeAddress(event.args.liker));

  await incrementPostValue(Number(event.args.postId), "like_count", -1);
});
