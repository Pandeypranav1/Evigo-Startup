import { consumeRequestLimit, requestIdentity } from "@/lib/request-limit";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { email } = body;

    if (!email || typeof email !== "string" || !email.trim()) {
      return NextResponse.json(
        { error: "Email address is required." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!isValidEmail(normalizedEmail)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    if (!await consumeRequestLimit("otp-email", normalizedEmail, 1, 30) ||
        !await consumeRequestLimit("otp-ip", requestIdentity(request), 10, 600)) {
      return NextResponse.json({ error: "Please wait before requesting another code." }, { status: 429 });
    }

    // Server-side Supabase client with public anon key for Auth endpoints
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // CRITICAL FIX: Explicitly pass `options: { shouldCreateUser: true }`
    // so brand-new email addresses trigger user creation and receive OTP email.
    const { error } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: {
        shouldCreateUser: true,
      },
    });

    // Safe Diagnostic Logging (Never logs OTP or secrets)
    console.log("[send-otp] Diagnostic log:", {
      stage: "otp_request",
      emailDomain: normalizedEmail.split("@")[1] || "unknown",
      shouldCreateUser: true,
      success: !error,
      errorCode: (error as any)?.code || (error as any)?.status || null,
      errorMessage: error?.message || null,
    });

    if (error) {
      const msg = error.message?.toLowerCase() || "";
      if (msg.includes("rate limit") || (error as any)?.status === 429) {
        return NextResponse.json(
          { error: "You are requesting OTPs too quickly. Please wait a minute before trying again." },
          { status: 429 }
        );
      }
      if (msg.includes("signups") || msg.includes("not allowed")) {
        return NextResponse.json(
          { error: "Signups are currently disabled. Please contact system admin." },
          { status: 403 }
        );
      }
      return NextResponse.json(
        { error: error.message || "Failed to send OTP email." },
        { status: 400 }
      );
    }

    // Record rate limit timestamp only on successful dispatch


    return NextResponse.json({
      success: true,
      message: `OTP request accepted for ${normalizedEmail}. Check your inbox, Spam, or Promotions.`,
    });
  } catch (err: any) {
    console.error("[send-otp] Unexpected error:", err);
    return NextResponse.json(
      { error: "Network error or service unavailable. Please try again later." },
      { status: 500 }
    );
  }
}
