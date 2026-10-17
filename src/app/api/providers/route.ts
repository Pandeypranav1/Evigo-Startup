import { NextResponse } from "next/server";
import { createClient, getAuthenticatedUser } from "@/lib/server";
import { searchApprovedProviders, toPublicProviderListing } from "@/lib/provider-search";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id");
    const category = searchParams.get("category");
    const city = searchParams.get("city");
    const budgetParam = searchParams.get("budget");
    const requestedLimit = Number(searchParams.get("limit") ?? "50");
    if (!Number.isInteger(requestedLimit) || requestedLimit < 1) {
      return NextResponse.json({ success: false, error: "Limit must be a positive integer." }, { status: 400 });
    }
    const budget = budgetParam === null ? undefined : Number(budgetParam);
    if (budgetParam !== null && (budget === undefined || !Number.isFinite(budget) || budget < 0)) {
      return NextResponse.json({ success: false, error: "Budget must be a non-negative number." }, { status: 400 });
    }
    const limit = Math.min(requestedLimit, 100);

    if (userId) {
      const { user, error: authError, supabase } = await getAuthenticatedUser();
      if (authError || !user) {
        return NextResponse.json({ success: false, error: "Sign in to view your provider application.", code: "AUTHENTICATION_REQUIRED" }, { status: 401 });
      }
      if (user.id !== userId) {
        return NextResponse.json({ success: false, error: "You can only view your own provider application.", code: "FORBIDDEN" }, { status: 403 });
      }

      const { data, error } = await supabase
        .from("providers")
        .select("*")
        .eq("user_id", user.id)
        .order("submitted_at", { ascending: false });

      if (error) {
        console.error("[GET /api/providers] Supabase error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        providers: data ?? [],
      });
    }

    const supabase = await createClient();
    const providers = await searchApprovedProviders(supabase, {
      ...(category && category !== "All" ? { category } : {}),
      ...(city ? { city } : {}),
      ...(budget !== undefined ? { budget } : {}),
      limit,
    });

    return NextResponse.json({
      success: true,
      providers: providers.map(toPublicProviderListing),
    });
  } catch (err: any) {
    console.error("[GET /api/providers] unexpected error:", err);
    return NextResponse.json(
      { success: false, error: "Provider listings are temporarily unavailable. Please try again later.", code: "PROVIDER_LISTING_QUERY_FAILED" },
      { status: 503 }
    );
  }
}

export async function POST(request: Request) {
  return NextResponse.json(
    { success: false, error: "Provider registration is handled via /api/providers/register." },
    { status: 405 }
  );
}
