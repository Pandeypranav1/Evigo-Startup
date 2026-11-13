import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { getAuthenticatedUser } from "@/lib/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get("provider_id");
    const requestedUserId = searchParams.get("user_id");

    const { user, error: authError } = await getAuthenticatedUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
    }
    if (requestedUserId && requestedUserId !== user.id) {
      return NextResponse.json({ success: false, error: "You can only view services for your own provider account" }, { status: 403 });
    }

    const supabase = createAdminClient();
    const { data: myProviders, error: providersError } = await supabase
      .from("providers")
      .select("id")
      .eq("user_id", user.id);
    if (providersError) {
      console.error("[GET /api/services] Provider lookup error:", providersError);
      return NextResponse.json({ success: false, error: "Unable to verify provider ownership" }, { status: 500 });
    }

    const providerIds = (myProviders ?? []).map((provider) => provider.id);
    if (providerId && !providerIds.includes(providerId)) {
      return NextResponse.json({ success: false, error: "You do not own this provider" }, { status: 403 });
    }

    if (providerIds.length === 0) {
      return NextResponse.json({ success: true, services: [] });
    }

    const { data: services, error } = await supabase
      .from("services")
      .select("*")
      .in("provider_id", providerIds)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("[GET /api/services] Error:", error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
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
