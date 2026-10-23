import { getAuthenticatedUser } from "@/lib/server";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get("provider_id");
    const userId = searchParams.get("user_id");

    const supabase = createAdminClient();

    let providerIds: string[] = [];

    if (userId) {
      const { user } = await getAuthenticatedUser();
      if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
      if (userId !== user.id) return NextResponse.json({ error: "Not authorized" }, { status: 403 });
      // Find all providers owned by this user
      const { data: myProviders, error: ownershipError } = await supabase
        .from("providers")
        .select("id")
        .eq("user_id", userId);

      if (ownershipError) throw ownershipError;
      if (myProviders && myProviders.length > 0) {
        providerIds = myProviders.map((p) => p.id);
      }
    }

    if (providerId && !userId) {
      const { data: provider, error } = await supabase.from("providers").select("id")
        .eq("id", providerId).eq("registration_status", "approved").eq("is_verified", true).eq("is_bookable", true).maybeSingle();
      if (error) throw error;
      if (provider) providerIds.push(provider.id);
    }
    if (providerIds.length === 0) return NextResponse.json({ success: true, services: [] });

    let servicesQuery = supabase
      .from("services")
      .select("*")
      .in("provider_id", providerIds)
      .order("created_at", { ascending: true });
    if (!userId) servicesQuery = servicesQuery.eq("is_available", true);
    const { data: services, error } = await servicesQuery;

    if (error) {
      console.error("[GET /api/services] Error:", error);
      return NextResponse.json({ success: false, error: "Unable to complete this request. Please try again." }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      services: services || [],
    });
  } catch (err: any) {
    console.error("[GET /api/services] Unexpected error:", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
