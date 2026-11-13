import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { requireAdminAccess } from "@/lib/admin-auth";

export const runtime = "nodejs";

const VALID_STATUSES = new Set(["new", "in_progress", "resolved", "archived"]);
const MAX_LIMIT = 200;

export async function GET(request: Request) {
  try {
    const auth = await requireAdminAccess();
    if (!auth.authorized) return auth.response;

    const { searchParams } = new URL(request.url);
    const status = (searchParams.get("status") || "all").toLowerCase();
    const limitParam = Number(searchParams.get("limit") || 100);
    const limit = Number.isInteger(limitParam) && limitParam > 0
      ? Math.min(limitParam, MAX_LIMIT)
      : 100;

    if (status !== "all" && !VALID_STATUSES.has(status)) {
      return NextResponse.json({ success: false, error: "Invalid status filter" }, { status: 400 });
    }

    const supabase = createAdminClient();
    let query = supabase
      .from("contact_messages")
      .select("id, name, email, message, status, created_at, submitted_by")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (status !== "all") query = query.eq("status", status);

    const { data, error } = await query;
    if (error) {
      console.error("[admin/contact-messages] GET error:", error);
      return NextResponse.json({ success: false, error: "Unable to load support messages" }, { status: 500 });
    }

    const { count } = await supabase
      .from("contact_messages")
      .select("id", { count: "exact", head: true })
      .eq("status", "new");

    return NextResponse.json({
      success: true,
      messages: data || [],
      summary: { new: count ?? 0 },
    });
  } catch (err: any) {
    console.error("[admin/contact-messages] Unexpected error:", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await requireAdminAccess();
    if (!auth.authorized) return auth.response;

    let body: Record<string, any>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, error: "Invalid JSON request body" }, { status: 400 });
    }

    const { id, status } = body || {};
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (typeof id !== "string" || !uuidRegex.test(id)) {
      return NextResponse.json({ success: false, error: "Valid message id is required" }, { status: 400 });
    }
    if (typeof status !== "string" || !VALID_STATUSES.has(status)) {
      return NextResponse.json(
        { success: false, error: `Status must be one of: ${[...VALID_STATUSES].join(", ")}` },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("contact_messages")
      .update({ status })
      .eq("id", id)
      .select("id, status")
      .maybeSingle();

    if (error) {
      console.error("[admin/contact-messages] PATCH error:", error);
      return NextResponse.json({ success: false, error: "Unable to update message" }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ success: false, error: "Message not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: data });
  } catch (err: any) {
    console.error("[admin/contact-messages] Unexpected error:", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
