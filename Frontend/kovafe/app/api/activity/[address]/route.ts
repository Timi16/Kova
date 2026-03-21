import { type NextRequest } from "next/server";
import { normalizeAddress } from "@/lib/format";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { errorResponse, json } from "@/lib/server/api";
import { fetchActivitiesWithProfiles } from "@/lib/server/queries";

type Context = {
  params: Promise<{ address: string }>;
};

export async function GET(_: NextRequest, context: Context) {
  try {
    const { address } = await context.params;
    const wallet = normalizeAddress(address);

    const { data, error } = await supabaseAdmin
      .from("activity")
      .select("*")
      .or(`actor.eq.${wallet},target.eq.${wallet}`)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw error;

    return json({
      activity: await fetchActivitiesWithProfiles(data ?? []),
    });
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "Failed to load wallet activity",
    );
  }
}
