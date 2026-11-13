import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { EVENT_VENUES } from "@/lib/constants";

function isValidUuid(value: string | null): value is string {
  return value !== null &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

export async function GET(request: Request) {
  const providerId = new URL(request.url).searchParams.get("provider_id");
  if (!providerId) {
    return NextResponse.json({ success: false, error: "A valid provider listing is required" }, { status: 400 });
  }

  // 1. Support static verified partner venues (Hotels, Banquets, Restaurants)
  const staticPartner = EVENT_VENUES.find((v) => v.id === providerId);
  if (staticPartner) {
    const services = staticPartner.services.map((name, idx) => ({
      id: `${staticPartner.id}-service-${idx + 1}`,
      service_name: name,
      description: `${name} at ${staticPartner.name}, ${staticPartner.city}`,
      price: null,
      category: "Restaurant",
    }));
    return NextResponse.json({ success: true, services });
  }

  if (!isValidUuid(providerId)) {
    return NextResponse.json({ success: false, error: "A valid provider listing is required" }, { status: 400 });
  }

  try {
    const supabase = createAdminClient();
    const { data: provider, error: providerError } = await supabase
      .from("providers")
      .select("id")
      .eq("id", providerId)
      .eq("registration_status", "approved")
      .eq("is_verified", true)
      .eq("is_bookable", true)
      .maybeSingle();

    if (providerError) {
      console.error("[GET /api/public/services] Provider lookup error:", providerError);
      return NextResponse.json({ success: false, error: "Unable to verify provider listing" }, { status: 500 });
    }
    if (!provider) {
      return NextResponse.json({ success: false, error: "Provider listing is not available" }, { status: 404 });
    }

    const { data: services, error } = await supabase
      .from("services")
      .select("id, service_name, description, price, category")
      .eq("provider_id", providerId)
      .eq("is_available", true)
      .not("service_name", "is", null)
      .neq("service_name", "")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("[GET /api/public/services] Service lookup error:", error);
      return NextResponse.json({ success: false, error: "Unable to load available services" }, { status: 500 });
    }

    return NextResponse.json({ success: true, services: services || [] });
  } catch (error) {
    console.error("[GET /api/public/services] Unexpected error:", error);
    return NextResponse.json({ success: false, error: "Unable to load available services" }, { status: 500 });
  }
}
