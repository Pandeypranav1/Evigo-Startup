"use client";

import { useState, useEffect } from "react";
import { ComboPackImage } from "@/components/ComboPackImage";
import Link from "next/link";
import { ComboPack, ComboBooking, COMBO_CATEGORY_METADATA } from "@/lib/combo";
import { useAuth } from "@/context/AuthContext";

interface ComboBookingModalProps {
  pack: ComboPack;
  onClose: () => void;
  onBookingSuccess?: (booking: ComboBooking) => void;
}

export function ComboBookingModal({ pack, onClose, onBookingSuccess }: ComboBookingModalProps) {
  const { user } = useAuth();

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState(user?.email || "");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [guestCount, setGuestCount] = useState(1);
  const [pickupLocation, setPickupLocation] = useState("");
  const [dropLocation, setDropLocation] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<ComboBooking | null>(null);

  const meta = COMBO_CATEGORY_METADATA[pack.category] || {
    icon: "🎁",
    label: pack.category,
    gradient: "from-violet-500 to-indigo-600",
  };

  const hasTransport = (pack.items || []).some(
    (item) =>
      item.service_type.toLowerCase().includes("transport") ||
      item.service_type.toLowerCase().includes("transfer") ||
      item.service_type.toLowerCase().includes("cab")
  );

  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date(tomorrow);
    dayAfter.setDate(dayAfter.getDate() + 1);
    setStartDate(tomorrow.toISOString().slice(0, 10));
    setEndDate(dayAfter.toISOString().slice(0, 10));
  }, []);

  useEffect(() => {
    if (user?.email) setCustomerEmail((current) => current || user.email);
  }, [user?.email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingError(null);

    if (!customerName.trim() || !customerPhone.trim() || !startDate) {
      setBookingError("Please provide your full name, mobile number, and preferred start date.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        combo_pack_id: pack.id,
        slug: pack.slug,
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        customer_email: customerEmail.trim() || undefined,
        start_date: startDate,
        end_date: endDate || startDate,
        guest_count: guestCount,
        pickup_location: pickupLocation.trim() || undefined,
        drop_location: dropLocation.trim() || undefined,
        special_requests: specialRequests.trim() || undefined,
      };

      const res = await fetch("/api/combo-packs/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to submit combo package request.");
      }

      setConfirmedBooking(data.booking);
      onBookingSuccess?.(data.booking);
    } catch (err: any) {
      setBookingError(err.message || "An unexpected error occurred while submitting your request.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm sm:p-6 overflow-y-auto"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative my-8 max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-violet-100 bg-white text-slate-800 shadow-2xl">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 z-20 grid h-10 w-10 place-items-center rounded-full border border-slate-200 bg-white/90 text-lg text-slate-700 shadow-sm transition-colors hover:bg-slate-100"
        >
          ✕
        </button>

        {!confirmedBooking ? (
          <div>
            {/* Header Image */}
            <div className="relative aspect-[16/7] w-full bg-slate-100">
              <ComboPackImage
                slug={pack.slug}
                name={pack.name}
                fallbackIcon={meta.icon}
                fallbackLabel={pack.category === "Custom Combo" ? "Photo depends on your itinerary" : undefined}
                sizes="(max-width: 768px) 100vw, 768px"
                className="object-cover"
                creditClassName="text-[10px] leading-4 text-white/90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/30 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-violet-900 shadow-sm backdrop-blur-md">
                    {meta.icon} {pack.category}
                  </span>
                  <span className="rounded-full bg-black/50 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md">
                    📍 {pack.city}
                  </span>
                </div>
                <h2 className="mt-2 text-2xl font-black text-white sm:text-3xl">
                  {pack.name}
                </h2>
              </div>
            </div>

            {/* Content Body */}
            <div className="p-6 sm:p-8 space-y-6">
              {/* Description */}
              <div>
                <p className="text-sm leading-relaxed text-slate-600">
                  {pack.description}
                </p>
              </div>

              {/* Included Services Breakdown */}
              <div className="rounded-2xl border border-violet-100 bg-violet-50/50 p-5">
                <h3 className="text-xs font-black uppercase tracking-widest text-violet-700">
                  Included Verified Services ({pack.items?.length || 0})
                </h3>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {pack.items && pack.items.length > 0 ? (
                    pack.items.map((item, i) => (
                      <div
                        key={item.id || i}
                        className="flex items-start gap-3 rounded-xl border border-violet-100 bg-white p-3 shadow-xs"
                      >
                        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-violet-100 text-xs font-bold text-violet-700">
                          ✓
                        </span>
                        <div>
                          <div className="text-sm font-bold text-slate-900">
                            {item.service_type}
                            {item.quantity > 1 && ` (x${item.quantity})`}
                          </div>
                          <div className="text-xs text-slate-500">
                            {item.provider_name || "Verified Local Provider"}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-slate-500">
                      Standard package services bundle
                    </div>
                  )}
                </div>
              </div>

              {/* Pricing Notice */}
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-violet-200 bg-gradient-to-r from-violet-50 to-indigo-50/60 p-4">
                <div>
                  <div className="text-xs font-bold text-violet-800">
                    Transparent Vendor Quote
                  </div>
                  <div className="text-sm text-slate-600 mt-0.5">
                    No hidden markups. You receive direct quotes from approved providers for your requested dates.
                  </div>
                </div>

                <div className="text-right text-xs text-slate-600 font-medium">
                  <div>⏱️ Duration: <strong className="text-slate-900">{pack.duration}</strong></div>
                  <div>🛡️ Verified Evigo Quality Standards</div>
                </div>
              </div>

              {/* Booking / Quote Form */}
              <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                <h3 className="text-xs font-black uppercase tracking-widest text-violet-700">
                  Request Package Quote &amp; Availability
                </h3>

                {bookingError && (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">
                    {bookingError}
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="e.g. Rahul Sharma"
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="e.g. 9876543210"
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Email Address (Optional)
                    </label>
                    <input
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="e.g. rahul@example.com"
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Number of Guests / Travelers
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={guestCount}
                      onChange={(e) => setGuestCount(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Start Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 focus:outline-none"
                    />
                  </div>
                </div>

                {hasTransport && (
                  <div className="grid gap-4 sm:grid-cols-2 pt-1">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Pickup Location / Station / Hotel
                      </label>
                      <input
                        type="text"
                        value={pickupLocation}
                        onChange={(e) => setPickupLocation(e.target.value)}
                        placeholder="e.g. Patna Airport or Jamui Station"
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Drop / Tour Destination
                      </label>
                      <input
                        type="text"
                        value={dropLocation}
                        onChange={(e) => setDropLocation(e.target.value)}
                        placeholder="e.g. Bodh Gaya, Rajgir, or hotel"
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Special Requests / Custom Notes
                  </label>
                  <textarea
                    rows={2}
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                    placeholder="e.g. Meal preferences, senior citizen assistance, extra room requirement..."
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 focus:outline-none resize-none"
                  />
                </div>

                <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="text-xs text-slate-500">
                    🔒 Request is forwarded to assigned verified partners for schedule confirmation.
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full sm:w-auto min-w-[200px] rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-violet-500/25 transition-all hover:scale-105 hover:brightness-110 disabled:opacity-50"
                  >
                    {submitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                        <span>Submitting Request...</span>
                      </span>
                    ) : (
                      "Submit Quote Request"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : (
          /* Confirmation Success State */
          <div className="p-8 text-center space-y-6">
            <div className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-emerald-100 border border-emerald-200 text-4xl text-emerald-600">
              🎉
            </div>

            <div>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
                Package Request Submitted Successfully
              </span>
              <h2 className="mt-3 text-2xl sm:text-3xl font-black text-slate-900">
                Booking ID #{confirmedBooking.id.slice(-6).toUpperCase()}
              </h2>
              <p className="mt-2 text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                Your request for <strong>{confirmedBooking.combo_name || pack.name}</strong> has been received. Our verified partner team will contact you with exact schedule and quote confirmation.
              </p>
            </div>

            {/* Item Status Breakdown */}
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5 text-left max-w-lg mx-auto">
              <div className="text-xs font-bold uppercase tracking-wider text-violet-700 mb-3">
                Requested Package Services
              </div>
              <div className="space-y-2.5">
                {confirmedBooking.items && confirmedBooking.items.length > 0 ? (
                  confirmedBooking.items.map((it, idx) => (
                    <div
                      key={it.id || idx}
                      className="flex items-center justify-between rounded-xl bg-white border border-slate-100 p-3 text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-900">{it.service_type}</div>
                        <div className="text-slate-500">{it.provider_name || "Verified Partner"}</div>
                      </div>
                      <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700 border border-amber-200">
                        {it.provider_booking_status || "pending"}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-slate-500">Package services logged for provider review.</div>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link
                href="/dashboard"
                onClick={onClose}
                className="w-full sm:w-auto rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-3.5 text-xs font-bold text-white shadow-md shadow-violet-500/20 hover:scale-105 transition-all"
              >
                View in Client Dashboard &rarr;
              </Link>
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Close Window
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
