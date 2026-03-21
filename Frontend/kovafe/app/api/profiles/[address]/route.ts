import { normalizeAddress } from "@/lib/format";
import type { Database } from "@/lib/database.types";
import type { ProfileRow } from "@/lib/api-types";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { errorResponse, json } from "@/lib/server/api";
import { sumPricePaid } from "@/lib/server/queries";

type CollectionRow = Database["public"]["Tables"]["collections"]["Row"];

type Context = {
  params: Promise<{ address: string }>;
};

export async function GET(_: Request, context: Context) {
  try {
    const { address } = await context.params;
    const wallet = normalizeAddress(address);

    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("wallet", wallet)
      .maybeSingle();
    const profile = data as ProfileRow | null;

    if (error) throw error;
    if (!profile) {
      return errorResponse("Profile not found", 404);
    }

    const [
      postsResponse,
      followersResponse,
      followingResponse,
      collectionsResponse,
    ] = await Promise.all([
      supabaseAdmin
        .from("posts")
        .select("*", { count: "exact", head: true })
        .eq("creator", wallet)
        .eq("deleted", false),
      supabaseAdmin
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("following", wallet),
      supabaseAdmin
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("follower", wallet),
      supabaseAdmin
        .from("collections")
        .select("address")
        .eq("creator", wallet),
    ]);

    if (collectionsResponse.error) throw collectionsResponse.error;

    const collectionAddresses = (collectionsResponse.data ?? []).map(
      (collection: CollectionRow) => collection.address,
    );

    const mintsResponse = collectionAddresses.length
      ? await supabaseAdmin
          .from("mints")
          .select("*")
          .in("collection", collectionAddresses)
      : { data: [], error: null };

    if (mintsResponse.error) throw mintsResponse.error;

    return json({
      ...profile,
      post_count: postsResponse.count ?? 0,
      follower_count: followersResponse.count ?? 0,
      following_count: followingResponse.count ?? 0,
      total_earned: sumPricePaid(mintsResponse.data ?? []),
    });
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "Failed to load profile",
    );
  }
}
