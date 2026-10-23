import { NextResponse } from "next/server";

// Legacy phone registry is retired. No current application caller uses this API.
// Supabase Auth + /api/profile own account identity; keep legacy records intact.
function retired() {
  return NextResponse.json({ error: "This legacy endpoint is retired. Use your authenticated profile." }, { status: 410 });
}
export const GET = retired;
export const POST = retired;
