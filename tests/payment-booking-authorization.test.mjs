import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  authorizeBookingPayment,
  isValidBookingId,
} from "../src/lib/payment/booking-authorization.ts";

const booking = {
  client_id: "customer-123",
  status: "pending",
  payment_status: "unpaid",
};

describe("booking payment authorization", () => {
  it("allows the authenticated owner of a payable booking", () => {
    assert.deepEqual(
      authorizeBookingPayment("customer-123", booking),
      { authorized: true, ownerMatch: true }
    );
  });

  it("denies a different authenticated user", () => {
    assert.deepEqual(
      authorizeBookingPayment("another-customer", booking),
      {
        authorized: false,
        reason: "NOT_AUTHORIZED",
        ownerMatch: false,
      }
    );
  });

  it("denies an unauthenticated request", () => {
    assert.deepEqual(authorizeBookingPayment(null, booking), {
      authorized: false,
      reason: "AUTHENTICATION_REQUIRED",
      ownerMatch: null,
    });
  });

  it("rejects an invalid booking ID before database lookup", () => {
    assert.equal(isValidBookingId("not-a-uuid"), false);
    assert.equal(
      isValidBookingId("6105241d-1d38-4274-b912-eea67f4c32b0"),
      true
    );
  });

  it("allows only pending or confirmed unpaid bookings", () => {
    assert.equal(
      authorizeBookingPayment("customer-123", {
        ...booking,
        status: "cancelled",
      }).authorized,
      false
    );
    assert.deepEqual(
      authorizeBookingPayment("customer-123", {
        ...booking,
        payment_status: "paid",
      }),
      {
        authorized: false,
        reason: "BOOKING_ALREADY_PAID",
        ownerMatch: true,
      }
    );
  });
});
