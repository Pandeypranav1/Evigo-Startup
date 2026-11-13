import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  authorizeBookingPayment,
  isValidBookingId,
} from "../src/lib/payment/booking-authorization.ts";
import {
  authorizeBookingStatusUpdate,
  isBookingStatusUpdate,
} from "../src/lib/booking-workflow.ts";

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

  describe("booking status update authorization", () => {
    const booking = {
      userId: "customer-123",
      clientId: "customer-123",
      providerIds: [],
      providerId: "provider-owner",
      currentStatus: "pending",
    };

    it("does not allow clients or providers to reset a booking to pending", () => {
      assert.deepEqual(
        authorizeBookingStatusUpdate({ ...booking, targetStatus: "pending" }),
        { authorized: false, reason: "INVALID_TRANSITION" }
      );
      assert.deepEqual(
        authorizeBookingStatusUpdate({
          ...booking,
          userId: "provider-owner",
          targetStatus: "pending",
        }),
        { authorized: false, reason: "INVALID_TRANSITION" }
      );
    });

    it("allows only the assigned provider to confirm a pending booking", () => {
      assert.deepEqual(
        authorizeBookingStatusUpdate({ ...booking, targetStatus: "confirmed" }),
        { authorized: false, reason: "NOT_AUTHORIZED" }
      );
      assert.deepEqual(
        authorizeBookingStatusUpdate({
          ...booking,
          userId: "provider-owner",
          providerIds: ["provider-owner"],
          clientId: "another-customer",
          targetStatus: "confirmed",
        }),
        { authorized: true }
      );
    });

    it("allows only the booking client to cancel an active booking", () => {
      assert.deepEqual(
        authorizeBookingStatusUpdate({ ...booking, targetStatus: "cancelled" }),
        { authorized: true }
      );
      assert.deepEqual(
        authorizeBookingStatusUpdate({
          ...booking,
          userId: "another-customer",
          targetStatus: "cancelled",
        }),
        { authorized: false, reason: "NOT_AUTHORIZED" }
      );
      assert.deepEqual(
        authorizeBookingStatusUpdate({
          ...booking,
          currentStatus: "accepted",
          targetStatus: "cancelled",
        }),
        { authorized: true }
      );
    });

    it("accepts only known booking status values", () => {
      assert.equal(isBookingStatusUpdate("pending"), true);
      assert.equal(isBookingStatusUpdate("completed"), true);
      assert.equal(isBookingStatusUpdate("paid"), false);
      assert.equal(isBookingStatusUpdate(null), false);
    });

    it("does not allow invalid transitions from finalized bookings", () => {
      assert.deepEqual(
        authorizeBookingStatusUpdate({
          ...booking,
          userId: "provider-owner",
          providerIds: ["provider-owner"],
          currentStatus: "completed",
          targetStatus: "confirmed",
        }),
        { authorized: false, reason: "INVALID_TRANSITION" }
      );
    });
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
