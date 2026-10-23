"use client";
import Link from "next/link";

import { useState } from "react";
import { Button } from "@/components/Button";
import { Modal } from "@/components/Modal";
import type { DemoProvider } from "@/lib/demoStore";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export function BookingModal({
  open,
  provider,
  onClose,
}: {
  open: boolean;
  provider: DemoProvider | null;
  onClose: () => void;
}) {
  const { user, role } = useAuth();
  const router = useRouter();
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const canBook = !!user && role === "client";
  const title = provider ? `Book ${provider.businessName}` : "Book";

  const submit = async () => {
    if (submitting) return;
    setError(null);
    if (!provider) return;
    if (!user || role !== "client") {
      router.push("/login/client");
      return;
    }
    if (!eventDate || !location || !customerName.trim() || !customerPhone.trim()) {
      setError("Enter your name, phone, event date and location.");
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch("/api/bookings", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider_id: provider.id, provider_uuid: provider.id,
          provider_name: provider.businessName, service_type: provider.category,
          event_date: eventDate, customer_name: customerName.trim(), customer_phone: customerPhone.trim(),
          customer_email: user.email, city: location.trim(), message: notes.trim(), client_id: user.id }),
      });
      const data = await response.json();
      if (!response.ok || !data.success || !data.booking?.id) throw new Error(data.error || "Unable to save booking request");
      setDone(true);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to save booking request");
    } finally { setSubmitting(false); }

  };

  const handleClose = () => {
    if (submitting) return;
    setCustomerName("");
    setCustomerPhone("");
    setEventDate("");
    setLocation("");
    setNotes("");
    setError(null);
    setDone(false);
    onClose();
  };

  return (
    <Modal open={open} title={title} onClose={handleClose}>
      {!provider ? null : done ? (
        <div className="text-center py-4">
          <div style={{ fontSize: 48 }}>✅</div>
          <div className="mt-3 text-lg font-black text-zinc-900">Booking Requested!</div>
          <div className="mt-1 text-sm font-semibold text-zinc-500">
            Your request has been sent to {provider.businessName}.
          </div>
          <Button onClick={handleClose} className="mt-5 w-full">
            Close
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <label className="block text-sm">Your name
            <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} maxLength={150} autoComplete="name" className="mt-1 w-full rounded-lg border p-2" />
          </label>
          <label className="block text-sm">Phone number
            <input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} type="tel" maxLength={20} autoComplete="tel" className="mt-1 w-full rounded-lg border p-2" />
          </label>
          {!canBook && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              Please login as a client to book.{" "}
              <Link href="/login/client" className="underline font-bold">
                Login →
              </Link>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1">
              <div className="text-xs font-semibold text-zinc-600">Event date</div>
              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-violet-400"
              />
            </label>
            <label className="space-y-1">
              <div className="text-xs font-semibold text-zinc-600">Location</div>
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="City / venue"
                className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-violet-400"
              />
            </label>
          </div>
          <label className="space-y-1 block">
            <div className="text-xs font-semibold text-zinc-600">Notes (optional)</div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Any requirements (timing, budget, style, etc.)"
              className="w-full resize-none rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-violet-400"
            />
          </label>

          {error && <div className="text-sm font-semibold text-red-600">{error}</div>}

          <div className="flex items-center justify-end gap-2">
            <Button variant="secondary" onClick={handleClose}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={submitting || !canBook}>
              {submitting ? "Submitting…" : "Submit Booking"}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
