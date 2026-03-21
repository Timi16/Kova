import { type NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { errorResponse, json, parseCursor, parseLimit } from "@/lib/server/api";
import { fetchListingsWithContext, nextCursor, sortListings } from "@/lib/server/queries";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cursor = parseCursor(searchParams.get("cursor"));
    const limit = parseLimit(searchParams.get("limit"));
    const type = searchParams.get("type");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const sort = searchParams.get("sort");

    let query = supabaseAdmin
      .from("listings")
      .select("*")
      .eq("status", "active");

    if (type) {
      query = query.eq("token_type", type);
    }

    if (minPrice) {
      query = query.gte("price", minPrice);
    }

    if (maxPrice) {
      query = query.lte("price", maxPrice);
    }

    const { data, error } = await query;

    if (error) throw error;

    const sorted = sortListings(data ?? [], sort).slice(cursor, cursor + limit);
    const listings = await fetchListingsWithContext(sorted);

    return json({
      listings,
      nextCursor: nextCursor(sorted, cursor, limit),
    });
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "Failed to load marketplace",
    );
  }
}
