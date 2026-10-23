import { comboComponentsAvailable } from "@/lib/combo-eligibility";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { authorizeAccountAdmin } from "@/lib/account-security";
import { calculateComboPrice } from "@/lib/combo";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const authorization = await authorizeAccountAdmin();
    if ("response" in authorization) return authorization.response;

    const supabase = createAdminClient();
    const { data: packs, error } = await supabase
      .from("combo_packs")
      .select("*, items:combo_pack_items(*)")
      .order("created_at", { ascending: false });

    if (error) throw error;


    return NextResponse.json({
      success: true,
      comboPacks: packs,
    });
  } catch (err: any) {
    const isAuth = err?.message?.includes("Unauthorized");
    return NextResponse.json(
      { success: false, error: "Unable to complete this request. Please try again." },
      { status: isAuth ? 403 : 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const authorization = await authorizeAccountAdmin();
    if ("response" in authorization) return authorization.response;

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

    if (typeof name !== "string" || !name.trim() || !category) {
      return NextResponse.json(
        { success: false, error: "Name and Category are required" },
        { status: 400 }
      );
    }

    if (!Number.isFinite(Number(base_price)) || Number(base_price) < 0 || !Number.isFinite(Number(discount)) || Number(discount) < 0 || Number(discount) > Number(base_price)) {
      return NextResponse.json({ success: false, error: "Use a nonnegative price and a discount no greater than the price" }, { status: 400 });
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
        is_active: false, // Publish only after the assigned components have been checked.
      })
      .select()
      .single();

    if (packErr) {
      console.error("[POST /api/admin/combo-packs] Insert error:", packErr);
      return NextResponse.json({ success: false, error: "Unable to complete this request. Please try again." }, { status: 500 });
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

      const { error: itemError } = await supabase.from("combo_pack_items").insert(itemsPayload);
      if (itemError) {
        const { error: cleanupError } = await supabase.from("combo_packs").delete().eq("id", createdPack.id).eq("is_active", false);
        if (cleanupError) {
          return NextResponse.json({ success: false, error: "Package services could not be saved. Remove the inactive draft from Manage Packages before retrying." }, { status: 500 });
        }
        throw itemError;
      }
    }

    return NextResponse.json({
      success: true,
      message: "Combo package created successfully",
      comboPack: createdPack,
    });
  } catch (err: any) {
    const isAuth = err?.message?.includes("Unauthorized");
    return NextResponse.json(
      { success: false, error: "Unable to complete this request. Please try again." },
      { status: isAuth ? 403 : 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const authorization = await authorizeAccountAdmin();
    if ("response" in authorization) return authorization.response;

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
    if (is_active !== undefined) {
      if (typeof is_active !== "boolean") return NextResponse.json({ error: "Invalid availability" }, { status: 400 });
      if (is_active) {
        const { data: pack, error } = await supabase.from("combo_packs").select("items:combo_pack_items(*)").eq("id", id).single();
        if (error) throw error;
        if (!await comboComponentsAvailable(supabase, pack.items)) return NextResponse.json({ error: "Assign eligible services before publishing" }, { status: 409 });
      }
      updates.is_active = is_active;
    }

    if (base_price !== undefined || discount !== undefined) {
      const { data: existing, error: existingError } = await supabase.from("combo_packs").select("base_price, discount").eq("id", id).maybeSingle();
      if (existingError) throw existingError;
      if (!existing) return NextResponse.json({ error: "Package not found" }, { status: 404 });
      const bp = base_price !== undefined ? Number(base_price) : (existing?.base_price || 0);
      const disc = discount !== undefined ? Number(discount) : (existing?.discount || 0);
      if (!Number.isFinite(bp) || !Number.isFinite(disc) || bp < 0 || disc < 0 || disc > bp) {
        return NextResponse.json({ error: "Use a nonnegative price and a discount no greater than the price" }, { status: 400 });
      }
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
  } catch (err: any) {
    const isAuth = err?.message?.includes("Unauthorized");
    return NextResponse.json(
      { success: false, error: "Unable to complete this request. Please try again." },
      { status: isAuth ? 403 : 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const authorization = await authorizeAccountAdmin();
    if ("response" in authorization) return authorization.response;
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
  } catch (err: any) {
    const isAuth = err?.message?.includes("Unauthorized");
    return NextResponse.json(
      { success: false, error: "Unable to complete this request. Please try again." },
      { status: isAuth ? 403 : 500 }
    );
  }
}
