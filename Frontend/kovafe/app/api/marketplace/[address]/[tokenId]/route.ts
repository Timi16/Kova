import { normalizeAddress } from "@/lib/format";
import { supabaseAdmin } from "@/lib/supabase";
import { errorResponse, json } from "@/lib/server/api";
import { fetchListingsWithContext, filterOffers } from "@/lib/server/queries";

type Context = {
  params: Promise<{ address: string; tokenId: string }>;
};

export async function GET(_: Request, context: Context) {
  try {
    const { address, tokenId } = await context.params;
    const contract = normalizeAddress(address);
    const parsedTokenId = Number.parseInt(tokenId, 10);

    const [{ data: listings, error: listingError }, { data: offers, error: offerError }] =
      await Promise.all([
        supabaseAdmin
          .from("listings")
          .select("*")
          .eq("contract", contract)
          .eq("token_id", parsedTokenId)
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .limit(1),
        supabaseAdmin
          .from("offers")
          .select("*")
          .eq("contract", contract)
          .eq("token_id", parsedTokenId),
      ]);

    if (listingError) throw listingError;
    if (offerError) throw offerError;

    const [listing] = await fetchListingsWithContext(listings ?? []);

    return json({
      listing: listing ?? null,
      offers: filterOffers(offers ?? []),
    });
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "Failed to load token market",
    );
  }
}
