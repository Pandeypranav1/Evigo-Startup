import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { getAuthenticatedUser } from "@/lib/server";
import { ownsProviderResource } from "@/lib/provider-workflow";

export const runtime = "nodejs";

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { service_id, is_available, provider_id, user_id } = body;

    if (!service_id || typeof is_available !== "boolean") {
      return NextResponse.json(
        { success: false, error: "service_id and boolean is_available are required" },
        { status: 400 }
      );
    }

    const { user, error: authError } = await getAuthenticatedUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
    }
    if (user_id && user_id !== user.id) {
      return NextResponse.json({ success: false, error: "You can only update your own services" }, { status: 403 });
    }

    const supabase = createAdminClient();

    // Verify service exists
    const { data: service, error: fetchErr } = await supabase
      .from("services")
      .select("id, provider_id, service_name")
      .eq("id", service_id)
      .maybeSingle();

    if (fetchErr || !service) {
      return NextResponse.json(
        { success: false, error: "Service not found" },
        { status: 404 }
      );
    }

    const { data: providerRows, error: providersError } = await supabase
      .from("providers")
      .select("id")
      .eq("user_id", user.id);
    if (providersError) {
      console.error("[PATCH /api/services/availability] Provider lookup error:", providersError);
      return NextResponse.json(
        { success: false, error: "Unable to verify service ownership" },
        { status: 500 }
      );
    }

    const ownedProviderIds = (providerRows ?? []).map((provider) => provider.id);
    if (
      (provider_id && provider_id !== service.provider_id) ||
      !ownsProviderResource(ownedProviderIds, service.provider_id)
    ) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: You do not own this service" },
        { status: 403 }
      );
    }

    const { data: updated, error: updateErr } = await supabase
      .from("services")
      .update({ is_available })
      .eq("id", service_id)
      .select()
      .single();

    if (updateErr) {
      console.error("[PATCH /api/services/availability] Update error:", updateErr);
      return NextResponse.json(
        { success: false, error: updateErr.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Service availability set to ${is_available ? "Online" : "Offline"}`,
      service: updated,
    });
  } catch (err: any) {
    console.error("[PATCH /api/services/availability] Unexpected error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
