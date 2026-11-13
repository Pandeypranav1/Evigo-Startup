import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { getAuthenticatedUser } from "@/lib/server";
import { isAuthorizedAdmin } from "@/lib/admin";

export const runtime = "nodejs";

async function authorizeAdmin() {
  const { user, error } = await getAuthenticatedUser();
  if (error) {
    console.warn("[admin/combo-bookings] Session verification failed:", error.code);
  }
  if (!user) {
    return NextResponse.json(
      { success: false, error: "A valid signed-in session is required." },
      { status: 401 }
    );
  }
  if (!isAuthorizedAdmin(user)) {
    return NextResponse.json(
      { success: false, error: "This account is not authorized to review combo bookings." },
      { status: 403 }
    );
  }
  return null;
}

export async function GET() {
  try {
    const authorizationResponse = await authorizeAdmin();
    if (authorizationResponse) return authorizationResponse;

    const supabase = createAdminClient();
    const { data: bookings, error } = await supabase
      .from("combo_bookings")
      .select("*, items:combo_booking_items(*)")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[GET /api/admin/combo-bookings] Error:", error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const allBookings = bookings || [];
    const summary = {
      total: allBookings.length,
      pending: allBookings.filter((b) => b.status === "pending").length,
      partially_confirmed: allBookings.filter((b) => b.status === "partially_confirmed").length,
      confirmed: allBookings.filter((b) => b.status === "confirmed").length,
      completed: allBookings.filter((b) => b.status === "completed").length,
      cancelled: allBookings.filter((b) => b.status === "cancelled").length,
      total_revenue: allBookings
        .filter((b) => b.status !== "cancelled" && b.status !== "rejected")
        .reduce((sum, b) => sum + Number(b.total_amount || 0), 0),
    };

    return NextResponse.json({
      success: true,
      bookings: allBookings,
      summary,
    });
  } catch (err: unknown) {
    console.error("[GET /api/admin/combo-bookings] Request failed:", err);
    return NextResponse.json(
      { success: false, error: "Unable to load combo bookings." },
      { status: 500 }
    );
  }
}
