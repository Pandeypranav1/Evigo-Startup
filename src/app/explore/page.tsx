"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Container } from "@/components/Container";
import { SERVICE_CATEGORIES, CATEGORY_IMAGE, EVENT_VENUES } from "@/lib/constants";
import type { ServiceCategory } from "@/lib/constants";
import { useAuth } from "@/context/AuthContext";
import { getProviderStartingPrice } from "@/lib/provider-search";
import { useRouter } from "next/navigation";

/* ─── Price bands ─── */
const PRICE_BANDS = [
  { label: "Any Price", min: 0, max: Infinity },
  { label: "Under ₹5,000", min: 0, max: 5000 },
  { label: "₹5k – ₹15k", min: 5000, max: 15000 },
  { label: "₹15k – ₹50k", min: 15000, max: 50000 },
  { label: "₹50k+", min: 50000, max: Infinity },
];

type PublicProvider = {
  id: string;
  ownerName: string;
  businessName: string;
  category: string;
  phone: string;
  city: string;
  serviceAreas: string[];
  startingPrice: number | null;
  priceRange: string | null;
  rating: number | null;
  experienceYears: number;
  description: string;
  imageUrl: string;
};

type ProviderSort = "name" | "rating" | "price";

const RESULTS_PER_PAGE = 12;

type AvailableService = {
  id: string;
  service_name: string;
  description: string | null;
  price: number | null;
  category: string | null;
};

/* ─── Booking Modal ─── */
function BookingModal({
  provider,
  onClose,
}: {
  provider: PublicProvider | null;
  onClose: () => void;
}) {
  const { user, role } = useAuth();
  const router = useRouter();
  const [eventDate, setEventDate] = useState("");
  const [location, setLocation] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableServices, setAvailableServices] = useState<AvailableService[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [servicesLoading, setServicesLoading] = useState(false);
  const [servicesError, setServicesError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (!provider) {
      setEventDate("");
      setLocation("");
      setName("");
      setPhone("");
      setNotes("");
      setDone(false);
      setError(null);
      setAvailableServices([]);
      setSelectedServiceId("");
      setServicesError(null);
      setServicesLoading(false);
      return () => {
        active = false;
      };
    }

    setAvailableServices([]);
    setSelectedServiceId("");
    setServicesError(null);
    setServicesLoading(true);

    void fetch(`/api/public/services?provider_id=${encodeURIComponent(provider.id)}`)
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok || !result.success || !Array.isArray(result.services)) {
          throw new Error(result.error || "Available services could not be loaded.");
        }
        if (active) {
          setAvailableServices(result.services);
          setSelectedServiceId(result.services[0]?.id || "");
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
  }, [provider]);

  if (!provider) return null;

  const confirm = async () => {
    setError(null);
    if (submitting) return;
    if (!user || role !== "client") {
      router.push("/login/client");
      return;
    }
    if (!eventDate || !location.trim() || !name.trim() || !phone.trim()) {
      setError("Enter the event date, location, name, and phone number.");
      return;
    }
    const selectedService = availableServices.find((service) => service.id === selectedServiceId);
    if (!selectedService) {
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
          service_id: selectedService.id,
          service_type: selectedService.service_name,
          event_date: eventDate,
          customer_name: name.trim(),
          customer_phone: phone.trim(),
          customer_email: user.email,
          city: location.trim(),
          message: notes.trim() || null,
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || "Unable to submit the booking request.");
      }
      setDone(true);
    } catch (submitError) {
      console.error("[Explore] Booking request failed:", submitError);
      setError(submitError instanceof Error ? submitError.message : "Unable to submit the booking request.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 w-full max-w-[460px]" style={{ boxShadow: "0 32px 80px rgba(0,0,0,0.25)" }}>
        {done ? (
          <div className="text-center py-2">
            <div className="text-5xl">✅</div>
            <div className="text-lg font-black text-zinc-900 mt-3">Booking Requested!</div>
            <div className="text-sm text-zinc-500 mt-1.5">
              Your request for <strong>{provider.businessName}</strong> has been recorded and is awaiting provider confirmation.
            </div>
            <button onClick={onClose} className="mt-5 w-full py-3 rounded-xl text-sm font-bold text-white cursor-pointer" style={{ background: "linear-gradient(135deg,#8b5cf6,#06b6d4)", border: "none" }}>
              Close
            </button>
          </div>
        ) : (
          <>
            <div className="text-base sm:text-lg font-black text-zinc-900">Book {provider.businessName}</div>
            <div className="text-xs sm:text-[13px] text-zinc-500 mt-0.5 mb-5">{provider.category} · {provider.city}</div>
            <div className="flex flex-col gap-3.5">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-wide">Available service</span>
                <select
                  value={selectedServiceId}
                  onChange={(event) => setSelectedServiceId(event.target.value)}
                  disabled={servicesLoading || availableServices.length === 0}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 disabled:bg-zinc-100"
                >
                  <option value="">
                    {servicesLoading ? "Loading available services…" : "Select a service"}
                  </option>
                  {availableServices.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.service_name}{service.price !== null ? ` — ₹${Number(service.price).toLocaleString("en-IN")}` : ""}
                    </option>
                  ))}
                </select>
                {servicesError ? (
                  <span role="alert" className="text-xs font-semibold text-red-600">{servicesError}</span>
                ) : !servicesLoading && availableServices.length === 0 ? (
                  <span className="text-xs text-zinc-500">This provider has no available services right now.</span>
                ) : null}
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-wide">Event Date</span>
                <input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100" />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-wide">Venue / Location</span>
                <input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Wedding Hall, Patna" className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100" />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-wide">Your Name</span>
                <input value={name} onChange={e => setName(e.target.value)} autoComplete="name" className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100" />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-wide">Phone Number</span>
                <input value={phone} onChange={e => setPhone(e.target.value)} type="tel" autoComplete="tel" className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100" />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-wide">Notes (optional)</span>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Any special requirements..." className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-sm outline-none resize-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100" />
              </label>
            </div>
            {error && <p role="alert" className="mt-3 text-sm font-semibold text-red-600">{error}</p>}
            <div className="flex gap-3 mt-5">
              <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-zinc-200 bg-white text-sm font-bold text-zinc-600 cursor-pointer">Cancel</button>
              <button onClick={confirm} disabled={submitting || servicesLoading || !selectedServiceId} className="flex-1 py-2.5 rounded-xl border-none text-sm font-bold text-white cursor-pointer" style={{ background: "linear-gradient(135deg,#8b5cf6,#06b6d4)", opacity: submitting || servicesLoading || !selectedServiceId ? 0.45 : 1 }}>
                {submitting ? "Submitting…" : "Submit Request"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ─── Provider Card (DemoProvider) ─── */
function ProviderCard({ provider, onBook }: { provider: PublicProvider; onBook: (p: PublicProvider) => void }) {
  const [imgError, setImgError] = useState(false);
  const imgSrc = provider.imageUrl && !imgError ? provider.imageUrl : CATEGORY_IMAGE[provider.category as keyof typeof CATEGORY_IMAGE] ?? "/evigo-hero.png";

  return (
    <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_20px_48px_rgba(139,92,246,0.15)] hover:border-purple-300">
      <div className="relative aspect-[16/10] overflow-hidden bg-zinc-100">
        <Image src={imgSrc} alt={provider.businessName} fill className="object-cover transition-transform duration-500 hover:scale-105"
          sizes="(max-width: 600px) 100vw, (max-width: 1200px) 50vw, 33vw"
          onError={() => setImgError(true)}
        />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 55%)" }} />
        <div className="absolute top-3 left-3">
          <span className="bg-white/90 backdrop-blur-sm rounded-full px-2.5 py-1 text-[11px] font-bold text-zinc-600">{provider.category}</span>
        </div>
      </div>
      <div className="p-4">
        <div className="text-[15px] font-black text-zinc-900">{provider.businessName}</div>
        <div className="text-xs font-semibold text-zinc-500 mt-0.5">{provider.ownerName}</div>
        <div className="flex items-center gap-3 mt-2.5 text-xs font-bold text-zinc-500">
          <span>📍 {provider.city}</span>
          {provider.experienceYears > 0 && <span>⭐ {provider.experienceYears} yrs</span>}
        </div>
        <div className="mt-2 text-[15px] font-black grad-text">
          {provider.startingPrice === null
            ? "Contact for pricing"
            : `₹${provider.startingPrice.toLocaleString("en-IN")}+`}
        </div>
        {provider.description && (
          <div className="mt-2 text-xs text-zinc-500 leading-relaxed line-clamp-2">
            {provider.description}
          </div>
        )}
        <div className="flex gap-2 mt-3.5">
          <button onClick={() => onBook(provider)} className="flex-1 py-2.5 rounded-xl border-none text-[13px] font-bold text-white cursor-pointer transition-opacity hover:opacity-90" style={{ background: "linear-gradient(135deg,#8b5cf6,#06b6d4)", boxShadow: "0 2px 10px rgba(139,92,246,0.3)" }}>
            Book Now
          </button>
          {provider.phone && (
            <a href={`tel:${provider.phone}`} className="flex-1 py-2.5 rounded-xl border border-zinc-200 bg-white text-[13px] font-bold text-zinc-600 no-underline text-center transition-colors hover:bg-zinc-50">
              📞 Call
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Empty State ─── */
function EmptyState({ category }: { category: string }) {
  return (
    <div className="text-center py-12 sm:py-18 px-4">
      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full mx-auto mb-6 flex items-center justify-center text-4xl sm:text-5xl" style={{ background: "linear-gradient(135deg,#ede9fe,#cffafe)" }}>
        🔍
      </div>
      <div className="text-xl sm:text-2xl font-black text-zinc-900">No matching public listings</div>
      <div className="text-sm text-zinc-500 max-w-xs mx-auto mt-2.5 leading-relaxed">
        {category !== "All"
          ? `No approved ${category} providers are visible for this search.`
          : "No approved provider listings are currently visible for this search."}
      </div>
      <Link href="/partner">
        <button className="mt-7 px-7 py-3 rounded-xl border-none text-sm font-bold text-white cursor-pointer transition-all duration-200 hover:-translate-y-0.5" style={{ background: "linear-gradient(135deg,#8b5cf6,#06b6d4)", boxShadow: "0 4px 20px rgba(139,92,246,0.35)" }}>
          Become a Partner →
        </button>
      </Link>
    </div>
  );
}

/* ─── Page ─── */
export default function ExplorePage() {
  const [category, setCategory] = useState<ServiceCategory | "All">("All");
  const [locationFilter, setLocationFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<ProviderSort>("name");
  const [page, setPage] = useState(1);
  const [priceBand, setPriceBand] = useState(0);
  const [providers, setProviders] = useState<PublicProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [providersError, setProvidersError] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<PublicProvider | null>(null);

  useEffect(() => {
    const requestedCategory = new URLSearchParams(window.location.search).get("category");
    const match = SERVICE_CATEGORIES.find((serviceCategory) => serviceCategory === requestedCategory);
    if (match) setCategory(match);
  }, []);

  useEffect(() => {
    setPage(1);
  }, [category, locationFilter, searchQuery, priceBand, sortBy]);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch("/api/providers?limit=100");
        const payload = await response.json();
        if (!response.ok || !payload?.success) {
          throw new Error(payload?.error || "Provider listings are temporarily unavailable.");
        }
        const apiProviders = Array.isArray(payload?.providers) ? payload.providers : [];

        const mapped = apiProviders.map((provider: any) => {
          const ratingValue = provider.rating === null || provider.rating === undefined
            ? null
            : Number(provider.rating);

          return {
          id: provider.id,
          ownerName: provider.owner_name ?? "",
          businessName: provider.business_name ?? "Provider listing",
          category: provider.category ?? "",
          phone: provider.phone ?? "",
          city: provider.city ?? "",
          serviceAreas: Array.isArray(provider.service_areas)
            ? provider.service_areas.filter((area: unknown): area is string => typeof area === "string")
            : [],
          startingPrice: getProviderStartingPrice(provider.price_range ?? null),
          priceRange: provider.price_range ?? null,
          rating: ratingValue !== null && Number.isFinite(ratingValue) ? ratingValue : null,
          experienceYears: Number(provider.experience_years ?? 0),
          description: provider.description ?? "",
          imageUrl: provider.image_url ?? "",
          createdAt: new Date(provider.created_at ?? Date.now()).getTime(),
          isActive: true,
          };
        });

        const staticVenueProviders: PublicProvider[] = EVENT_VENUES.map((venue) => ({
          id: venue.id,
          ownerName: "Verified Partner",
          businessName: venue.name,
          category: "Restaurant",
          phone: venue.phone ?? "",
          city: venue.city,
          serviceAreas: [venue.city, "Jamui", "Bihar"],
          startingPrice: getProviderStartingPrice(venue.priceRange ?? null),
          priceRange: venue.priceRange ?? null,
          rating: venue.googleRating ?? null,
          experienceYears: 5,
          description: venue.description ?? "",
          imageUrl: venue.images[0] ?? "",
        }));

        const combined = [...mapped];
        for (const venue of staticVenueProviders) {
          if (!combined.some((p) => p.businessName.toLowerCase() === venue.businessName.toLowerCase())) {
            combined.push(venue);
          }
        }

        setProviders(combined);
        setProvidersError(null);
      } catch (error) {
        console.error("[Explore] Failed to load provider listings:", error);
        setProviders([]);
        setProvidersError("Provider listings are temporarily unavailable. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  /* ─── Filter, sort & paginate public provider listings ─── */
  const filteredProviders = useMemo(() => {
    const band = PRICE_BANDS[priceBand];
    const query = searchQuery.trim().toLowerCase();
    const location = locationFilter.trim().toLowerCase();

    const matched = providers.filter(p => {
      if (category !== "All" && p.category !== category) return false;
      if (location &&
        !p.city.toLowerCase().includes(location) &&
        !p.serviceAreas.some((area) => area.toLowerCase().includes(location))
      ) return false;
      if (query &&
        ![p.businessName, p.ownerName, p.description, p.city, p.category, ...p.serviceAreas]
          .some((field) => field.toLowerCase().includes(query))
      ) return false;
      if (priceBand > 0 && (
        p.startingPrice === null ||
        p.startingPrice < band.min ||
        p.startingPrice >= band.max
      )) return false;
      return true;
    });

    matched.sort((a, b) => {
      if (sortBy === "rating") {
        const ratingDiff = (b.rating ?? -1) - (a.rating ?? -1);
        if (ratingDiff !== 0) return ratingDiff;
      } else if (sortBy === "price") {
        const priceA = a.startingPrice ?? Number.POSITIVE_INFINITY;
        const priceB = b.startingPrice ?? Number.POSITIVE_INFINITY;
        if (priceA !== priceB) return priceA - priceB;
      }
      return a.businessName.localeCompare(b.businessName);
    });

    return matched;
  }, [providers, category, locationFilter, searchQuery, priceBand, sortBy]);

  const totalResults = filteredProviders.length;
  const totalPages = Math.max(1, Math.ceil(totalResults / RESULTS_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const pagedProviders = filteredProviders.slice(
    (safePage - 1) * RESULTS_PER_PAGE,
    safePage * RESULTS_PER_PAGE
  );

  return (
    <main className="flex-1 pb-16 sm:pb-20">
      {/* ── Hero header ── */}
      <div className="border-b border-zinc-100 py-10 sm:py-14" style={{ background: "linear-gradient(180deg,#faf5ff 0%,#f0f9ff 50%,#fff 100%)" }}>
        <Container>
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full px-4 py-1 mb-4 sm:mb-5 text-xs sm:text-[13px] font-bold text-violet-700" style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.2)" }}>
              ✦ Real listings · No fake vendors
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-[42px] font-black leading-tight">
              <span className="grad-text">
                Explore Providers
              </span>
            </h1>
            <p className="text-sm sm:text-[15px] text-zinc-500 mt-3 max-w-md mx-auto leading-relaxed">
              Browse approved, verified, bookable service providers with listings from Evigo.
            </p>
          </div>
        </Container>
      </div>

      <Container>
        {/* ── Filter bar ── */}
        <div className="my-6 sm:my-7 bg-white rounded-2xl border border-zinc-200 p-4 sm:p-5 flex flex-wrap gap-3 sm:gap-4 items-end" style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.05)" }}>
          {/* Service type */}
          <div className="flex flex-col gap-1 flex-1 min-w-[130px]">
            <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wide">Service Type</label>
            <select value={category} onChange={e => setCategory(e.target.value as ServiceCategory | "All")}
              className="px-3 py-2 rounded-xl border border-zinc-200 text-[13px] font-semibold text-zinc-900 outline-none bg-zinc-50 cursor-pointer">
              <option value="All">All Services</option>
              {SERVICE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Location */}
          <div className="flex flex-col gap-1 flex-1 min-w-[130px]">
            <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wide">Location</label>
            <input
              value={locationFilter}
              onChange={e => setLocationFilter(e.target.value)}
              placeholder="City, district or area, e.g. Jamui"
              className="px-3 py-2 rounded-xl border border-zinc-200 text-[13px] font-semibold text-zinc-900 outline-none bg-zinc-50"
            />
          </div>

          {/* Keyword search */}
          <div className="flex flex-col gap-1 flex-1 min-w-[140px]">
            <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wide">Search</label>
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Name, service or keyword"
              className="px-3 py-2 rounded-xl border border-zinc-200 text-[13px] font-semibold text-zinc-900 outline-none bg-zinc-50"
            />
          </div>

          {/* Price */}
          <div className="flex flex-col gap-1 flex-1 min-w-[140px]">
            <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wide">Price Range</label>
            <select value={priceBand} onChange={e => setPriceBand(Number(e.target.value))}
              className="px-3 py-2 rounded-xl border border-zinc-200 text-[13px] font-semibold text-zinc-900 outline-none bg-zinc-50 cursor-pointer">
              {PRICE_BANDS.map((b, i) => <option key={i} value={i}>{b.label}</option>)}
            </select>
          </div>

          {/* Sort */}
          <div className="flex flex-col gap-1 flex-1 min-w-[130px]">
            <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wide">Sort By</label>
            <select value={sortBy} onChange={e => setSortBy(e.target.value as ProviderSort)}
              className="px-3 py-2 rounded-xl border border-zinc-200 text-[13px] font-semibold text-zinc-900 outline-none bg-zinc-50 cursor-pointer">
              <option value="name">Name (A–Z)</option>
              <option value="rating">Top Rated</option>
              <option value="price">Price: Low to High</option>
            </select>
          </div>

          {/* Result count */}
          <div className="text-[13px] font-bold text-zinc-500 whitespace-nowrap ml-auto">
            {totalResults} result{totalResults !== 1 ? "s" : ""}
          </div>
        </div>

        {/* ── Category pill strip ── */}
        <div className="evigo-pill-strip flex flex-wrap gap-2 mb-6 sm:mb-7">
          {(["All", ...SERVICE_CATEGORIES] as const).map((c) => {
            const active = category === c;
            return (
              <button key={c} onClick={() => setCategory(c as ServiceCategory | "All")}
                className="px-4 py-1.5 rounded-full text-[13px] font-bold cursor-pointer transition-all duration-200"
                style={{ border: active ? "none" : "1px solid #e4e4e7", background: active ? "linear-gradient(135deg,#8b5cf6,#06b6d4)" : "#fff", color: active ? "#fff" : "#52525b", boxShadow: active ? "0 2px 10px rgba(139,92,246,0.3)" : "none" }}>
                {c}
              </button>
            );
          })}
        </div>

        {providersError && (
          <p role="alert" className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">
            {providersError}
          </p>
        )}

        {/* ── Results: Provider Cards ── */}
        {pagedProviders.length > 0 && (
          <>
            <div className="evigo-explore-grid">
              {pagedProviders.map(p => (
                <ProviderCard key={p.id} provider={p} onBook={setSelectedProvider} />
              ))}
            </div>

            {/* ── Pagination ── */}
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <button
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={safePage <= 1}
                  className="px-4 py-2 rounded-xl border border-zinc-200 bg-white text-[13px] font-bold text-zinc-600 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-50"
                >
                  ← Prev
                </button>
                {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
                  <button
                    key={pageNumber}
                    onClick={() => setPage(pageNumber)}
                    className="w-9 h-9 rounded-xl text-[13px] font-bold cursor-pointer transition-colors"
                    style={
                      pageNumber === safePage
                        ? { background: "linear-gradient(135deg,#8b5cf6,#06b6d4)", color: "#fff", border: "none" }
                        : { background: "#fff", color: "#52525b", border: "1px solid #e4e4e7" }
                    }
                  >
                    {pageNumber}
                  </button>
                ))}
                <button
                  onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                  disabled={safePage >= totalPages}
                  className="px-4 py-2 rounded-xl border border-zinc-200 bg-white text-[13px] font-bold text-zinc-600 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-50"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}

        {/* ── Empty State ── */}
        {loading && <p role="status" className="py-12 text-center text-sm font-semibold text-zinc-500">Loading provider listings…</p>}
        {totalResults === 0 && !loading && !providersError && <EmptyState category={category} />}
      </Container>

      <BookingModal provider={selectedProvider} onClose={() => setSelectedProvider(null)} />
    </main>
  );
}
