export const NEW_PROVIDER_REGISTRATION_STATE = {
  registration_status: "pending",
  is_verified: false,
  is_bookable: false,
} as const;

export type ProviderReviewAction = "approve" | "reject" | "suspend" | "reinstate";

export const PROVIDER_REVIEW_ACTIONS: readonly ProviderReviewAction[] = [
  "approve",
  "reject",
  "suspend",
  "reinstate",
];

// Each review action is only valid from one current registration_status.
// The admin API enforces this server-side with an eq() filter on the row.
export const PROVIDER_REVIEW_REQUIRED_STATUS: Record<ProviderReviewAction, string> = {
  approve: "pending",
  reject: "pending",
  suspend: "approved",
  reinstate: "suspended",
};

export function isProviderAccountRole(role: unknown): role is "provider" {
  return role === "provider";
}

export function ownsProviderResource(
  providerIds: readonly string[],
  resourceProviderId: string | null | undefined
): boolean {
  return Boolean(resourceProviderId && providerIds.includes(resourceProviderId));
}

export function buildProviderReviewUpdate(
  action: ProviderReviewAction,
  reason?: string
) {
  switch (action) {
    case "approve":
      return {
        registration_status: "approved",
        is_verified: true,
        is_bookable: true,
        admin_note: null,
      } as const;
    case "reject":
      return {
        registration_status: "rejected",
        is_verified: false,
        is_bookable: false,
        admin_note: reason ?? "",
      } as const;
    case "suspend":
      return {
        registration_status: "suspended",
        is_bookable: false,
        admin_note: reason ?? "",
      } as const;
    case "reinstate":
      return {
        registration_status: "approved",
        is_verified: true,
        is_bookable: true,
        admin_note: null,
      } as const;
  }
}
