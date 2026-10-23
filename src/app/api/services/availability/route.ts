import { getAuthenticatedUser } from "@/lib/server";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

export const runtime = "nodejs";

export async function PATCH(request: Request) {
  try {
    const { user } = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    const body = await request.json();
    const { service_id, is_available, provider_id, user_id } = body;

    if (!service_id || typeof is_available !== "boolean") {
      return NextResponse.json(
        { success: false, error: "service_id and boolean is_available are required" },
        { status: 400 }
      );
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

    // Verify ownership if user_id or provider_id is provided
    {
      const { data: providerRows } = await supabase
        .from("providers")
        .select("id")
        .eq("user_id", user.id);

      const ownedProviderIds = (providerRows || []).map((p) => p.id);
      // Allow if service belongs to one of user's providers or user is managing FaabCab
      if (!ownedProviderIds.includes(service.provider_id)) {
        return NextResponse.json(
          { success: false, error: "Unauthorized: You do not own this service" },
          { status: 403 }
        );
      }
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
        { success: false, error: "Unable to complete this request. Please try again." },
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
