import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { getAuthenticatedUser } from "@/lib/server";

export const runtime = "nodejs";

/**
 * POST /api/users/upsert
 * Body: { phone, role, name?, email?, city?, profile_image? }
 *
 * Creates or updates a user record in Supabase. Called after OTP verification.
 */
export async function POST(request: Request) {
  try {
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError) {
      console.warn("[users/upsert] Session verification failed:", authError.code);
    }
    if (!user?.email) {
      return NextResponse.json(
        { error: "A valid signed-in session is required." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { phone, name, city, profile_image } = body;

    if (typeof phone !== "string" || !phone.trim()) {
      return NextResponse.json(
        { error: "phone is required" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error("[users/upsert] Profile lookup error:", profileError);
      return NextResponse.json({ error: "Unable to verify user role" }, { status: 500 });
    }
    if (!profile || !["client", "provider"].includes(profile.role)) {
      return NextResponse.json(
        { error: "A valid user profile is required." },
        { status: 403 }
      );
    }

    const normalizedEmail = user.email.trim().toLowerCase();
    const normalizedPhone = phone.trim();
    const { data: existingUser, error: existingUserError } = await supabase
      .from("users")
      .select("email")
      .eq("phone", normalizedPhone)
      .maybeSingle();

    if (existingUserError) {
      console.error("[users/upsert] Existing user lookup error:", existingUserError);
      return NextResponse.json({ error: "Unable to verify phone ownership" }, { status: 500 });
    }
    if (
      existingUser &&
      existingUser.email?.trim().toLowerCase() !== normalizedEmail
    ) {
      return NextResponse.json(
        { error: "This phone number is already associated with another account." },
        { status: 409 }
      );
    }

    const { data, error } = await supabase
      .from("users")
      .upsert(
        {
          phone: normalizedPhone,
          role: profile.role,
          name: typeof name === "string" ? name : null,
          email: normalizedEmail,
          city: typeof city === "string" ? city : null,
          profile_image: typeof profile_image === "string" ? profile_image : null,
          last_seen_at: new Date().toISOString(),
        },
        {
          onConflict: "phone",
          ignoreDuplicates: false,
        }
      )
      .select()
      .single();

    if (error) {
      console.error("[users/upsert] Supabase error:", error);
      return NextResponse.json({ error: "Failed to save user" }, { status: 500 });
    }

    return NextResponse.json({ success: true, user: data });
  } catch (err: unknown) {
    console.error("[users/upsert] Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * GET /api/users/upsert?phone=+91XXXXXXXXXX
 * Fetches a user by phone number.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const phone = searchParams.get("phone");

  if (!phone) {
    return NextResponse.json({ error: "phone query param is required" }, { status: 400 });
  }

  try {
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError) {
      console.warn("[users/upsert] Session verification failed:", authError.code);
    }
    if (!user?.email) {
      return NextResponse.json(
        { error: "A valid signed-in session is required." },
        { status: 401 }
      );
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("phone", phone.trim())
      .eq("email", user.email.trim().toLowerCase())
      .maybeSingle();

    if (error) throw error;
    if (!data) return NextResponse.json({ user: null }, { status: 404 });

    return NextResponse.json({ user: data });
  } catch (err: unknown) {
    console.error("[users/upsert] GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
