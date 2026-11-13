import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { getAuthenticatedUser } from "@/lib/server";
import { calculateComboPrice } from "@/lib/combo";
import { createNotificationServer } from "@/lib/notifications";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { user } = await getAuthenticatedUser();

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

    const effectiveName =
      (typeof customer_name === "string" && customer_name.trim()) ||
      (typeof user?.user_metadata?.full_name === "string"
        ? user.user_metadata.full_name.trim()
        : "");
    const effectivePhone =
      (typeof customer_phone === "string" && customer_phone.trim()) ||
      user?.phone ||
      "";
    const effectiveEmail =
      (typeof user?.email === "string" && user.email) ||
      (typeof customer_email === "string" ? customer_email.trim() : "");
    const guests = Number(guest_count);
    const isValidDate = (value: unknown) => {
      if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
      const date = new Date(`${value}T00:00:00.000Z`);
      return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
    };

    if (
      !effectiveName ||
      !effectivePhone ||
      !isValidDate(start_date) ||
      start_date < new Date().toISOString().slice(0, 10)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "A valid name, phone number, and current or future start date are required.",
        },
        { status: 400 }
      );
    }
    if (
      !Number.isInteger(guests) ||
      guests < 1 ||
      guests > 50 ||
      (end_date && (!isValidDate(end_date) || end_date < start_date))
    ) {
      return NextResponse.json(
        { success: false, error: "Enter a valid guest count and date range." },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // 1. Fetch the combo pack details from DB or fallback
    let query = supabase.from("combo_packs").select("*, items:combo_pack_items(*)");
    if (combo_pack_id) {
      query = query.eq("id", combo_pack_id);
    } else if (slug) {
      query = query.eq("slug", slug);
    } else {
      return NextResponse.json(
        { success: false, error: "A combo package id or slug is required." },
        { status: 400 }
      );
    }

    const { data: pack, error: packError } = await query
      .eq("is_active", true)
      .maybeSingle();

    if (packError) {
      console.error("[POST /api/combo-packs/book] Package lookup error:", packError);
      return NextResponse.json(
        { success: false, error: "Unable to verify the selected combo package." },
        { status: 500 }
      );
    }
    if (!pack) {
      return NextResponse.json(
        { success: false, error: "Selected active combo package was not found." },
        { status: 404 }
      );
    }

    // 2. Fetch providers if assigned
    const priceInfo = calculateComboPrice(pack.base_price, pack.discount, guests);
    const rawItems = pack.items ?? [];

    const providerIds = [...new Set(rawItems.map((item: any) => item.provider_id as string).filter(Boolean))];
    let providersById = new Map<string, any>();
    if (providerIds.length > 0) {
      const { data: providers, error: providersError } = await supabase
        .from("providers")
        .select("id, user_id, business_name, registration_status, is_verified, is_bookable")
        .in("id", providerIds);
      if (!providersError && providers) {
        providersById = new Map(providers.map((provider) => [provider.id, provider]));
      }
    }

    // 3. Insert parent combo booking
    const parentPayload: Record<string, any> = {
      user_id: user?.id || null,
      combo_pack_id: pack.id,
      combo_name: pack.name,
      total_amount: priceInfo.finalPrice,
      booking_date: new Date().toISOString().split("T")[0],
      start_date: start_date || null,
      end_date: end_date || start_date || null,
      guest_count: guests,
      pickup_location: pickup_location || null,
      drop_location: drop_location || null,
      customer_name: effectiveName,
      customer_phone: effectivePhone,
      customer_email: effectiveEmail || null,
      special_requests: special_requests || null,
      status: "pending",
    };

    const { data: parentBooking, error: parentError } = await supabase
      .from("combo_bookings")
      .insert(parentPayload)
      .select()
      .single();

    if (parentError) {
      console.error("[POST /api/combo-packs/book] Insert parent error:", parentError);
      return NextResponse.json(
        { success: false, error: parentError.message },
        { status: 500 }
      );
    }

    // 4. Insert child booking items
    const itemPriceSnapshot = Math.round(priceInfo.finalPrice / Math.max(1, rawItems.length));
    const childItemsPayload = rawItems.map((it: any) => ({
      combo_booking_id: parentBooking.id,
      service_type: it.service_type,
      service_id: it.service_id || null,
      provider_id: it.provider_id,
      provider_name: providersById.get(it.provider_id)?.business_name || null,
      provider_booking_status: "pending",
      service_status: "pending",
      price_snapshot: itemPriceSnapshot,
    }));

    let createdItems: any[] = [];
    if (childItemsPayload.length > 0) {
      const { data, error: itemsError } = await supabase
        .from("combo_booking_items")
        .insert(childItemsPayload)
        .select();

      if (itemsError) {
        console.error("[POST /api/combo-packs/book] Child items error:", itemsError);
        const { error: rollbackError } = await supabase
          .from("combo_bookings")
          .delete()
          .eq("id", parentBooking.id);
        if (rollbackError) {
          console.error("[POST /api/combo-packs/book] Failed to roll back parent booking:", rollbackError);
        }
        return NextResponse.json(
          {
            success: false,
            error: rollbackError
              ? "Combo booking services could not be saved and the incomplete booking could not be rolled back."
              : "Combo booking services could not be saved; the incomplete booking was rolled back.",
          },
          { status: 500 }
        );
      }
      createdItems = data || [];
    }

    // 5. Notify assigned providers via public.notifications (Realtime triggers automatically)
    try {
      const assignedProviderIds = Array.from(
        new Set(
          childItemsPayload
            .map((it: { provider_id?: string | null }) => it.provider_id)
            .filter((id: string | null | undefined): id is string => Boolean(id))
        )
      );

      for (const provId of assignedProviderIds) {
        const providerUserId = providersById.get(provId as string)?.user_id;
        if (providerUserId) {
          await createNotificationServer({
            userId: providerUserId,
            bookingId: parentBooking.id,
            title: `🎁 New Combo Request: ${pack.name}`,
            message: `New booking for "${pack.name}" on ${start_date}.\nCustomer: ${effectiveName} (${effectivePhone})\nGuests: ${guests}\nAmount: ₹${priceInfo.finalPrice}`,
            type: "booking_new",
            dedupeKey: `combo_booking_new:${parentBooking.id}:${providerUserId}`,
          });
        }
      }
    } catch (notifyErr) {
      console.warn("[POST /api/combo-packs/book] Notification warning:", notifyErr);
    }

    return NextResponse.json(
      {
        success: true,
        message: "Combo package booking request created.",
        booking: {
          ...parentBooking,
          items: createdItems || childItemsPayload,
        },
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("[POST /api/combo-packs/book] Unexpected error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to complete combo booking" },
      { status: 500 }
    );
  }
}
