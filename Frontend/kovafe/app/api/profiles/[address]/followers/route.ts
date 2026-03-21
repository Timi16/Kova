import { type NextRequest } from "next/server";
import { normalizeAddress } from "@/lib/format";
import type { Database } from "@/lib/database.types";
import type { ProfileRow } from "@/lib/api-types";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { errorResponse, json, parseCursor, parseLimit } from "@/lib/server/api";
import { fetchProfiles, nextCursor } from "@/lib/server/queries";

type FollowRow = Database["public"]["Tables"]["follows"]["Row"];

type Context = {
  params: Promise<{ address: string }>;
};

export async function GET(request: NextRequest, context: Context) {
  try {
    const { address } = await context.params;
    const { searchParams } = new URL(request.url);
    const wallet = normalizeAddress(address);
    const check = normalizeAddress(searchParams.get("check"));

    if (check) {
      const { count, error } = await supabaseAdmin
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("follower", check)
        .eq("following", wallet);

      if (error) throw error;
      return json({ isFollowing: Boolean(count) });
    }

    const cursor = parseCursor(searchParams.get("cursor"));
    const limit = parseLimit(searchParams.get("limit"));

    const { data, error } = await supabaseAdmin
      .from("follows")
      .select("*")
      .eq("following", wallet)
      .order("created_at", { ascending: false })
      .range(cursor, cursor + limit - 1);

    if (error) throw error;

    const profiles = await fetchProfiles(
      (data ?? []).map((item: FollowRow) => item.follower),
    );
    const profileMap = new Map<string, ProfileRow>(
      profiles.map((profile) => [profile.wallet, profile]),
    );

    const followers = (data ?? []).map((follow: FollowRow) => ({
      ...follow,
      profile: profileMap.get(follow.follower) ?? null,
    }));

    return json({
      followers,
      nextCursor: nextCursor(followers, cursor, limit),
    });
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "Failed to load followers",
    );
  }
}
