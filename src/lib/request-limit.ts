import { createHash } from "node:crypto";
import { createAdminClient } from "@/lib/supabase";

export async function consumeRequestLimit(scope: string, identity: string, limit: number, seconds: number) {
  const key = createHash("sha256").update(`${scope}:${identity}`).digest("hex");
  const { data, error } = await createAdminClient().rpc("consume_request_limit", {
    p_key: key, p_limit: limit, p_seconds: seconds,
  });
  if (error) throw new Error("Request limits unavailable");
  return data === true;
}
// Vercel overwrites this header. Other deployments must set it in a trusted proxy.
export function requestIdentity(request: Request) {
  return request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}
