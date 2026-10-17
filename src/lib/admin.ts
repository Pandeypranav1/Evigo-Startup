export function getAdminEmails(): string[] {
    const raw =
        process.env.ADMIN_PROVIDER_EMAILS ??
        process.env.NEXT_PUBLIC_ADMIN_PROVIDER_EMAILS ??
        "";

    return raw
        .split(",")
        .map((entry) => entry.trim().toLowerCase())
        .filter(Boolean);
}

export function isAllowedAdminEmail(email?: string | null): boolean {
    if (!email) return false;
    const normalized = email.trim().toLowerCase();
    return getAdminEmails().includes(normalized);
}

export function isAuthorizedAdmin(user?: {
    email?: string | null;
    app_metadata?: Record<string, unknown> | null;
} | null): boolean {
    return user?.app_metadata?.role === "admin" || isAllowedAdminEmail(user?.email);
}
