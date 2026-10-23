import { consumeRequestLimit, requestIdentity } from "@/lib/request-limit";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { headers } from "next/headers";

export const runtime = "nodejs";

/**
 * POST /api/track-visit
 * Body: { session_id, page_path, page_title?, referrer?, device_type?, user_phone? }
 *
 * Records a page visit in the Supabase `page_visits` table.
 * Uses the service-role key so it works regardless of RLS policies.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      session_id,
      page_path,
      page_title = null,
      referrer = null,
      device_type = null,
      user_phone = null,
    } = body;

    if (typeof session_id !== "string" || session_id.length > 100 || typeof page_path !== "string" || !page_path.startsWith("/") || page_path.length > 300) {
      return NextResponse.json(
        { error: "session_id and page_path are required" },
        { status: 400 }
      );
    }

    if (!await consumeRequestLimit("analytics", requestIdentity(request), 120, 3600)) return NextResponse.json({ error: "Rate limit reached" }, { status: 429 });

    // Extract IP and User-Agent from request headers
    const headersList = await headers();
    const ip =
      headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      headersList.get("x-real-ip") ||
      null;
    const user_agent = headersList.get("user-agent") || null;

    const supabase = createAdminClient();

    const { error } = await supabase.from("page_visits").insert({
      session_id,
      page_path: page_path.split("?")[0],
      page_title: typeof page_title === "string" ? page_title.slice(0, 200) : null,
      device_type: ["mobile", "tablet", "desktop"].includes(device_type) ? device_type : null,
    });

    if (error) {
      console.error("[track-visit] Supabase insert error:", error);
      return NextResponse.json(
        { error: "Failed to record visit" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error("[track-visit] Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * GET /api/track-visit
 * Returns the total visit count (public metric).
 */
export async function GET() {
  try {
    const supabase = createAdminClient();

    const { count, error } = await supabase
      .from("page_visits")
      .select("id", { count: "exact", head: true });

    if (error) throw error;

    return NextResponse.json({ total_visits: count ?? 0 });
  } catch (err: unknown) {
    console.error("[track-visit] GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
