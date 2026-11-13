import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { getAuthenticatedUser } from "@/lib/server";
import { SERVICE_CATEGORIES } from "@/lib/constants";

export const runtime = "nodejs";

const ALLOWED_PROVIDER_CATEGORIES = new Set<string>(SERVICE_CATEGORIES);

function isValidIndianPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length !== 10 && digits.length !== 12) return false;
  if (digits.length === 12 && !digits.startsWith("91")) return false;
  return /^[6-9]/.test(digits.slice(-10));
}

function isValidUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id");

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "user_id parameter is required" },
        { status: 400 }
      );
    }

    const { user, error: authError } = await getAuthenticatedUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }
    if (user.id !== userId) {
      return NextResponse.json(
        { success: false, error: "You can only view your own profile" },
        { status: 403 }
      );
    }

    const supabase = createAdminClient();
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.error("[GET /api/profile] Error:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    if (!profile) {
      return NextResponse.json(
        { success: false, error: "Profile not found" },
        { status: 404 }
      );
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
    const body = await request.json();
    const {
      user_id,
      full_name,
      phone,
      city,
      experience_years,
      description,
      service_areas,
      business_name,
      category,
      starting_price,
      image_url,
    } = body;

    if (!user_id) {
      return NextResponse.json(
        { success: false, error: "user_id is required" },
        { status: 400 }
      );
    }

    if (phone !== undefined && (typeof phone !== "string" || !isValidIndianPhone(phone))) {
      return NextResponse.json(
        { success: false, error: "Please enter a valid Indian phone number." },
        { status: 400 }
      );
    }
    if (
      service_areas !== undefined &&
      (!Array.isArray(service_areas) ||
        service_areas.length > 20 ||
        service_areas.some((area: unknown) => typeof area !== "string" || area.trim().length > 100))
    ) {
      return NextResponse.json(
        { success: false, error: "Service areas must be up to 20 location names of 100 characters or less." },
        { status: 400 }
      );
    }
    if (
      experience_years !== undefined &&
      (typeof experience_years !== "number" ||
        !Number.isInteger(experience_years) ||
        experience_years < 0)
    ) {
      return NextResponse.json(
        { success: false, error: "Experience years must be a non-negative integer." },
        { status: 400 }
      );
    }
    if (
      category !== undefined &&
      (typeof category !== "string" || !ALLOWED_PROVIDER_CATEGORIES.has(category))
    ) {
      return NextResponse.json(
        { success: false, error: "Please select a valid service category." },
        { status: 400 }
      );
    }
    if (
      starting_price !== undefined &&
      (typeof starting_price !== "number" ||
        !Number.isFinite(starting_price) ||
        starting_price < 0)
    ) {
      return NextResponse.json(
        { success: false, error: "Starting price must be a non-negative number." },
        { status: 400 }
      );
    }
    if (
      image_url !== undefined &&
      image_url !== null &&
      (typeof image_url !== "string" || (image_url !== "" && !isValidUrl(image_url)))
    ) {
      return NextResponse.json(
        { success: false, error: "Image URL must start with http:// or https://." },
        { status: 400 }
      );
    }

    const { user, error: authError } = await getAuthenticatedUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }
    if (user.id !== user_id) {
      return NextResponse.json(
        { success: false, error: "You can only update your own profile" },
        { status: 403 }
      );
    }

    const supabase = createAdminClient();

    // Verify profile exists
    const { data: existing, error: findError } = await supabase
      .from("profiles")
      .select("id, email")
      .eq("id", user_id)
      .maybeSingle();

    if (findError) {
      console.error("[PATCH /api/profile] Profile lookup error:", findError);
      return NextResponse.json(
        { success: false, error: "Unable to verify user profile" },
        { status: 500 }
      );
    }
    if (!existing) {
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
        { success: false, error: updateError.message },
        { status: 500 }
      );
    }

    // Also update provider-specific fields if provider row exists.
    // Status/verification fields are never writable through this endpoint.
    const providerUpdates: Record<string, any> = {};
    const sanitizedProviderPhone = typeof phone === "string" ? phone.replace(/\s+/g, "") : null;

    if (sanitizedProviderPhone) {
      const { data: phoneCandidates, error: phoneConflictError } = await supabase
        .from("providers")
        .select("id, user_id")
        .eq("phone", sanitizedProviderPhone)
        .limit(10);

      if (phoneConflictError) {
        console.error("[PATCH /api/profile] Provider phone check error:", phoneConflictError);
        return NextResponse.json(
          { success: false, error: "Unable to verify provider phone number." },
          { status: 500 }
        );
      }
      if ((phoneCandidates ?? []).some((row) => row.user_id !== user_id)) {
        return NextResponse.json(
          { success: false, error: "This phone number is already used by another provider." },
          { status: 409 }
        );
      }
    }

    if (typeof full_name === "string") providerUpdates.owner_name = full_name.trim();
    if (sanitizedProviderPhone) providerUpdates.phone = sanitizedProviderPhone;
    if (typeof city === "string") {
      providerUpdates.city = city.trim();
      providerUpdates.address = city.trim();
    }
    if (typeof experience_years === "number") providerUpdates.experience_years = experience_years;
    if (typeof description === "string") providerUpdates.description = description.trim();
    if (Array.isArray(service_areas)) {
      providerUpdates.service_areas = [
        ...new Set(service_areas.map((area: string) => area.trim()).filter(Boolean)),
      ];
    }
    if (typeof business_name === "string" && business_name.trim()) {
      providerUpdates.business_name = business_name.trim();
    }
    if (typeof category === "string") providerUpdates.category = category;
    if (typeof image_url === "string" && image_url) {
      providerUpdates.image_url = image_url;
    } else if (image_url === null || image_url === "") {
      providerUpdates.image_url = null;
    }
    if (typeof starting_price === "number") {
      providerUpdates.starting_price = starting_price;
      providerUpdates.price_range = `₹${starting_price.toLocaleString("en-IN")}`;
    }

    if (Object.keys(providerUpdates).length > 0) {
      const { error: providerUpdateError } = await supabase
        .from("providers")
        .update(providerUpdates)
        .eq("user_id", user_id);
      if (providerUpdateError) {
        console.error("[PATCH /api/profile] Provider profile update error:", providerUpdateError);
        return NextResponse.json(
          { success: false, error: "Profile was saved, but provider details could not be updated." },
          { status: 500 }
        );
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
