import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { authorizeAccountAdmin } from "@/lib/account-security";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const authorization = await authorizeAccountAdmin();
    if ("response" in authorization) return authorization.response;

    const supabase = createAdminClient();
    const { data: bookings, error } = await supabase
      .from("combo_bookings")
      .select("*, items:combo_booking_items(*)")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[GET /api/admin/combo-bookings] Error:", error);
      return NextResponse.json({ success: false, error: "Unable to complete this request. Please try again." }, { status: 500 });
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
  } catch (err: any) {
    const isAuth = err?.message?.includes("Unauthorized");
    return NextResponse.json(
      { success: false, error: "Unable to complete this request. Please try again." },
      { status: isAuth ? 403 : 500 }
    );
  }
}
