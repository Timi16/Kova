import { type NextRequest } from "next/server";
import { normalizeAddress } from "@/lib/format";
import { supabaseAdmin } from "@/lib/supabase";
import { errorResponse, json, parseCursor, parseLimit } from "@/lib/server/api";
import { fetchProfiles, nextCursor } from "@/lib/server/queries";

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
      .from("follows")
      .select("*")
      .eq("follower", wallet)
      .order("created_at", { ascending: false })
      .range(cursor, cursor + limit - 1);

    if (error) throw error;

    const profiles = await fetchProfiles((data ?? []).map((item: any) => item.following));
    const profileMap = new Map(profiles.map((profile: any) => [profile.wallet, profile]));

    const following = (data ?? []).map((follow: any) => ({
      ...follow,
      profile: profileMap.get(follow.following) ?? null,
    }));

    return json({
      following,
      nextCursor: nextCursor(following, cursor, limit),
    });
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "Failed to load following",
    );
  }
}
