import type { SupabaseClient } from "@supabase/supabase-js";

export async function comboComponentsAvailable(supabase: SupabaseClient, items: { provider_id?: string; service_id?: string }[]) {
  if (!items?.length || items.some((item) => !item.provider_id || !item.service_id)) return false;
  const providerIds = [...new Set(items.map((item) => item.provider_id!))];
  const serviceIds = [...new Set(items.map((item) => item.service_id!))];
  const [providers, services] = await Promise.all([
    supabase.from("providers").select("id").in("id", providerIds).eq("registration_status", "approved").eq("is_verified", true).eq("is_bookable", true),
    supabase.from("services").select("id,provider_id").in("id", serviceIds).eq("is_available", true),
  ]);
  if (providers.error || services.error) throw new Error("Package eligibility unavailable");
  return items.every((item) => providers.data?.some((p) => p.id === item.provider_id) &&
    services.data?.some((s) => s.id === item.service_id && s.provider_id === item.provider_id));
}
