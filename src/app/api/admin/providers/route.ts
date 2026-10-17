import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { getAuthenticatedUser } from "@/lib/server";
import { isAuthorizedAdmin } from "@/lib/admin";
import { buildProviderReviewUpdate } from "@/lib/provider-workflow";

export const runtime = "nodejs";

async function authorizeAdmin() {
    const { user, error } = await getAuthenticatedUser();
    if (error) {
        console.warn("[admin/providers] session verification failed:", error.code);
    }
    if (!user) {
        return {
            response: NextResponse.json(
                { success: false, error: "A valid signed-in session is required.", code: "AUTHENTICATION_REQUIRED" },
                { status: 401 }
            ),
        };
    }

    if (!isAuthorizedAdmin(user)) {
        return {
            response: NextResponse.json(
                { success: false, error: "This account is not authorized to review provider applications.", code: "ADMIN_REQUIRED" },
                { status: 403 }
            ),
        };
    }

    return { user };
}

export async function GET(request: Request) {
    try {
        const authorization = await authorizeAdmin();
        if ("response" in authorization) return authorization.response;

        const { searchParams } = new URL(request.url);
        const status = (searchParams.get("status") ?? "all").toLowerCase();
        const allowed = new Set(["all", "pending", "approved", "rejected"]);

        if (!allowed.has(status)) {
            return NextResponse.json({ success: false, error: "Invalid status filter" }, { status: 400 });
        }

        const supabase = createAdminClient();
        const { data: allProviders, error } = await supabase
            .from("providers")
            .select("*")
            .order("submitted_at", { ascending: false });

        if (error) {
            console.error("[GET /api/admin/providers] query error:", error);
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        const providers = allProviders ?? [];
        const summary = {
            total: providers.length,
            pending: providers.filter((provider) => provider.registration_status === "pending").length,
            approved: providers.filter((provider) => provider.registration_status === "approved").length,
            rejected: providers.filter((provider) => provider.registration_status === "rejected").length,
        };

        const filteredProviders =
            status === "all"
                ? providers
                : providers.filter((provider) => provider.registration_status === status);

        return NextResponse.json({ success: true, providers: filteredProviders, summary });
    } catch (err: any) {
        console.error("[GET /api/admin/providers] request failed:", err);
        return NextResponse.json(
            { success: false, error: "Unable to load provider applications.", code: "PROVIDER_REVIEW_LOAD_FAILED" },
            { status: 500 }
        );
    }
}

export async function PATCH(request: Request) {
    try {
        const authorization = await authorizeAdmin();
        if ("response" in authorization) return authorization.response;

        const body = await request.json();
        const providerId = String(body.id ?? "").trim();
        const action = String(body.action ?? "").trim().toLowerCase();

        if (!providerId) {
            return NextResponse.json({ success: false, error: "Provider id is required." }, { status: 400 });
        }

        if (!['approve', 'reject'].includes(action)) {
            return NextResponse.json({ success: false, error: "Action must be approve or reject." }, { status: 400 });
        }

        const supabase = createAdminClient();

        if (action === "approve") {
            const { data, error } = await supabase
                .from("providers")
                .update(buildProviderReviewUpdate("approve"))
                .eq("id", providerId)
                .eq("registration_status", "pending")
                .select()
                .maybeSingle();

            if (error) {
                console.error("[PATCH /api/admin/providers] approve error:", error);
                return NextResponse.json(
                    { success: false, error: "Provider application approval failed.", code: "PROVIDER_APPROVAL_FAILED" },
                    { status: 500 }
                );
            }
            if (!data) {
                return NextResponse.json(
                    { success: false, error: "The application was not found or is no longer pending.", code: "APPLICATION_NOT_PENDING" },
                    { status: 409 }
                );
            }

            return NextResponse.json({ success: true, provider: data, message: "Provider approved successfully." });
        }

        const reason = String(body.admin_note ?? body.reason ?? "").trim();
        if (!reason) {
            return NextResponse.json({ success: false, error: "Rejection reason is required." }, { status: 400 });
        }

        const { data, error } = await supabase
            .from("providers")
            .update(buildProviderReviewUpdate("reject", reason))
            .eq("id", providerId)
            .eq("registration_status", "pending")
            .select()
            .maybeSingle();

        if (error) {
            console.error("[PATCH /api/admin/providers] reject error:", error);
            return NextResponse.json(
                { success: false, error: "Provider application rejection failed.", code: "PROVIDER_REJECTION_FAILED" },
                { status: 500 }
            );
        }
        if (!data) {
            return NextResponse.json(
                { success: false, error: "The application was not found or is no longer pending.", code: "APPLICATION_NOT_PENDING" },
                { status: 409 }
            );
        }

        return NextResponse.json({ success: true, provider: data, message: "Provider rejected successfully." });
    } catch (err: any) {
        console.error("[PATCH /api/admin/providers] request failed:", err);
        return NextResponse.json(
            { success: false, error: "Unable to process provider application review.", code: "PROVIDER_REVIEW_UPDATE_FAILED" },
            { status: 500 }
        );
    }
}
