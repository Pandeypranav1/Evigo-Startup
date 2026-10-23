export function providerOwnsBooking(providerIds: string[], booking: { provider_uuid?: string | null }) {
  return !!booking.provider_uuid && providerIds.includes(booking.provider_uuid);
}
export function validBookingTransition(current: string, next: string, actor: "client" | "provider") {
  if (actor === "client") return next === "cancelled" && ["pending", "confirmed"].includes(current);
  return (current === "pending" && ["confirmed", "rejected"].includes(next)) ||
    (["confirmed", "accepted"].includes(current) && next === "completed");
}
export function isEligibleProvider(provider: { registration_status?: string; is_verified?: boolean; is_bookable?: boolean } | null) {
  return provider?.registration_status === "approved" && provider.is_verified === true && provider.is_bookable === true;
}
export function validBookingDate(value: unknown, today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" })) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value && value >= today;
}
