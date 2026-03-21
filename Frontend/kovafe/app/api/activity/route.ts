import { type NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { errorResponse, json, parseCursor, parseLimit } from "@/lib/server/api";
import { fetchActivitiesWithProfiles, nextCursor } from "@/lib/server/queries";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cursor = parseCursor(searchParams.get("cursor"));
    const limit = parseLimit(searchParams.get("limit"));
    const type = searchParams.get("type");

    let query = supabaseAdmin
      .from("activity")
      .select("*")
      .order("created_at", { ascending: false })
      .range(cursor, cursor + limit - 1);

    if (type) {
      query = query.eq("event_type", type);
    }

    const { data, error } = await query;
    if (error) throw error;

    const activity = await fetchActivitiesWithProfiles(data ?? []);

    return json({
      activity,
      nextCursor: nextCursor(activity, cursor, limit),
    });
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "Failed to load activity",
    );
  }
}
