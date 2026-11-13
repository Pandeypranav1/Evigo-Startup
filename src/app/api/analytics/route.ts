import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { getAuthenticatedUser } from "@/lib/server";
import { isAuthorizedAdmin } from "@/lib/admin";

export const runtime = "nodejs";

/**
 * GET /api/analytics
 * Returns aggregate visit analytics for the admin dashboard.
 * Protected: only use from authenticated admin UI.
 *
 * Query params:
 *   ?days=7  (default 30)
 */
export async function GET(request: Request) {
  try {
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError) {
      console.warn("[analytics] Session verification failed:", authError.code);
    }
    if (!user) {
      return NextResponse.json(
        { success: false, error: "A valid signed-in session is required.", code: "AUTHENTICATION_REQUIRED" },
        { status: 401 }
      );
    }
    if (!isAuthorizedAdmin(user)) {
      return NextResponse.json(
        { success: false, error: "This account is not authorized to view analytics.", code: "ADMIN_REQUIRED" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") ?? "30", 10);
    const supabase = createAdminClient();
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    // ── Total visits in period ──
    const { count: totalVisits, error: totalVisitsError } = await supabase
      .from("page_visits")
      .select("id", { count: "exact", head: true })
      .gte("created_at", since);
    if (totalVisitsError) throw totalVisitsError;

    // ── Unique sessions (= unique visitors approximation) ──
    const { data: sessionData, error: sessionsError } = await supabase
      .from("page_visits")
      .select("session_id")
      .gte("created_at", since);
    if (sessionsError) throw sessionsError;

    const uniqueSessions = new Set(sessionData?.map((r) => r.session_id) ?? []).size;

    // ── Top pages ──
    const { data: topPagesRaw, error: topPagesError } = await supabase
      .from("page_visits")
      .select("page_path")
      .gte("created_at", since);
    if (topPagesError) throw topPagesError;

    const pageCounts: Record<string, number> = {};
    for (const row of topPagesRaw ?? []) {
      pageCounts[row.page_path] = (pageCounts[row.page_path] ?? 0) + 1;
    }
    const topPages = Object.entries(pageCounts)
      .map(([path, count]) => ({ path, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // ── Device breakdown ──
    const { data: deviceRaw, error: deviceError } = await supabase
      .from("page_visits")
      .select("device_type")
      .gte("created_at", since);
    if (deviceError) throw deviceError;

    const deviceCounts: Record<string, number> = { mobile: 0, tablet: 0, desktop: 0, unknown: 0 };
    for (const row of deviceRaw ?? []) {
      const key = row.device_type ?? "unknown";
      deviceCounts[key] = (deviceCounts[key] ?? 0) + 1;
    }

    // ── Total registered users ──
    const { count: totalUsers, error: totalUsersError } = await supabase
      .from("users")
      .select("id", { count: "exact", head: true });
    if (totalUsersError) throw totalUsersError;

    // ── New users in period ──
    const { count: newUsers, error: newUsersError } = await supabase
      .from("users")
      .select("id", { count: "exact", head: true })
      .gte("created_at", since);
    if (newUsersError) throw newUsersError;

    // ── Users by role ──
    const { data: roleData, error: roleError } = await supabase
      .from("users")
      .select("role");
    if (roleError) throw roleError;

    const roleCounts: Record<string, number> = { client: 0, provider: 0 };
    for (const row of roleData ?? []) {
      roleCounts[row.role] = (roleCounts[row.role] ?? 0) + 1;
    }

    return NextResponse.json({
      period_days: days,
      visits: {
        total: totalVisits ?? 0,
        unique_sessions: uniqueSessions,
        top_pages: topPages,
        by_device: deviceCounts,
      },
      users: {
        total: totalUsers ?? 0,
        new_in_period: newUsers ?? 0,
        by_role: roleCounts,
      },
    });
  } catch (err: unknown) {
    console.error("[analytics] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
