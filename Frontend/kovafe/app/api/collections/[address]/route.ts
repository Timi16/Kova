import { normalizeAddress } from "@/lib/format";
import type { CollectionRow, MintRow } from "@/lib/api-types";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { errorResponse, json } from "@/lib/server/api";
import { uniqueOwners } from "@/lib/server/queries";

type Context = {
  params: Promise<{ address: string }>;
};

export async function GET(_: Request, context: Context) {
  try {
    const { address } = await context.params;
    const contract = normalizeAddress(address);

    const { data, error } = await supabaseAdmin
      .from("collections")
      .select("*")
      .eq("address", contract)
      .maybeSingle();
    const collection = data as CollectionRow | null;

    if (error) throw error;
    if (!collection) {
      return errorResponse("Collection not found", 404);
    }

    const { data: mintData, error: mintError } = await supabaseAdmin
      .from("mints")
      .select("*")
      .eq("collection", contract)
      .order("created_at", { ascending: false });
    const mints = (mintData ?? []) as MintRow[];

    if (mintError) throw mintError;

    return json({
      ...collection,
      mint_count: mints?.length ?? 0,
      owner_count: uniqueOwners(mints ?? []),
      latest_mint_at: mints?.[0]?.created_at ?? null,
    });
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "Failed to load collection",
    );
  }
}
