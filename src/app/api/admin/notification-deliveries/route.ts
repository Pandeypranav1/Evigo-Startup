import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { requireAdminAccess } from "@/lib/admin-auth";
import { retryEmailDelivery } from "@/lib/notifications";

export const runtime = "nodejs";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: Request) {
  try {
    const auth = await requireAdminAccess();
    if (!auth.authorized) return auth.response;

    const { searchParams } = new URL(request.url);
    const status = (searchParams.get("status") || "failed").toLowerCase();
    const limitParam = Number(searchParams.get("limit") || 100);
    const limit = Number.isInteger(limitParam) && limitParam > 0
      ? Math.min(limitParam, 200)
      : 100;

    const supabase = createAdminClient();
    let query = supabase
      .from("notification_deliveries")
      .select("id, user_id, booking_id, channel, event_type, recipient, subject, status, attempts, last_error, created_at, sent_at")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (status !== "all") query = query.eq("status", status);

    const { data, error } = await query;
    if (error) {
      console.error("[admin/notification-deliveries] GET error:", error);
      return NextResponse.json({ success: false, error: "Unable to load delivery log" }, { status: 500 });
    }

    return NextResponse.json({ success: true, deliveries: data || [] });
  } catch (err: any) {
    console.error("[admin/notification-deliveries] Unexpected error:", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAdminAccess();
    if (!auth.authorized) return auth.response;

    let body: Record<string, any>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, error: "Invalid JSON request body" }, { status: 400 });
    }

    const deliveryId = body?.delivery_id;
    if (typeof deliveryId !== "string" || !UUID_REGEX.test(deliveryId)) {
      return NextResponse.json({ success: false, error: "Valid delivery_id is required" }, { status: 400 });
    }

    const result = await retryEmailDelivery(deliveryId);
    if (!result.success) {
      const notFound = result.error === "Delivery not found";
      const notRetryable = result.error?.startsWith("Delivery is not in a retryable state");
      return NextResponse.json(
        { success: false, error: result.error || "Retry failed" },
        { status: notFound ? 404 : notRetryable ? 409 : 500 }
      );
    }

    return NextResponse.json({ success: true, status: result.status });
  } catch (err: any) {
    console.error("[admin/notification-deliveries] Unexpected error:", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
