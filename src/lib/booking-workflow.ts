export type BookingStatusUpdate =
  | "pending"
  | "confirmed"
  | "rejected"
  | "cancelled"
  | "completed";

const BOOKING_STATUS_UPDATES: readonly BookingStatusUpdate[] = [
  "pending",
  "confirmed",
  "rejected",
  "cancelled",
  "completed",
];

export function isBookingStatusUpdate(value: unknown): value is BookingStatusUpdate {
  return typeof value === "string" && BOOKING_STATUS_UPDATES.some((status) => status === value);
}

type BookingStatusUpdateAuthorization =
  | { authorized: true }
  | { authorized: false; reason: "NOT_AUTHORIZED" | "INVALID_TRANSITION" };

export function authorizeBookingStatusUpdate({
  userId,
  clientId,
  providerIds,
  providerId,
  currentStatus,
  targetStatus,
}: {
  userId: string;
  clientId: string | null;
  providerIds: readonly string[];
  providerId: string | null;
  currentStatus: string;
  targetStatus: BookingStatusUpdate;
}): BookingStatusUpdateAuthorization {
  const status = currentStatus.toLowerCase();

  if (targetStatus === "pending") {
    return { authorized: false, reason: "INVALID_TRANSITION" };
  }

  if (targetStatus === "cancelled") {
    if (clientId !== userId) {
      return { authorized: false, reason: "NOT_AUTHORIZED" };
    }
    return ["pending", "confirmed", "accepted"].includes(status)
      ? { authorized: true }
      : { authorized: false, reason: "INVALID_TRANSITION" };
  }

  if (!providerIds.includes(providerId ?? "")) {
    return { authorized: false, reason: "NOT_AUTHORIZED" };
  }

  const validTransition = targetStatus === "completed"
    ? ["confirmed", "accepted"].includes(status)
    : status === "pending";

  return validTransition
    ? { authorized: true }
    : { authorized: false, reason: "INVALID_TRANSITION" };
}
