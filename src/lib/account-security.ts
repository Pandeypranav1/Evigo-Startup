import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/server";

// For non-payment administration only. Identity headers and browser roles are never authority.
export async function authorizeAccountAdmin() {
  const { user } = await getAuthenticatedUser();
  if (!user) return { response: NextResponse.json({ error: "Authentication required" }, { status: 401 }) };
  const emails = (process.env.ADMIN_PROVIDER_EMAILS || "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  const allowed = user.app_metadata?.role === "admin" ||
    (!!user.email_confirmed_at && !!user.email && emails.includes(user.email.toLowerCase()));
  if (!allowed) return { response: NextResponse.json({ error: "Administrator access required" }, { status: 403 }) };
  return { user };
}
