import { type NextRequest } from "next/server";
import { normalizeAddress } from "@/lib/format";
import { supabaseAdmin } from "@/lib/supabase";
import { errorResponse, json, parseCursor, parseLimit } from "@/lib/server/api";
import { hydratePosts, nextCursor } from "@/lib/server/queries";
import type { Database } from "@/lib/database.types";

type FollowRow = Database["public"]["Tables"]["follows"]["Row"];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = normalizeAddress(searchParams.get("address"));
    const cursor = parseCursor(searchParams.get("cursor"));
    const limit = parseLimit(searchParams.get("limit"));

    if (!address) {
      return json({ posts: [], nextCursor: null });
    }

    const { data: follows, error: followError } = await supabaseAdmin
      .from("follows")
      .select("following")
      .eq("follower", address);

    if (followError) throw followError;

    const following = (follows ?? []).map(
      (item: FollowRow) => item.following,
    );
    if (!following.length) {
      return json({ posts: [], nextCursor: null });
    }

    const { data, error } = await supabaseAdmin
      .from("posts")
      .select("*")
      .in("creator", following)
      .eq("deleted", false)
      .order("created_at", { ascending: false })
      .range(cursor, cursor + limit - 1);

    if (error) throw error;

    const posts = await hydratePosts(data ?? []);

    return json({
      posts,
      nextCursor: nextCursor(posts, cursor, limit),
    });
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "Failed to load following feed",
    );
  }
}
