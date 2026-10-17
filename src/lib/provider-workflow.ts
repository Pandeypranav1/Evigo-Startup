export const NEW_PROVIDER_REGISTRATION_STATE = {
  registration_status: "pending",
  is_verified: false,
  is_bookable: false,
} as const;

export function isProviderAccountRole(role: unknown): role is "provider" {
  return role === "provider";
}

export function buildProviderReviewUpdate(action: "approve" | "reject", reason?: string) {
  if (action === "approve") {
    return {
      registration_status: "approved",
      is_verified: true,
      is_bookable: true,
    } as const;
  }

  return {
    registration_status: "rejected",
    is_verified: false,
    is_bookable: false,
    admin_note: reason ?? "",
  } as const;
}
