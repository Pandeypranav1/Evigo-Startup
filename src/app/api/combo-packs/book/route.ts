import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { getAuthenticatedUser } from "@/lib/server";
import { validBookingDate } from "@/lib/booking-workflow";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { user } = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: "Sign in before requesting a combo" }, { status: 401 });

    const {
      combo_pack_id,
      slug,
      start_date,
      end_date,
      guest_count = 1,
      pickup_location,
      drop_location,
      customer_name,
      customer_phone,
      customer_email,
      special_requests,
    } = body;

    const effectiveName = (typeof customer_name === "string" ? customer_name.trim() : "") || user?.user_metadata?.full_name || "Customer";
    const effectivePhone = (typeof customer_phone === "string" ? customer_phone.trim() : "") || user?.phone || "";
    const guests = Math.max(1, Number(guest_count) || 1);

    if (!effectiveName || effectiveName.length > 150 || !/^[+\d ()-]{10,20}$/.test(effectivePhone) ||
        !/^\d{10,15}$/.test(effectivePhone.replace(/\D/g, "")) || !start_date ||
        [pickup_location, drop_location].some((value) => value != null && (typeof value !== "string" || value.length > 500)) ||
        (special_requests != null && (typeof special_requests !== "string" || special_requests.length > 2000))) {
      return NextResponse.json(
        {
          success: false,
          error: "Required booking details (Name, Phone, and Start Date) are missing.",
        },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    if (!validBookingDate(start_date) || !validBookingDate(end_date || start_date) || (end_date && end_date < start_date) ||
        !Number.isInteger(Number(guest_count)) || Number(guest_count) < 1 || Number(guest_count) > 10000 || (!combo_pack_id && !slug)) {
      return NextResponse.json({ error: "Invalid package, dates or guest count" }, { status: 400 });
    }
    const query = supabase.from("combo_packs").select("id").eq("is_active", true);
    const { data: pack, error: packError } = await (combo_pack_id ? query.eq("id", combo_pack_id) : query.eq("slug", slug)).maybeSingle();
    if (packError) throw packError;
    if (!pack) return NextResponse.json({ error: "Package not found" }, { status: 404 });
    const { data: booking, error } = await supabase.rpc("create_combo_request", {
      p_user: user.id, p_pack: pack.id, p_details: { start_date, end_date: end_date || start_date,
        guest_count: guests, pickup_location, drop_location, customer_name: effectiveName,
        customer_phone: effectivePhone, customer_email: user.email, special_requests },
    });
    if (error?.code === "23505") return NextResponse.json({ success: false, error: "You already have an active request for this package and start date with different details. Review or cancel that request before submitting a replacement." }, { status: 409 });
    if (error) throw error;
    return NextResponse.json({ success: true, message: "Combo request saved; awaiting provider confirmation", booking }, { status: 201 });
  } catch (error) {
    console.error("[combo request] Unable to save request", error);
    return NextResponse.json({ success: false, error: "Unable to save this package request. Its services may be unavailable." }, { status: 503 });
  }
}
