import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { getAuthenticatedUser } from "@/lib/server";
import { isAuthorizedAdmin } from "@/lib/admin";
import { calculateComboPrice } from "@/lib/combo";

export const runtime = "nodejs";

async function authorizeAdmin() {
  const { user, error } = await getAuthenticatedUser();
  if (error) {
    console.warn("[admin/combo-packs] Session verification failed:", error.code);
  }
  if (!user) {
    return NextResponse.json(
      { success: false, error: "A valid signed-in session is required." },
      { status: 401 }
    );
  }
  if (!isAuthorizedAdmin(user)) {
    return NextResponse.json(
      { success: false, error: "This account is not authorized to manage combo packages." },
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
    const { data: packs, error } = await supabase
      .from("combo_packs")
      .select("*, items:combo_pack_items(*)")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[GET /api/admin/combo-packs] Query error:", error);
      return NextResponse.json(
        { success: false, error: "Unable to load combo packages." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      comboPacks: packs ?? [],
    });
  } catch (err: unknown) {
    console.error("[GET /api/admin/combo-packs] Request failed:", err);
    return NextResponse.json(
      { success: false, error: "Unable to load combo packages." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const authorizationResponse = await authorizeAdmin();
    if (authorizationResponse) return authorizationResponse;

    const body = await request.json();
    const {
      name,
      slug,
      description,
      category,
      image_url,
      base_price,
      discount = 0,
      city,
      duration,
      is_active = true,
      items = [],
    } = body;

    if (!name || !category) {
      return NextResponse.json(
        { success: false, error: "Name and Category are required" },
        { status: 400 }
      );
    }
    if (!Array.isArray(items)) {
      return NextResponse.json(
        { success: false, error: "Package items must be a list." },
        { status: 400 }
      );
    }

    const effectiveSlug =
      slug?.trim() ||
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

    const priceInfo = calculateComboPrice(base_price || 0, discount || 0);

    const supabase = createAdminClient();
    const { data: createdPack, error: packErr } = await supabase
      .from("combo_packs")
      .insert({
        name: name.trim(),
        slug: effectiveSlug,
        description: description?.trim() || null,
        category,
        image_url: image_url || "/partners/events/usha_nand/usha_nand_1.png",
        base_price: priceInfo.basePrice,
        discount: priceInfo.discount,
        final_price: priceInfo.finalPrice,
        city: city || "Jamui, Bihar",
        duration: duration || "1 Day",
        is_active: Boolean(is_active),
      })
      .select()
      .single();

    if (packErr) {
      console.error("[POST /api/admin/combo-packs] Insert error:", packErr);
      return NextResponse.json({ success: false, error: packErr.message }, { status: 500 });
    }

    // Insert items
    if (items && Array.isArray(items) && items.length > 0) {
      const itemsPayload = items.map((it: any) => ({
        combo_pack_id: createdPack.id,
        service_type: it.service_type || "Service",
        service_id: it.service_id || null,
        provider_id: it.provider_id || null,
        quantity: Math.max(1, Number(it.quantity) || 1),
        is_required: it.is_required !== false,
      }));

      const { error: itemsError } = await supabase
        .from("combo_pack_items")
        .insert(itemsPayload);
      if (itemsError) {
        console.error("[POST /api/admin/combo-packs] Item insert error:", itemsError);
        const { error: rollbackError } = await supabase
          .from("combo_packs")
          .delete()
          .eq("id", createdPack.id);
        if (rollbackError) {
          console.error("[POST /api/admin/combo-packs] Failed to roll back package:", rollbackError);
        }
        return NextResponse.json(
          {
            success: false,
            error: rollbackError
              ? "Package creation failed and the incomplete package could not be rolled back."
              : "Package services could not be saved; package creation was rolled back.",
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: "Combo package created successfully",
      comboPack: createdPack,
    });
  } catch (err: unknown) {
    console.error("[POST /api/admin/combo-packs] Request failed:", err);
    return NextResponse.json(
      { success: false, error: "Failed to create combo package." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const authorizationResponse = await authorizeAdmin();
    if (authorizationResponse) return authorizationResponse;

    const body = await request.json();
    const { id, is_active, base_price, discount, description, duration, city, name } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Package ID is required" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const updates: Record<string, any> = {};

    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (duration !== undefined) updates.duration = duration;
    if (city !== undefined) updates.city = city;
    if (is_active !== undefined) updates.is_active = Boolean(is_active);

    if (base_price !== undefined || discount !== undefined) {
      const { data: existing } = await supabase.from("combo_packs").select("base_price, discount").eq("id", id).maybeSingle();
      const bp = base_price !== undefined ? Number(base_price) : (existing?.base_price || 0);
      const disc = discount !== undefined ? Number(discount) : (existing?.discount || 0);
      const priceCalc = calculateComboPrice(bp, disc);
      updates.base_price = priceCalc.basePrice;
      updates.discount = priceCalc.discount;
      updates.final_price = priceCalc.finalPrice;
    }

    const { data: updated, error } = await supabase
      .from("combo_packs")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: "Combo package updated successfully",
      comboPack: updated,
    });
  } catch (err: unknown) {
    console.error("[PATCH /api/admin/combo-packs] Request failed:", err);
    return NextResponse.json(
      { success: false, error: "Failed to update combo package." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const authorizationResponse = await authorizeAdmin();
    if (authorizationResponse) return authorizationResponse;
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Package ID is required" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { error } = await supabase.from("combo_packs").delete().eq("id", id);
    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: "Combo package deleted successfully",
    });
  } catch (err: unknown) {
    console.error("[DELETE /api/admin/combo-packs] Request failed:", err);
    return NextResponse.json(
      { success: false, error: "Failed to delete combo package." },
      { status: 500 }
    );
  }
}
