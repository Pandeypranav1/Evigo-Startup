export type BookingPaymentRecord = {
  client_id?: unknown;
  status?: unknown;
  payment_status?: unknown;
};

export type BookingPaymentAuthorization =
  | { authorized: true; ownerMatch: true }
  | {
      authorized: false;
      reason:
        | "AUTHENTICATION_REQUIRED"
        | "BOOKING_NOT_FOUND"
        | "NOT_AUTHORIZED"
        | "BOOKING_NOT_PAYABLE"
        | "BOOKING_ALREADY_PAID";
      ownerMatch: boolean | null;
    };

export function isValidBookingId(bookingId: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    bookingId
  );
}

export function authorizeBookingPayment(
  userId: string | null,
  booking: BookingPaymentRecord | null
): BookingPaymentAuthorization {
  if (!userId) {
    return {
      authorized: false,
      reason: "AUTHENTICATION_REQUIRED",
      ownerMatch: null,
    };
  }

  if (!booking) {
    return {
      authorized: false,
      reason: "BOOKING_NOT_FOUND",
      ownerMatch: null,
    };
  }

  const ownerMatch = booking.client_id === userId;

  if (!ownerMatch) {
    return { authorized: false, reason: "NOT_AUTHORIZED", ownerMatch };
  }

  const status = String(booking.status || "").toLowerCase();
  if (!["pending", "confirmed"].includes(status)) {
    return { authorized: false, reason: "BOOKING_NOT_PAYABLE", ownerMatch };
  }

  if (String(booking.payment_status || "").toLowerCase() === "paid") {
    return {
      authorized: false,
      reason: "BOOKING_ALREADY_PAID",
      ownerMatch,
    };
  }

  return { authorized: true, ownerMatch };
}
