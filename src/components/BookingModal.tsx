"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/Button";
import { Modal } from "@/components/Modal";
import type { DemoProvider } from "@/lib/demoStore";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

type AvailableService = {
  id: string;
  service_name: string;
  price: number | null;
};

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
  const [eventDate, setEventDate] = useState("");
  const [location, setLocation] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [services, setServices] = useState<AvailableService[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [servicesLoading, setServicesLoading] = useState(false);
  const [servicesError, setServicesError] = useState<string | null>(null);

  const canBook = !!user && role === "client";
  const title = provider ? `Book ${provider.businessName}` : "Book";

  useEffect(() => {
    let active = true;
    if (!open || !provider) {
      setServices([]);
      setSelectedServiceId("");
      setServicesError(null);
      setServicesLoading(false);
      return () => {
        active = false;
      };
    }

    setServicesLoading(true);
    setServicesError(null);
    void fetch(`/api/public/services?provider_id=${encodeURIComponent(provider.id)}`)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok || !data.success || !Array.isArray(data.services)) {
          throw new Error(data.error || "Available services could not be loaded.");
        }
        if (active) {
          setServices(data.services);
          setSelectedServiceId(data.services[0]?.id || "");
        }
      })
      .catch((loadError) => {
        if (active) {
          setServicesError(loadError instanceof Error ? loadError.message : "Available services could not be loaded.");
        }
      })
      .finally(() => {
        if (active) setServicesLoading(false);
      });

    return () => {
      active = false;
    };
  }, [open, provider]);

  const submit = async () => {
    setError(null);
    if (submitting) return;
    if (!provider) return;
    if (!user || role !== "client") {
      router.push("/login/client");
      return;
    }
    if (!eventDate || !location.trim() || !customerName.trim() || !customerPhone.trim()) {
      setError("Please fill in the service date, location, name, and phone number.");
      return;
    }
    const service = services.find((item) => item.id === selectedServiceId);
    if (!service) {
      setError("Select an available service.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider_id: provider.id,
          provider_uuid: provider.id,
          service_id: service.id,
          service_type: service.service_name,
          event_date: eventDate,
          customer_name: customerName.trim(),
          customer_phone: customerPhone.trim(),
          customer_email: user.email,
          city: location.trim(),
          message: notes.trim() || null,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Unable to submit the booking request.");
      }
      setDone(true);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to submit the booking request.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setEventDate("");
    setLocation("");
    setCustomerName("");
    setCustomerPhone("");
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
          {!canBook && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              Please login as a client to book.{" "}
              <Link href="/login/client" className="underline font-bold">
                Login →
              </Link>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1 sm:col-span-2">
              <div className="text-xs font-semibold text-zinc-600">Available service</div>
              <select
                value={selectedServiceId}
                onChange={(event) => setSelectedServiceId(event.target.value)}
                disabled={servicesLoading || services.length === 0}
                className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-violet-400 disabled:bg-zinc-100"
              >
                <option value="">
                  {servicesLoading ? "Loading available services…" : "Select a service"}
                </option>
                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.service_name}{service.price !== null ? ` — ₹${Number(service.price).toLocaleString("en-IN")}` : ""}
                  </option>
                ))}
              </select>
              {servicesError ? (
                <span role="alert" className="text-xs text-red-600">{servicesError}</span>
              ) : !servicesLoading && services.length === 0 ? (
                <span className="text-xs text-zinc-500">This provider has no available services right now.</span>
              ) : null}
            </label>
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
              <div className="text-xs font-semibold text-zinc-600">Your name</div>
              <input
                value={customerName}
                onChange={(event) => setCustomerName(event.target.value)}
                autoComplete="name"
                className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-violet-400"
              />
            </label>
            <label className="space-y-1">
              <div className="text-xs font-semibold text-zinc-600">Phone number</div>
              <input
                type="tel"
                value={customerPhone}
                onChange={(event) => setCustomerPhone(event.target.value)}
                autoComplete="tel"
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
            <Button onClick={submit} disabled={submitting || !canBook || servicesLoading || !selectedServiceId}>
              {submitting ? "Submitting…" : "Submit Booking"}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
