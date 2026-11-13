import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import { isAuthorizedAdmin } from "@/lib/admin";
import { getAuthenticatedUser } from "@/lib/server";

type AdminAccess =
  | { authorized: true; user: User }
  | { authorized: false; response: NextResponse };

export async function requireAdminAccess(): Promise<AdminAccess> {
  const { user, error } = await getAuthenticatedUser();

  if (error) {
    console.warn("[admin-auth] Session verification failed:", error.code);
  }
  if (!user) {
    return {
      authorized: false,
      response: NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      ),
    };
  }
  if (!isAuthorizedAdmin(user)) {
    return {
      authorized: false,
      response: NextResponse.json(
        { success: false, error: "Administrator access required" },
        { status: 403 }
      ),
    };
  }

  return { authorized: true, user };
}
