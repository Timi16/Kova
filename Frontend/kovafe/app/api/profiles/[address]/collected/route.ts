import { type NextRequest } from "next/server";
import { normalizeAddress } from "@/lib/format";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { errorResponse, json, parseCursor, parseLimit } from "@/lib/server/api";
import { nextCursor } from "@/lib/server/queries";

type Context = {
  params: Promise<{ address: string }>;
};

export async function GET(request: NextRequest, context: Context) {
  try {
    const { address } = await context.params;
    const wallet = normalizeAddress(address);
    const { searchParams } = new URL(request.url);
    const cursor = parseCursor(searchParams.get("cursor"));
    const limit = parseLimit(searchParams.get("limit"));

    const { data, error } = await supabaseAdmin
      .from("mints")
      .select("*")
      .eq("minter", wallet)
      .order("created_at", { ascending: false })
      .range(cursor, cursor + limit - 1);

    if (error) throw error;

    return json({ mints: data ?? [], nextCursor: nextCursor(data ?? [], cursor, limit) });
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "Failed to load collected mints",
    );
  }
}
