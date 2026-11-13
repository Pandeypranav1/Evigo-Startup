import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { dispatchEmailNotification, createNotificationServer } from "@/lib/notifications";
import { getAuthenticatedUser } from "@/lib/server";
import {
  authorizeBookingStatusUpdate,
  isBookingStatusUpdate,
} from "@/lib/booking-workflow";

const FAABCAB_PROVIDER_UUID = "6105241d-1d38-4274-b912-eea67f4c32b0";

const FAABCAB_SERVICE_MAP: Record<string, string> = {
  "inter-city": "414956e0-95ad-4740-9914-4333c3be21e0",
  "Inter-city One Way / Round Trip": "414956e0-95ad-4740-9914-4333c3be21e0",
  "local-rental": "b72bf79e-3b1d-4af6-b326-a0f7940f1901",
  "Local Hourly Rental": "b72bf79e-3b1d-4af6-b326-a0f7940f1901",
  "airport-transfer": "9303c9f1-3e06-4c6e-bfdc-9423c681e03b",
  "Airport Transfer": "9303c9f1-3e06-4c6e-bfdc-9423c681e03b",
  "railway-pickup": "6d2f50bd-6183-4b6e-8ca4-8e34a5c1fd26",
  "Railway Pickup & Drop": "6d2f50bd-6183-4b6e-8ca4-8e34a5c1fd26",
};

const STATIC_VERIFIED_PARTNERS: Record<string, { name: string; city: string }> = {
  "usha-nand-palace": { name: "Hotel Usha Nand Palace", city: "Jamui, Bihar" },
  "genx-brij": { name: "GenX Brij", city: "Jamui, Bihar" },
  "hotel-jp-grand": { name: "Hotel JP Grand", city: "Jamui, Bihar" },
  "hotel-nirmala-inn": { name: "Hotel Nirmala Inn", city: "Jamui, Bihar" },
  "shagun-vatika": { name: "Shagun Vatika", city: "Jamui, Bihar" },
  "faab-cab": { name: "FaabCab", city: "Jamui, Bihar" },
};

function isTestProvider(name?: string | null, desc?: string | null): boolean {
  const content = `${name ?? ""} ${desc ?? ""}`;
  return /\b(?:test|demo|sample|placeholder)\s+(?:venue|provider|listing|account|business|data|record|catering|photo|studio|caterer)\b/i.test(content) ||
    /^(?:test\b)/i.test(name?.trim() ?? "");
}

function isValidUuid(value: unknown): value is string {
  if (typeof value !== "string") return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

function isValidBookingDate(value: unknown): value is string {
  if (typeof value !== "string" || !value.trim()) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return date.toISOString().slice(0, 10) === value;
  }
  return true;
}

async function getAccountRole(
  supabase: ReturnType<typeof createAdminClient>,
  userId: string
) {
  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  return data?.role ?? null;
}

async function findActiveBooking(
  supabase: ReturnType<typeof createAdminClient>,
  {
    clientId,
    customerPhone,
    providerUuid,
    providerId,
    serviceType,
    serviceId,
    bookingDate,
    bookingTime,
  }: {
    clientId?: string | null;
    customerPhone?: string | null;
    providerUuid?: string | null;
    providerId?: string | null;
    serviceType: string;
    serviceId?: string | null;
    bookingDate: string;
    bookingTime: string | null;
  }
) {
  const findByDateColumn = async (column: "event_date" | "travel_date") => {
    let query = supabase
      .from("bookings")
      .select("*")
      .eq("service_type", serviceType)
      .eq(column, bookingDate)
      .in("status", ["pending", "confirmed", "accepted"])
      .order("created_at", { ascending: false });

    if (clientId) {
      query = query.eq("client_id", clientId);
    } else if (customerPhone) {
      query = query.eq("customer_phone", customerPhone);
    }

    if (providerUuid) {
      query = query.eq("provider_uuid", providerUuid);
    } else if (providerId) {
      query = query.eq("provider_id", providerId);
    }

    const { data, error } = await query;
    if (error) return { data: null, error };
    const matchingBooking = (data || []).find((booking) => {
      const existingTime = booking.event_time?.trim() || booking.pickup_time?.trim() || null;
      return (
        (!serviceId || booking.service_id === serviceId || booking.service_id === null) &&
        (!bookingTime || existingTime === bookingTime)
      );
    });
    return { data: matchingBooking || null, error: null };
  };

  const eventDateResult = await findByDateColumn("event_date");
  if (eventDateResult.error || eventDateResult.data) return eventDateResult;
  return findByDateColumn("travel_date");
}

export async function GET(request: Request) {
  try {
    const { user } = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get("provider_id");
    const providerUuid = searchParams.get("provider_uuid");
    const clientId = searchParams.get("client_id");
    const userId = searchParams.get("user_id");
    const role = searchParams.get("role");
    const email = searchParams.get("email");
    const supabase = createAdminClient();
    const accountRole = await getAccountRole(supabase, user.id);
    const isProviderRequest = role === "provider" || !!providerId || !!providerUuid || !!userId;

    if (isProviderRequest) {
      if (accountRole !== "provider") {
        return NextResponse.json({ success: false, error: "Provider account required" }, { status: 403 });
      }
      if (userId && userId !== user.id) {
        return NextResponse.json({ success: false, error: "Not authorized to view these bookings" }, { status: 403 });
      }
      if (clientId || email) {
        return NextResponse.json({ success: false, error: "Invalid provider booking query" }, { status: 400 });
      }
      if (
        (providerUuid && !isValidUuid(providerUuid)) ||
        (providerId && providerId !== "faab-cab" && !isValidUuid(providerId))
      ) {
        return NextResponse.json({ success: false, error: "Invalid provider listing" }, { status: 400 });
      }

      const { data: myProviders, error: providersError } = await supabase
        .from("providers")
        .select("id")
        .eq("user_id", user.id);
      if (providersError) throw providersError;

      const ownedProviderIds = (myProviders || []).map((provider) => provider.id);
      const requestedProviderUuid =
        providerUuid ||
        (isValidUuid(providerId)
          ? providerId
          : providerId === "faab-cab"
            ? FAABCAB_PROVIDER_UUID
            : null);
      if (requestedProviderUuid && !ownedProviderIds.includes(requestedProviderUuid)) {
        return NextResponse.json({ success: false, error: "Not authorized to view these bookings" }, { status: 403 });
      }

      const isFaabCab = providerId === "faab-cab" || providerId === FAABCAB_PROVIDER_UUID;
      if (
        (isFaabCab || providerUuid === FAABCAB_PROVIDER_UUID) &&
        !ownedProviderIds.includes(FAABCAB_PROVIDER_UUID)
      ) {
        return NextResponse.json({ success: false, error: "Not authorized to view FaabCab bookings" }, { status: 403 });
      }

      const providerIds = requestedProviderUuid ? [requestedProviderUuid] : ownedProviderIds;
      if (providerIds.length === 0) {
        return NextResponse.json({ success: true, bookings: [] });
      }
      let query = supabase.from("bookings").select("*").order("created_at", { ascending: false });
      if (isFaabCab) {
        query = query.or(`provider_id.eq.faab-cab,provider_uuid.in.(${providerIds.join(",")})`);
      } else {
        query = query.in("provider_uuid", providerIds);
      }

      const { data, error } = await query;
      if (error) {
        console.error("[GET /api/bookings] Provider booking lookup error:", error);
        return NextResponse.json({ success: false, error: "Unable to load provider bookings" }, { status: 500 });
      }
      return NextResponse.json({ success: true, bookings: data || [] });
    }

    if (accountRole !== "client") {
      return NextResponse.json({ success: false, error: "Customer account required" }, { status: 403 });
    }
    if (providerId || providerUuid || role === "provider" || userId) {
      return NextResponse.json({ success: false, error: "Invalid customer booking query" }, { status: 400 });
    }

    if (clientId && clientId !== user.id) {
      return NextResponse.json({ success: false, error: "Not authorized to view these bookings" }, { status: 403 });
    }
    if (email && email.toLowerCase() !== (user.email || "").toLowerCase()) {
      return NextResponse.json({ success: false, error: "Not authorized to view these bookings" }, { status: 403 });
    }

    let data: Record<string, any>[] = [];
    if (email) {
      const [ownedResult, legacyResult] = await Promise.all([
        supabase
          .from("bookings")
          .select("*")
          .eq("client_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("bookings")
          .select("*")
          .is("client_id", null)
          .eq("customer_email", user.email)
          .order("created_at", { ascending: false }),
      ]);
      const bookingError = ownedResult.error || legacyResult.error;
      if (bookingError) {
        console.error("[GET /api/bookings] Customer booking lookup error:", bookingError);
        return NextResponse.json({ success: false, error: "Unable to load customer bookings" }, { status: 500 });
      }
      data = [...(ownedResult.data || []), ...(legacyResult.data || [])].sort(
        (a, b) => Date.parse(b.created_at) - Date.parse(a.created_at)
      );
    } else {
      const { data: ownBookings, error } = await supabase
        .from("bookings")
        .select("*")
        .eq("client_id", user.id)
        .order("created_at", { ascending: false });
      if (error) {
        console.error("[GET /api/bookings] Customer booking lookup error:", error);
        return NextResponse.json({ success: false, error: "Unable to load customer bookings" }, { status: 500 });
      }
      data = ownBookings || [];
    }

    return NextResponse.json({ success: true, bookings: data });
  } catch (err: any) {
    console.error("[GET /api/bookings] Error:", err);
    return NextResponse.json({ success: false, error: "Database error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    let body: Record<string, any>;
    try {
      const requestBody = await request.json();
      if (!requestBody || typeof requestBody !== "object" || Array.isArray(requestBody)) {
        return NextResponse.json({ success: false, error: "Invalid JSON request body" }, { status: 400 });
      }
      body = requestBody;
    } catch {
      return NextResponse.json({ success: false, error: "Invalid JSON request body" }, { status: 400 });
    }

    const { user } = await getAuthenticatedUser();
    const supabase = createAdminClient();
    if (user) {
      const accountRole = await getAccountRole(supabase, user.id);
      if (accountRole === "provider") {
        return NextResponse.json({ success: false, error: "Provider accounts cannot book services" }, { status: 403 });
      }
    }

    const {
      client_id,
      provider_id,
      provider_uuid,
      service_id,
      service_type,
      provider_name,
      event_date,
      event_time,
      guest_count,
      customer_name,
      customer_phone,
      customer_email,
      city,
      message,
      // Transport specific fields
      pickup_location,
      drop_location,
      travel_date,
      pickup_time,
      passenger_count,
      transport_service,
      special_request,
    } = body;

    if (client_id && (!user || client_id !== user.id)) {
      return NextResponse.json({ success: false, error: "The signed-in user does not match this booking" }, { status: 403 });
    }

    const isTransport = service_type === "Transport" || !!transport_service || !!pickup_location;
    const effectiveCustomerName = typeof customer_name === "string" ? customer_name.trim() : "";
    const effectiveCustomerPhone = typeof customer_phone === "string" ? customer_phone.trim() : "";
    const effectiveCustomerEmail = typeof customer_email === "string" ? customer_email.trim() : "";
    const effectiveServiceType =
      typeof service_type === "string" && service_type.trim()
        ? service_type.trim()
        : typeof transport_service === "string"
          ? transport_service.trim()
          : "";
    const effectiveEventDate = event_date || travel_date || null;
    const rawEventTime = event_time ?? pickup_time;
    const effectiveEventTime =
      typeof rawEventTime === "string" ? rawEventTime.trim() || null : null;
    const rawGuestCount = guest_count ?? passenger_count;
    const effectiveGuestCount =
      rawGuestCount === undefined || rawGuestCount === null || rawGuestCount === ""
        ? null
        : Number(rawGuestCount);

    if (
      !effectiveCustomerName ||
      !effectiveCustomerPhone ||
      !effectiveServiceType ||
      !isValidBookingDate(effectiveEventDate) ||
      (rawEventTime !== undefined && rawEventTime !== null && typeof rawEventTime !== "string") ||
      (effectiveGuestCount !== null &&
        (!Number.isInteger(effectiveGuestCount) || effectiveGuestCount < 1))
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Required booking details (Name, Phone, Service, Date) are missing.",
        },
        { status: 400 }
      );
    }

    const requestedProviderId = typeof provider_id === "string" ? provider_id.trim().toLowerCase() : "";
    const requestedProviderUuid = typeof provider_uuid === "string" ? provider_uuid.trim().toLowerCase() : "";
    const isStaticPartner = requestedProviderId in STATIC_VERIFIED_PARTNERS;
    const isFaabCabProvider =
      requestedProviderId === "faab-cab" ||
      requestedProviderUuid === FAABCAB_PROVIDER_UUID;

    let sanitizedProviderUuid: string | null = null;
    let effectiveProviderId: string;
    let effectiveProviderName: string;
    let providerCity: string | null = null;

    if (isStaticPartner) {
      effectiveProviderId = requestedProviderId;
      effectiveProviderName = typeof provider_name === "string" && provider_name.trim()
        ? provider_name.trim()
        : STATIC_VERIFIED_PARTNERS[requestedProviderId].name;
      sanitizedProviderUuid = isFaabCabProvider ? FAABCAB_PROVIDER_UUID : null;
      providerCity = STATIC_VERIFIED_PARTNERS[requestedProviderId].city;
    } else if (isValidUuid(requestedProviderUuid) || isValidUuid(requestedProviderId)) {
      sanitizedProviderUuid = isValidUuid(requestedProviderUuid) ? requestedProviderUuid : requestedProviderId;
      effectiveProviderId = sanitizedProviderUuid;
      effectiveProviderName = typeof provider_name === "string" && provider_name.trim()
        ? provider_name.trim()
        : "Provider";

      const { data: dbProvider, error: providerError } = await supabase
        .from("providers")
        .select("id, user_id, registration_status, is_verified, is_bookable, business_name, description, city")
        .eq("id", sanitizedProviderUuid)
        .maybeSingle();

      if (providerError) {
        console.error("[POST /api/bookings] Provider lookup error:", providerError);
        return NextResponse.json({ success: false, error: "Unable to verify provider listing" }, { status: 500 });
      }
      if (!dbProvider) {
        return NextResponse.json({ success: false, error: "Provider listing not found" }, { status: 404 });
      }
      if (isTestProvider(dbProvider.business_name, dbProvider.description)) {
        return NextResponse.json({ success: false, error: "Test businesses cannot accept booking requests" }, { status: 400 });
      }
      if (
        dbProvider.registration_status !== "approved" ||
        dbProvider.is_verified !== true ||
        dbProvider.is_bookable !== true
      ) {
        return NextResponse.json({ success: false, error: "This provider is not accepting bookings" }, { status: 409 });
      }
      if (user && dbProvider.user_id === user.id) {
        return NextResponse.json({ success: false, error: "You cannot book your own provider listing" }, { status: 403 });
      }

      effectiveProviderName = dbProvider.business_name || effectiveProviderName;
      providerCity = dbProvider.city;
    } else {
      return NextResponse.json({ success: false, error: "Select a valid provider listing" }, { status: 400 });
    }

    if (isTransport && !isFaabCabProvider) {
      return NextResponse.json(
        { success: false, error: "Transport booking details are only accepted for the FaabCab provider." },
        { status: 400 }
      );
    }

    const targetServiceKey = typeof service_id === "string" ? service_id : transport_service;
    const sanitizedServiceId = isValidUuid(service_id)
      ? service_id.toLowerCase()
      : isFaabCabProvider && typeof targetServiceKey === "string"
        ? FAABCAB_SERVICE_MAP[targetServiceKey] ?? null
        : null;

    if (sanitizedServiceId) {
      const { data: service, error: serviceError } = await supabase
        .from("services")
        .select("id, provider_id, is_available")
        .eq("id", sanitizedServiceId)
        .maybeSingle();
      if (serviceError) {
        console.error("[POST /api/bookings] Service lookup error:", serviceError);
        return NextResponse.json({ success: false, error: "Unable to verify selected service" }, { status: 500 });
      }
      if (service && sanitizedProviderUuid && service.provider_id !== sanitizedProviderUuid) {
        return NextResponse.json({ success: false, error: "Selected service does not belong to this provider" }, { status: 400 });
      }
      if (service && service.is_available === false) {
        return NextResponse.json({ success: false, error: "This service is currently unavailable" }, { status: 409 });
      }
    }

    const bookingDate = new Date(effectiveEventDate).toISOString().slice(0, 10);
    const duplicateLookup = await findActiveBooking(supabase, {
      clientId: user?.id ?? null,
      customerPhone: effectiveCustomerPhone,
      providerUuid: sanitizedProviderUuid,
      providerId: effectiveProviderId,
      serviceType: effectiveServiceType,
      serviceId: sanitizedServiceId,
      bookingDate,
      bookingTime: effectiveEventTime,
    });
    const existingBooking = duplicateLookup.data;
    const existingBookingError = duplicateLookup.error;
    if (existingBookingError) {
      console.error("[POST /api/bookings] Duplicate check error:", existingBookingError);
      return NextResponse.json({ success: false, error: "Unable to verify existing booking" }, { status: 500 });
    }

    if (existingBooking) {
      console.log("[POST /api/bookings] Returning existing booking to prevent duplicate:", existingBooking.id);
      return NextResponse.json(
        {
          success: true,
          message: "Booking already exists for this request",
          booking: existingBooking,
          is_existing: true,
        },
        { status: 200 }
      );
    }

    // Booking payload: structured columns preserved, message strictly for special requests
    const bookingPayload: Record<string, any> = {
      client_id: user?.id ?? null,
      provider_id: effectiveProviderId,
      provider_uuid: sanitizedProviderUuid,
      service_id: sanitizedServiceId,
      service_type: effectiveServiceType,
      provider_name: effectiveProviderName,
      customer_name: effectiveCustomerName,
      customer_phone: effectiveCustomerPhone,
      customer_email: user?.email ?? (typeof body.customer_email === "string" ? body.customer_email.trim() : null),
      city: typeof city === "string" && city.trim() ? city.trim() : providerCity || "Jamui, Bihar",
      status: "pending",
      message: isTransport ? (special_request || message || null) : (message || null),
    };

    if (isTransport) {
      bookingPayload.pickup_location = pickup_location || null;
      bookingPayload.drop_location = drop_location || null;
      bookingPayload.transport_service = transport_service || effectiveServiceType;
      bookingPayload.travel_date = bookingDate;
      bookingPayload.pickup_time = effectiveEventTime;
      bookingPayload.passenger_count = passenger_count ? Number(passenger_count) : (effectiveGuestCount ? Number(effectiveGuestCount) : null);

      // Synced fields for fallback table views
      bookingPayload.event_date = bookingDate;
      bookingPayload.event_time = pickup_time || effectiveEventTime;
      bookingPayload.guest_count = passenger_count ? Number(passenger_count) : effectiveGuestCount;

      // Attempt server-side coordinate pre-resolution for pickup & drop
      if (pickup_location && drop_location) {
        try {
          const { resolveTransportLocation } = await import("@/lib/transportLocation");
          const pickupRes = await resolveTransportLocation({ text: pickup_location });
          const dropRes = await resolveTransportLocation({ text: drop_location });
          if (pickupRes.ok) {
            bookingPayload.pickup_lat = pickupRes.lat;
            bookingPayload.pickup_lng = pickupRes.lng;
          }
          if (dropRes.ok) {
            bookingPayload.drop_lat = dropRes.lat;
            bookingPayload.drop_lng = dropRes.lng;
          }
        } catch (resolveErr) {
          console.warn("[POST /api/bookings] Geocoding pre-resolution warning:", resolveErr);
        }
      }
    } else {
      bookingPayload.event_date = bookingDate;
      bookingPayload.event_time = effectiveEventTime;
      bookingPayload.guest_count = effectiveGuestCount;
    }

    let booking: any = null;
    let insertError: any = null;

    const firstInsert = await supabase
      .from("bookings")
      .insert(bookingPayload)
      .select()
      .single();

    if (firstInsert.error && (bookingPayload.pickup_lat !== undefined || bookingPayload.drop_lat !== undefined)) {
      // If error caused by unmigrated DB columns, strip coordinates and retry insert safely
      delete bookingPayload.pickup_lat;
      delete bookingPayload.pickup_lng;
      delete bookingPayload.drop_lat;
      delete bookingPayload.drop_lng;

      const secondInsert = await supabase
        .from("bookings")
        .insert(bookingPayload)
        .select()
        .single();
      booking = secondInsert.data;
      insertError = secondInsert.error;
    } else {
      booking = firstInsert.data;
      insertError = firstInsert.error;
    }

    if (insertError) {
      if (insertError.code === "23505") {
        const duplicateResult = await findActiveBooking(supabase, {
          clientId: user?.id ?? null,
          providerUuid: sanitizedProviderUuid,
          serviceType: effectiveServiceType,
          serviceId: sanitizedServiceId,
          bookingDate,
          bookingTime: effectiveEventTime,
        });
        if (duplicateResult.error) {
          console.error("[POST /api/bookings] Duplicate recovery lookup error:", duplicateResult.error);
          return NextResponse.json({ success: false, error: "Unable to verify existing booking" }, { status: 500 });
        }
        if (duplicateResult.data) {
          return NextResponse.json(
            {
              success: true,
              message: "Booking already exists for this request",
              booking: duplicateResult.data,
              is_existing: true,
            },
            { status: 200 }
          );
        }
      }

      console.error("[POST /api/bookings] Insert error:", insertError);
      return NextResponse.json(
        {
          success: false,
          error: insertError.code === "23514"
            ? "This provider or service is no longer available"
            : "Unable to save booking",
        },
        { status: insertError.code === "23514" ? 409 : 500 }
      );
    }

    // ── Notifications & Email Triggering ──
    try {
      // Find owning provider record to obtain user_id and email
      let providerUserId: string | null = null;
      let providerEmail: string | null = null;
      let provBusinessName: string | null = null;

      if (sanitizedProviderUuid) {
        const { data: provRow, error: provError } = await supabase
          .from("providers")
          .select("id, user_id, business_name")
          .eq("id", sanitizedProviderUuid)
          .maybeSingle();

        if (provError) {
          console.error("[POST /api/bookings] Error fetching provider:", provError);
        } else if (provRow?.user_id) {
          providerUserId = provRow.user_id;
          provBusinessName = provRow.business_name || null;
          console.log("[POST /api/bookings] Found provider user_id:", providerUserId);
        } else {
          provBusinessName = provRow?.business_name || null;
          console.warn("[POST /api/bookings] Provider UUID found but no user_id:", sanitizedProviderUuid);
        }
      } else {
        console.warn("[POST /api/bookings] No provider_uuid available for notification");
      }

      // If user_id found, get provider email from profiles
      if (providerUserId) {
        const { data: profRow } = await supabase
          .from("profiles")
          .select("email, full_name")
          .eq("id", providerUserId)
          .maybeSingle();

        if (profRow?.email) {
          providerEmail = profRow.email;
        }
      }

      // Only send notification if we have a valid provider user_id
      if (!providerUserId) {
        console.error("[POST /api/bookings] Cannot send notification - no provider user_id found");
      }

      // 1. Create In-App Notification for Provider
      if (providerUserId) {
        try {
          await createNotificationServer({
            userId: providerUserId,
            bookingId: booking.id,
            title: isTransport ? "🚗 New Transport Booking" : "New Booking Request",
            message: isTransport
              ? [
                `Customer: ${booking.customer_name || effectiveCustomerName}`,
                `Pickup: ${booking.pickup_location || "Not provided"}`,
                `Drop: ${booking.drop_location || "Not provided"}`,
                `Date: ${booking.travel_date || "Not provided"}`,
                `Time: ${booking.pickup_time || "Not provided"}`,
                `Passengers: ${booking.passenger_count ?? "Not provided"}`,
                `Service: ${booking.transport_service || effectiveServiceType}`,
              ].join("\n")
              : `New ${effectiveServiceType} booking from ${effectiveCustomerName} for ${bookingPayload.event_date}`,
            type: "booking_new",
            dedupeKey: `booking_new:${booking.id}:${providerUserId}`,
          });
          console.log("[POST /api/bookings] Notification sent to provider:", providerUserId);
        } catch (notifErr) {
          console.error("[POST /api/bookings] Failed to create notification:", notifErr);
        }
      }

      const effectiveProviderName =
        provBusinessName ||
        (effectiveProviderId ? STATIC_VERIFIED_PARTNERS[effectiveProviderId]?.name : null) ||
        "Provider";

      // 2. Send Server-Side Brevo Email to Provider
      if (providerEmail) {
        try {
          await dispatchEmailNotification({
            template: "booking_new_provider",
            params: {
              providerEmail,
              providerName: effectiveProviderName,
              bookingId: booking.id,
              customerName: effectiveCustomerName,
              customerPhone: effectiveCustomerPhone,
              customerEmail: user?.email || effectiveCustomerEmail || null,
              service: effectiveServiceType,
              date: bookingPayload.event_date || "Not specified",
              time: bookingPayload.event_time || null,
              pickup: bookingPayload.pickup_location,
              destination: bookingPayload.drop_location,
              passengers: bookingPayload.passenger_count,
              specialRequest: bookingPayload.message,
            },
            userId: providerUserId,
            bookingId: booking.id,
            eventType: "booking_new",
            dedupeKey: `email:booking_new:${booking.id}`,
            recipient: providerEmail,
            subject: `New Booking Request #${booking.id.slice(-6)} - ${effectiveServiceType}`,
          });
          console.log("[POST /api/bookings] Email dispatched to provider:", providerEmail);
        } catch (emailErr) {
          console.error("[POST /api/bookings] Failed to send email:", emailErr);
        }
      }

      // 3. Booking receipt -> Notify Client (in-app + email)
      if (user && user.email) {
        try {
          await createNotificationServer({
            userId: user.id,
            bookingId: booking.id,
            title: "Booking Request Received",
            message: `We received your ${effectiveServiceType} booking request with ${effectiveProviderName}. You will be notified once it is confirmed.`,
            type: "booking_received",
            dedupeKey: `booking_received:${booking.id}:${user.id}`,
          });
        } catch (receiptErr) {
          console.error("[POST /api/bookings] Client receipt notification error:", receiptErr);
        }

        try {
          await dispatchEmailNotification({
            template: "booking_received_client",
            params: {
              clientEmail: user.email,
              clientName: effectiveCustomerName,
              bookingId: booking.id,
              providerName: effectiveProviderName,
              service: effectiveServiceType,
              date: bookingPayload.event_date || "Not specified",
              time: bookingPayload.event_time || null,
            },
            userId: user.id,
            bookingId: booking.id,
            eventType: "booking_received",
            dedupeKey: `email:booking_received:${booking.id}`,
            recipient: user.email,
            subject: `Booking Request Received #${booking.id.slice(-6)} - ${effectiveServiceType}`,
          });
        } catch (receiptErr) {
          console.error("[POST /api/bookings] Client receipt email error:", receiptErr);
        }
      }
    } catch (notifyErr) {
      console.error("[POST /api/bookings] Notification/Email error (booking still succeeded):", notifyErr);
    }

    return NextResponse.json(
      {
        success: true,
        message: "Booking created successfully.",
        booking,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Booking API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Something went wrong while creating the booking.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    let body: Record<string, any>;
    try {
      const requestBody = await request.json();
      if (!requestBody || typeof requestBody !== "object" || Array.isArray(requestBody)) {
        return NextResponse.json({ success: false, error: "Invalid JSON request body" }, { status: 400 });
      }
      body = requestBody;
    } catch {
      return NextResponse.json({ success: false, error: "Invalid JSON request body" }, { status: 400 });
    }

    const { id, status, rejection_reason, action } = body;
    const { user } = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
    }

    const targetStatus = status || (action === "cancel" ? "cancelled" : null);

    if (!isValidUuid(id) || !isBookingStatusUpdate(targetStatus)) {
      return NextResponse.json(
        { success: false, error: "Invalid booking ID or status" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const requiredRole = targetStatus === "cancelled" ? "client" : "provider";
    if (await getAccountRole(supabase, user.id) !== requiredRole) {
      return NextResponse.json({ success: false, error: `${requiredRole === "client" ? "Customer" : "Provider"} account required` }, { status: 403 });
    }

    // Fetch existing booking
    const { data: existingBooking, error: fetchErr } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (fetchErr) {
      console.error("[PATCH /api/bookings] Lookup error:", fetchErr);
      return NextResponse.json(
        { success: false, error: "Unable to load booking" },
        { status: 500 }
      );
    }
    if (!existingBooking) {
      return NextResponse.json(
        { success: false, error: "Booking not found" },
        { status: 404 }
      );
    }

    const providerIds: string[] = [];
    if (["confirmed", "rejected", "completed"].includes(targetStatus)) {
      const { data: myProviders, error: providerError } = await supabase
        .from("providers")
        .select("id")
        .eq("user_id", user.id);
      if (providerError) throw providerError;

      providerIds.push(...(myProviders || []).map((provider) => provider.id));
    }

    const authorization = authorizeBookingStatusUpdate({
      userId: user.id,
      clientId: existingBooking.client_id,
      providerIds,
      providerId: existingBooking.provider_uuid,
      currentStatus: String(existingBooking.status || "pending"),
      targetStatus,
    });
    if (!authorization.authorized) {
      if (authorization.reason === "NOT_AUTHORIZED") {
        return NextResponse.json({ success: false, error: "Not authorized to update this booking" }, { status: 403 });
      }
      return NextResponse.json({ success: false, error: "This booking status transition is not allowed" }, { status: 409 });
    }

    const updates: Record<string, any> = {
      status: targetStatus,
    };

    // ── Acceptance ──
    if (targetStatus === "confirmed") {
      updates.provider_response_at = new Date().toISOString();
    }

    // ── Rejection ──
    if (targetStatus === "rejected") {
      if (typeof rejection_reason !== "string" || !rejection_reason.trim()) {
        return NextResponse.json(
          { success: false, error: "Rejection reason is required" },
          { status: 400 }
        );
      }
      updates.rejection_reason = rejection_reason.trim();
      updates.provider_response_at = new Date().toISOString();
    }

    // ── Completion ──
    if (targetStatus === "completed") {
      updates.completed_at = new Date().toISOString();
    }

    // ── Client Cancellation ──
    if (targetStatus === "cancelled") {
      updates.cancelled_at = new Date().toISOString();
    }

    const { data: updatedBooking, error: updateErr } = await supabase
      .from("bookings")
      .update(updates)
      .eq("id", id)
      .eq("status", existingBooking.status)
      .select()
      .maybeSingle();

    if (updateErr) {
      console.error("[PATCH /api/bookings] Update error:", updateErr);
      return NextResponse.json(
        { success: false, error: updateErr.message },
        { status: 500 }
      );
    }
    if (!updatedBooking) {
      return NextResponse.json({ success: false, error: "This booking was updated by another session" }, { status: 409 });
    }

    // ── Handle Notifications & Brevo Emails Server-Side ──
    try {
      const clientUserId = existingBooking.client_id;
      const clientEmail = existingBooking.customer_email;
      const clientName = existingBooking.customer_name || "Customer";

      // 1. Acceptance Flow -> Notify Client
      if (targetStatus === "confirmed") {
        if (clientUserId) {
          await createNotificationServer({
            userId: clientUserId,
            bookingId: id,
            title: "Booking Confirmed! 🎉",
            message: `Your booking for ${existingBooking.service_type || existingBooking.transport_service} has been confirmed by ${existingBooking.provider_name}.`,
            type: "booking_confirmed",
            dedupeKey: `booking_confirmed:${id}:${clientUserId}`,
          });
        }
        if (clientEmail) {
          await dispatchEmailNotification({
            template: "booking_accepted_client",
            params: {
              clientEmail,
              clientName,
              bookingId: id,
              providerName: existingBooking.provider_name || "Service Provider",
              service: existingBooking.transport_service || existingBooking.service_type,
              date: existingBooking.travel_date || existingBooking.event_date || "Scheduled Date",
              time: existingBooking.pickup_time || existingBooking.event_time,
            },
            userId: clientUserId,
            bookingId: id,
            eventType: "booking_confirmed",
            dedupeKey: `email:booking_accepted:${id}`,
            recipient: clientEmail,
            subject: `Booking Confirmed #${id.slice(-6)}`,
          });
        }
      }

      // 2. Rejection Flow -> Notify Client with Reason
      if (targetStatus === "rejected") {
        if (clientUserId) {
          await createNotificationServer({
            userId: clientUserId,
            bookingId: id,
            title: "Booking Request Update",
            message: `Your booking for ${existingBooking.service_type || existingBooking.transport_service} was declined. Reason: ${updates.rejection_reason}`,
            type: "booking_rejected",
            dedupeKey: `booking_rejected:${id}:${clientUserId}`,
          });
        }
        if (clientEmail) {
          await dispatchEmailNotification({
            template: "booking_rejected_client",
            params: {
              clientEmail,
              clientName,
              bookingId: id,
              providerName: existingBooking.provider_name || "Service Provider",
              service: existingBooking.transport_service || existingBooking.service_type,
              reason: updates.rejection_reason,
            },
            userId: clientUserId,
            bookingId: id,
            eventType: "booking_rejected",
            dedupeKey: `email:booking_rejected:${id}`,
            recipient: clientEmail,
            subject: `Booking Request Declined #${id.slice(-6)}`,
          });
        }
      }

      // 3. Client Cancellation Flow -> Notify Provider
      if (targetStatus === "cancelled") {
        // Find provider's user_id and email
        let providerUserId: string | null = null;
        let providerEmail: string | null = null;

        if (existingBooking.provider_uuid) {
          const { data: provRow } = await supabase
            .from("providers")
            .select("user_id")
            .eq("id", existingBooking.provider_uuid)
            .maybeSingle();
          if (provRow?.user_id) providerUserId = provRow.user_id;
        }

        if (providerUserId) {
          const { data: profRow } = await supabase
            .from("profiles")
            .select("email, full_name")
            .eq("id", providerUserId)
            .maybeSingle();
          if (profRow?.email) providerEmail = profRow.email;

          await createNotificationServer({
            userId: providerUserId,
            bookingId: id,
            title: "Booking Cancelled by Customer",
            message: `Booking #${id.slice(-6)} has been cancelled by ${clientName}.`,
            type: "booking_cancelled",
            dedupeKey: `booking_cancelled:${id}:${providerUserId}`,
          });
        }

        if (providerEmail) {
          await dispatchEmailNotification({
            template: "booking_cancelled_provider",
            params: {
              providerEmail,
              providerName: existingBooking.provider_name || "Provider",
              bookingId: id,
              customerName: clientName,
              service: existingBooking.transport_service || existingBooking.service_type,
              date: existingBooking.travel_date || existingBooking.event_date || "Scheduled Date",
            },
            userId: providerUserId,
            bookingId: id,
            eventType: "booking_cancelled",
            dedupeKey: `email:booking_cancelled:${id}`,
            recipient: providerEmail,
            subject: `Booking Cancelled #${id.slice(-6)}`,
          });
        }
      }

      // 4. Completed Flow -> Notify Client (in-app + email)
      if (targetStatus === "completed") {
        if (clientUserId) {
          await createNotificationServer({
            userId: clientUserId,
            bookingId: id,
            title: "Booking Completed ✅",
            message: `Your booking #${id.slice(-6)} with ${existingBooking.provider_name} is complete. Thank you for using Evigo!`,
            type: "booking_completed",
            dedupeKey: `booking_completed:${id}:${clientUserId}`,
          });
        }
        if (clientEmail) {
          await dispatchEmailNotification({
            template: "booking_completed_client",
            params: {
              clientEmail,
              clientName,
              bookingId: id,
              providerName: existingBooking.provider_name || "Service Provider",
              service: existingBooking.transport_service || existingBooking.service_type,
              date: existingBooking.travel_date || existingBooking.event_date || "Scheduled Date",
            },
            userId: clientUserId,
            bookingId: id,
            eventType: "booking_completed",
            dedupeKey: `email:booking_completed:${id}`,
            recipient: clientEmail,
            subject: `Service Completed #${id.slice(-6)}`,
          });
        }
      }
    } catch (notifyErr) {
      console.warn("[PATCH /api/bookings] Notification/email processing warning:", notifyErr);
    }

    return NextResponse.json({
      success: true,
      message: `Booking status updated to ${targetStatus}`,
      booking: updatedBooking,
    });
  } catch (err: any) {
    console.error("[PATCH /api/bookings] Error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to update booking status" },
      { status: 500 }
    );
  }
}