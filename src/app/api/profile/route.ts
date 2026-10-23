import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/server";
import { createAdminClient } from "@/lib/supabase";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { user } = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id") || user.id;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "user_id parameter is required" },
        { status: 400 }
      );
    }

    if (userId !== user.id) return NextResponse.json({ success: false, error: "Not authorized" }, { status: 403 });
    const supabase = createAdminClient();
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.error("[GET /api/profile] Error:", error);
      return NextResponse.json(
        { success: false, error: "Unable to load profile" },
        { status: 500 }
      );
    }

    if (!profile) {
      // Recovery never infers a privileged role from user-editable metadata.
      const { error: recoveryError } = await supabase.from("profiles").upsert({
        id: user.id, email: user.email || null, role: "client",
      }, { onConflict: "id", ignoreDuplicates: true });
      if (recoveryError) throw recoveryError;
      const { data: recovered, error: reloadError } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (reloadError) throw reloadError;
      return NextResponse.json({ success: true, profile: recovered });
    }

    return NextResponse.json({
      success: true,
      profile,
    });
  } catch (err: any) {
    console.error("[GET /api/profile] Unexpected error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const { user } = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
    const body = await request.json();
    const { user_id, full_name, phone, city, experience_years, description, service_areas } = body;

    if (!user_id) {
      return NextResponse.json(
        { success: false, error: "user_id is required" },
        { status: 400 }
      );
    }

    if (user_id !== user.id) return NextResponse.json({ success: false, error: "Not authorized" }, { status: 403 });
    if ([full_name, phone, city].some((value) => value !== undefined && (typeof value !== "string" || value.length > 2000)) ||
        (description !== undefined && (typeof description !== "string" || description.length > 5000)) ||
        (experience_years !== undefined && (!Number.isInteger(experience_years) || experience_years < 0 || experience_years > 100)) ||
        (service_areas !== undefined && (!Array.isArray(service_areas) || service_areas.length > 20 || service_areas.some((area) => typeof area !== "string" || area.length > 100)))) {
      return NextResponse.json({ error: "Invalid profile fields" }, { status: 400 });
    }
    const supabase = createAdminClient();

    // Verify profile exists
    const { data: existing, error: findError } = await supabase
      .from("profiles")
      .select("id, email")
      .eq("id", user_id)
      .maybeSingle();

    if (findError || !existing) {
      return NextResponse.json(
        { success: false, error: "User profile not found" },
        { status: 404 }
      );
    }

    // Keep email strictly read-only per requirements
    const profileUpdates: Record<string, any> = {};
    if (typeof full_name === "string") profileUpdates.full_name = full_name.trim();
    if (typeof phone === "string") profileUpdates.phone = phone.trim();
    if (typeof city === "string") profileUpdates.city = city.trim();

    const { data: updatedProfile, error: updateError } = await supabase
      .from("profiles")
      .update(profileUpdates)
      .eq("id", user_id)
      .select()
      .maybeSingle();

    if (updateError) {
      console.error("[PATCH /api/profile] Profile update error:", updateError);
      return NextResponse.json(
        { success: false, error: "Unable to update profile" },
        { status: 500 }
      );
    }

    // Also update provider-specific fields if provider row exists
    const providerUpdates: Record<string, any> = {};
    if (typeof full_name === "string") providerUpdates.owner_name = full_name.trim();
    if (typeof phone === "string") providerUpdates.phone = phone.trim();
    if (typeof city === "string") providerUpdates.city = city.trim();
    if (typeof experience_years === "number") providerUpdates.experience_years = experience_years;
    if (typeof description === "string") providerUpdates.description = description.trim();
    if (Array.isArray(service_areas)) providerUpdates.service_areas = service_areas;

    if (Object.keys(providerUpdates).length > 0) {
      try {
        const { error: providerError } = await supabase
          .from("providers")
          .update(providerUpdates)
          .eq("user_id", user_id);
        if (providerError) throw providerError;
      } catch (provErr) {
        console.warn("[PATCH /api/profile] Provider table update warning:", provErr);
        return NextResponse.json({ success: false, error: "Account saved, but business details could not be updated. Please retry." }, { status: 503 });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      profile: updatedProfile,
    });
  } catch (err: any) {
    console.error("[PATCH /api/profile] Unexpected error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
