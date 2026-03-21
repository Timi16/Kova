import { type NextRequest } from "next/server";
import type { PostDetails } from "@/lib/api-types";
import { normalizeAddress } from "@/lib/format";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { errorResponse, json } from "@/lib/server/api";
import { fetchPost, hydratePosts } from "@/lib/server/queries";

type Context = {
  params: Promise<{ postId: string }>;
};

export async function GET(request: NextRequest, context: Context) {
  try {
    const { postId } = await context.params;
    const viewer = normalizeAddress(new URL(request.url).searchParams.get("viewer"));
    const id = Number.parseInt(postId, 10);
    const post = await fetchPost(id);

    if (!post || post.deleted) {
      return errorResponse("Post not found", 404);
    }

    const [details] = await hydratePosts([post]);
    const typedDetails = details as PostDetails;

    const [{ count: likeCount }, { count: commentCount }, likedResponse] =
      await Promise.all([
        supabaseAdmin
          .from("likes")
          .select("*", { count: "exact", head: true })
          .eq("post_id", id),
        supabaseAdmin
          .from("comments")
          .select("*", { count: "exact", head: true })
          .eq("post_id", id)
          .eq("deleted", false),
        viewer
          ? supabaseAdmin
              .from("likes")
              .select("*", { count: "exact", head: true })
              .eq("post_id", id)
              .eq("wallet", viewer)
          : Promise.resolve({ count: 0 }),
      ]);

    return json({
      ...typedDetails,
      like_count_value: likeCount ?? typedDetails.like_count,
      comment_count_value: commentCount ?? typedDetails.comment_count,
      has_liked: Boolean(likedResponse.count),
    });
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "Failed to load post",
    );
  }
}
