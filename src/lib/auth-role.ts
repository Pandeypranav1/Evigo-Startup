export type AccountRole = "client" | "provider";

export function isAccountRole(value: unknown): value is AccountRole {
  return value === "client" || value === "provider";
}

export function resolveAccountRole(
  existingRole: unknown,
  requestedRole: unknown
): AccountRole | null {
  if (existingRole !== null && existingRole !== undefined) {
    return isAccountRole(existingRole) ? existingRole : null;
  }
  return isAccountRole(requestedRole) ? requestedRole : null;
}

export function getDashboardPath(role: AccountRole): string {
  return role === "provider" ? "/provider/dashboard" : "/dashboard";
}
