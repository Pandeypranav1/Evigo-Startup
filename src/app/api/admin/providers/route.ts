import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { getAuthenticatedUser } from "@/lib/server";
import { isAuthorizedAdmin } from "@/lib/admin";
import {
    buildProviderReviewUpdate,
    PROVIDER_REVIEW_ACTIONS,
    PROVIDER_REVIEW_REQUIRED_STATUS,
    type ProviderReviewAction,
} from "@/lib/provider-workflow";

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
        const allowed = new Set(["all", "pending", "approved", "rejected", "suspended"]);

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
            suspended: providers.filter((provider) => provider.registration_status === "suspended").length,
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
        const action = String(body.action ?? "").trim().toLowerCase() as ProviderReviewAction;

        if (!providerId) {
            return NextResponse.json({ success: false, error: "Provider id is required." }, { status: 400 });
        }

        if (!PROVIDER_REVIEW_ACTIONS.includes(action)) {
            return NextResponse.json(
                { success: false, error: "Action must be approve, reject, suspend, or reinstate." },
                { status: 400 }
            );
        }

        const reason = String(body.admin_note ?? body.reason ?? "").trim();
        if (action === "reject" && !reason) {
            return NextResponse.json({ success: false, error: "Rejection reason is required." }, { status: 400 });
        }

        const supabase = createAdminClient();

        const { data: target, error: lookupError } = await supabase
            .from("providers")
            .select("id, user_id, registration_status")
            .eq("id", providerId)
            .maybeSingle();

        if (lookupError) {
            console.error("[PATCH /api/admin/providers] lookup error:", lookupError);
            return NextResponse.json(
                { success: false, error: "Unable to load the provider application.", code: "PROVIDER_LOOKUP_FAILED" },
                { status: 500 }
            );
        }
        if (!target) {
            return NextResponse.json(
                { success: false, error: "Provider application not found.", code: "APPLICATION_NOT_FOUND" },
                { status: 404 }
            );
        }
        if (target.user_id && target.user_id === authorization.user.id) {
            return NextResponse.json(
                { success: false, error: "You cannot review your own provider application.", code: "SELF_REVIEW_FORBIDDEN" },
                { status: 403 }
            );
        }

        const requiredStatus = PROVIDER_REVIEW_REQUIRED_STATUS[action];
        if (target.registration_status !== requiredStatus) {
            return NextResponse.json(
                {
                    success: false,
                    error: `This application cannot be ${action === "reinstate" ? "reinstated" : `${action}d`} from its current status.`,
                    code: "INVALID_STATUS_TRANSITION",
                },
                { status: 409 }
            );
        }

        const { data, error } = await supabase
            .from("providers")
            .update(buildProviderReviewUpdate(action, reason || undefined))
            .eq("id", providerId)
            .eq("registration_status", requiredStatus)
            .select()
            .maybeSingle();

        if (error) {
            console.error(`[PATCH /api/admin/providers] ${action} error:`, error);
            return NextResponse.json(
                { success: false, error: `Provider application ${action} failed.`, code: "PROVIDER_REVIEW_UPDATE_FAILED" },
                { status: 500 }
            );
        }
        if (!data) {
            return NextResponse.json(
                { success: false, error: "The application was not found or is no longer in a reviewable state.", code: "APPLICATION_NOT_REVIEWABLE" },
                { status: 409 }
            );
        }

        const actionLabels: Record<ProviderReviewAction, string> = {
            approve: "approved",
            reject: "rejected",
            suspend: "suspended",
            reinstate: "reinstated",
        };

        return NextResponse.json({ success: true, provider: data, message: `Provider ${actionLabels[action]} successfully.` });
    } catch (err: any) {
        console.error("[PATCH /api/admin/providers] request failed:", err);
        return NextResponse.json(
            { success: false, error: "Unable to process provider application review.", code: "PROVIDER_REVIEW_UPDATE_FAILED" },
            { status: 500 }
        );
    }
}
