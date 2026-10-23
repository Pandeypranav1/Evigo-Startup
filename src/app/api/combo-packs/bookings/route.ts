import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { getAuthenticatedUser } from "@/lib/server";
import { calculateOverallComboStatus } from "@/lib/combo";
import { createNotificationServer } from "@/lib/notifications";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { user } = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role");
    const userIdParam = searchParams.get("user_id");
    const supabase = createAdminClient();

    // ── 1. Provider Mode: Fetch only assigned combo items ──
    if (role === "provider" || (userIdParam && userIdParam === user.id && role !== "client")) {
      const { data: myProviders, error: pErr } = await supabase
        .from("providers")
        .select("id, business_name")
        .eq("user_id", user.id);

      if (pErr) throw pErr;

      const ownedProviderIds = (myProviders || []).map((p) => p.id);
      if (ownedProviderIds.length === 0) {
        return NextResponse.json({ success: true, items: [] });
      }

      const { data: items, error: iErr } = await supabase
        .from("combo_booking_items")
        .select("*, combo_booking:combo_bookings(*)")
        .in("provider_id", ownedProviderIds)
        .order("created_at", { ascending: false });

      if (iErr) {
        console.error("[GET /api/combo-packs/bookings (provider)] Error:", iErr);
        return NextResponse.json({ success: false, error: "Unable to complete this request. Please try again." }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        items: items || [],
      });
    }

    // ── 2. Client Mode: Fetch user's combo bookings with items ──
    const { data: bookings, error: bErr } = await supabase
      .from("combo_bookings")
      .select("*, items:combo_booking_items(*)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (bErr) {
      console.error("[GET /api/combo-packs/bookings (client)] Error:", bErr);
      return NextResponse.json({ success: false, error: "Unable to complete this request. Please try again." }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      bookings: bookings || [],
    });
  } catch (err: any) {
    console.error("[GET /api/combo-packs/bookings] Error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to fetch combo bookings" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const { user } = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    const body = await request.json();
    const action = body.action || (body.status === "cancelled" ? "cancel" : null);
    if (!["cancel", "accept", "confirm", "reject", "complete"].includes(action) ||
        (action === "cancel" ? !body.booking_id : !body.item_id) ||
        (action === "reject" && (typeof body.rejection_reason !== "string" || !body.rejection_reason.trim() || body.rejection_reason.length > 2000))) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    const { data, error } = await createAdminClient().rpc("transition_combo_request", {
      p_user: user.id, p_booking: body.booking_id || null, p_item: body.item_id || null,
      p_action: action, p_reason: body.rejection_reason || null,
    });
    if (error) return NextResponse.json({ error: "Request not permitted or already updated" }, { status: 409 });
    return NextResponse.json({ success: true, parentStatus: data });
  } catch {
    return NextResponse.json({ error: "Unable to update request" }, { status: 503 });
  }
}
