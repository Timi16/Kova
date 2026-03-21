import { type NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { errorResponse, json, parseCursor, parseLimit } from "@/lib/server/api";
import { hydratePosts, nextCursor } from "@/lib/server/queries";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cursor = parseCursor(searchParams.get("cursor"));
    const limit = parseLimit(searchParams.get("limit"));

    const { data, error } = await supabaseAdmin
      .from("posts")
      .select("*")
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
      error instanceof Error ? error.message : "Failed to load feed",
    );
  }
}
