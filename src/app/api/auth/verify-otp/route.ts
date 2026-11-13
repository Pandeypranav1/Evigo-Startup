import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase";
import { isAccountRole, resolveAccountRole } from "@/lib/auth-role";

export async function POST(request: Request) {
  try {
    const { email, otp, role } = await request.json();

    if (!email || typeof email !== "string" || !email.trim()) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    if (!otp || typeof otp !== "string" || !/^\d{6}$/.test(otp)) {
      return NextResponse.json(
        { error: "A valid 6-digit OTP is required" },
        { status: 400 }
      );
    }
    if (!isAccountRole(role)) {
      return NextResponse.json(
        { error: "A valid account type is required." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Use a server-side Supabase client with the anon key.
    // verifyOtp is a public Auth endpoint that works with the anon key.
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data, error } = await supabase.auth.verifyOtp({
      email: normalizedEmail,
      token: otp,
      type: "email",
    });

    // Diagnostic logging (Never log OTP code or secrets)
    console.log("[verify-otp] Diagnostic log:", {
      stage: "otp_verification",
      emailDomain: normalizedEmail.split("@")[1] || "unknown",
      success: !error && !!data?.user,
      errorCode: (error as any)?.code || (error as any)?.status || null,
      errorMessage: error?.message || null,
    });

    if (error) {
      const msg = error.message?.toLowerCase() || "";
      let userMsg = error.message || "Invalid or expired OTP";
      if (msg.includes("expired")) {
        userMsg = "The OTP has expired. Please request a new code.";
      } else if (msg.includes("invalid")) {
        userMsg = "Incorrect OTP code. Please verify and try again.";
      }
      return NextResponse.json(
        { error: userMsg },
        { status: 400 }
      );
    }

    if (!data.user) {
      return NextResponse.json(
        { error: "Verification failed. Please try again." },
        { status: 400 }
      );
    }

    const adminSupabase = createAdminClient();
    const { data: existingProfile, error: profileLookupError } = await adminSupabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .maybeSingle();

    if (profileLookupError) {
      console.error("[verify-otp] Profile lookup failed:", profileLookupError);
      return NextResponse.json(
        { error: "Unable to load your account profile. Please try again." },
        { status: 500 }
      );
    }

    let accountRole = resolveAccountRole(existingProfile?.role, role);
    if (!accountRole) {
      return NextResponse.json(
        { error: "The account has an invalid role. Please contact support." },
        { status: 500 }
      );
    }

    if (!existingProfile) {
      const { data: createdProfile, error: profileCreateError } = await adminSupabase
        .from("profiles")
        .insert({
          id: data.user.id,
          email: normalizedEmail,
          role: accountRole,
          full_name: data.user.user_metadata?.full_name || normalizedEmail.split("@")[0],
        })
        .select("role")
        .single();

      if (profileCreateError) {
        console.error("[verify-otp] Profile creation failed:", profileCreateError);
        return NextResponse.json(
          { error: "Unable to create your account profile. Please try again." },
          { status: 500 }
        );
      }

      accountRole = resolveAccountRole(createdProfile.role, accountRole);
      if (!accountRole) {
        return NextResponse.json(
          { error: "The account has an invalid role. Please contact support." },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email || normalizedEmail,
        role: accountRole,
        createdAt: data.user.created_at || new Date().toISOString(),
      },
      // Return session so client can establish it
      session: data.session
        ? {
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
          }
        : null,
    });
  } catch (err: any) {
    console.error("[verify-otp] Unexpected error:", err);
    return NextResponse.json(
      { error: "Failed to verify OTP due to a server error." },
      { status: 500 }
    );
  }
}