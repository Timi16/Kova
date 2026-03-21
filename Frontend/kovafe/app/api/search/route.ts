import { type NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { errorResponse, json } from "@/lib/server/api";

export async function GET(request: NextRequest) {
  try {
    const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";

    if (query.length < 2) {
      return json({ profiles: [], posts: [], collections: [] });
    }

    const pattern = `%${query}%`;

    const [profilesResponse, postsResponse, collectionsResponse] = await Promise.all([
      supabaseAdmin
        .from("profiles")
        .select("*")
        .ilike("username", pattern)
        .limit(10),
      supabaseAdmin
        .from("posts")
        .select("*")
        .ilike("title", pattern)
        .eq("deleted", false)
        .limit(10),
      supabaseAdmin
        .from("collections")
        .select("*")
        .ilike("name", pattern)
        .limit(10),
    ]);

    if (profilesResponse.error) throw profilesResponse.error;
    if (postsResponse.error) throw postsResponse.error;
    if (collectionsResponse.error) throw collectionsResponse.error;

    return json({
      profiles: profilesResponse.data ?? [],
      posts: postsResponse.data ?? [],
      collections: collectionsResponse.data ?? [],
    });
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "Search failed",
    );
  }
}
