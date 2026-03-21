import { type NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { errorResponse, json, parseCursor, parseLimit } from "@/lib/server/api";
import { fetchCommentsWithProfiles, nextCursor } from "@/lib/server/queries";

type Context = {
  params: Promise<{ postId: string }>;
};

export async function GET(request: NextRequest, context: Context) {
  try {
    const { postId } = await context.params;
    const { searchParams } = new URL(request.url);
    const cursor = parseCursor(searchParams.get("cursor"));
    const limit = parseLimit(searchParams.get("limit"));

    const { data, error } = await supabaseAdmin
      .from("comments")
      .select("*")
      .eq("post_id", Number.parseInt(postId, 10))
      .eq("deleted", false)
      .order("created_at", { ascending: false })
      .range(cursor, cursor + limit - 1);

    if (error) throw error;

    const comments = await fetchCommentsWithProfiles(data ?? []);

    return json({
      comments,
      nextCursor: nextCursor(comments, cursor, limit),
    });
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "Failed to load comments",
    );
  }
}
