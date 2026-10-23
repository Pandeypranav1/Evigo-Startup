import { comboComponentsAvailable } from "@/lib/combo-eligibility";
import { validBookingDate } from "@/lib/booking-workflow";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { DEFAULT_COMBO_PACKS, calculateComboPrice } from "@/lib/combo";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { combo_pack_id, slug, guest_count = 1 } = body;

    if (!combo_pack_id && !slug) {
      return NextResponse.json(
        { success: false, error: "combo_pack_id or slug is required" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    let query = supabase.from("combo_packs").select("*, items:combo_pack_items(*)");

    if (combo_pack_id) {
      query = query.eq("id", combo_pack_id);
    } else {
      query = query.eq("slug", slug);
    }

    const { data: dbPack, error } = await query.maybeSingle();

    if (error) throw error;
    const pack = dbPack;

    if (!pack) {
      return NextResponse.json(
        { success: false, error: "Combo pack not found" },
        { status: 404 }
      );
    }

    if (!Number.isInteger(Number(guest_count)) || Number(guest_count) < 1 || Number(guest_count) > 10000) return NextResponse.json({ error: "Invalid guest count" }, { status: 400 });
    if (!pack.is_active || !await comboComponentsAvailable(supabase, pack.items)) return NextResponse.json({ error: "Package services unavailable" }, { status: 409 });
    const guests = Number(guest_count);
    const priceCalculation = calculateComboPrice(
      pack.base_price,
      pack.discount,
      guests
    );

    return NextResponse.json({
      success: true,
      combo_pack_id: pack.id,
      combo_name: pack.name,
      base_price: priceCalculation.basePrice,
      discount: priceCalculation.discount,
      final_price: priceCalculation.finalPrice,
      guest_count: guests,
      items: pack.items || [],
    });
  } catch (err: any) {
    console.error("[POST /api/combo-packs/price] Error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to calculate combo price" },
      { status: 500 }
    );
  }
}
