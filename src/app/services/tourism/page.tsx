"use client";

import React, { Suspense, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { Container } from "@/components/Container";
import { TOURISM_PLACES, TOURISM_DISTRICTS, TourismDistrict, TourismPlace } from "@/lib/constants";

// Dynamically import TourismMap with ssr: false & a sleek skeleton loader
const TourismMap = dynamic(() =>
  import("@/components/TourismMap").catch((error: unknown) => {
    console.error("Failed to load the tourism map.", error);
    return {
      default: () => (
        <div className="w-full h-[380px] rounded-3xl bg-white/[0.03] border border-white/10 flex flex-col items-center justify-center gap-3">
          <div className="text-center p-4">
            <p className="text-sm text-white/60 mb-2">Map temporarily unavailable</p>
            <p className="text-xs text-white/40">Please try refreshing the page</p>
          </div>
        </div>
      ),
    };
  }), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[380px] rounded-3xl bg-white/[0.03] border border-white/10 flex flex-col items-center justify-center gap-3 animate-pulse">
      <div className="w-10 h-10 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
      <span className="text-xs text-white/50 font-semibold tracking-wider uppercase">
        Loading Interactive District Map...
      </span>
    </div>
  ),
});

// Helper to get category style tokens
function getCategoryBadge(category: string) {
  if (
    category.toLowerCase().includes("nature") ||
    category.toLowerCase().includes("wildlife") ||
    category.toLowerCase().includes("hill")
  ) {
    return {
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/30",
      text: "text-emerald-400",
      icon: "🌲",
    };
  }
  if (
    category.toLowerCase().includes("religious") ||
    category.toLowerCase().includes("jain") ||
    category.toLowerCase().includes("temple")
  ) {
    return {
      bg: "bg-amber-500/10",
      border: "border-amber-500/30",
      text: "text-amber-400",
      icon: "🛕",
    };
  }
  return {
    bg: "bg-violet-500/10",
    border: "border-violet-500/30",
    text: "text-violet-400",
    icon: "🏛️",
  };
}

function getPlaceMapUrl(place: TourismPlace) {
  return place.lat !== undefined && place.lng !== undefined && !isNaN(place.lat) && !isNaN(place.lng)
    ? `https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      `${place.name}, ${place.district}, Bihar`
    )}`;
}

function getDistrictId(requestedDistrict: string | null) {
  const requested = requestedDistrict?.trim().toLowerCase();
  if (!requested) return "Jamui";

  const exactMatch = TOURISM_DISTRICTS.find(
    (district) =>
      district.id.toLowerCase() === requested ||
      district.name.toLowerCase() === requested
  );
  const nameMatch = TOURISM_DISTRICTS.find((district) =>
    district.name.toLowerCase().includes(requested)
  );

  return (exactMatch ?? nameMatch)?.id ?? null;
}

function getTripTypeCategory(tripType: string | null) {
  switch (tripType?.trim().toLowerCase()) {
    case "spiritual":
      return "religious";
    case "heritage":
      return "historical";
    case "nature":
      return "nature";
    case "culture":
      return "culture";
    default:
      return "all";
  }
}

function formatTravelDate(date: string | null) {
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;

  const parsedDate = new Date(`${date}T00:00:00.000Z`);
  if (Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== date) {
    return null;
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(parsedDate);
}

function PlaceDetailsModal({ place, onClose }: { place: TourismPlace; onClose: () => void }) {
  const mapUrl = getPlaceMapUrl(place);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/75 p-3 backdrop-blur-sm sm:p-6"
      onClick={(event) => event.target === event.currentTarget && onClose()}
    >
      <article
        role="dialog"
        aria-modal="true"
        aria-labelledby="tourism-place-title"
        className="relative max-h-[92dvh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-white/15 bg-[#0f0a1e] text-white shadow-2xl"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close place details"
          className="absolute right-3 top-3 z-10 grid h-10 w-10 place-items-center rounded-full border border-white/20 bg-black/65 text-xl text-white hover:bg-black"
        >
          ×
        </button>
        <div className="relative aspect-[16/8] bg-zinc-900">
          {place.image && (
            <Image
              src={place.image}
              alt={place.name}
              fill
              unoptimized={place.image.startsWith("https://")}
              sizes="(max-width: 768px) 100vw, 768px"
              className="object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f0a1e] via-[#0f0a1e]/20 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7">
            <p className="text-xs font-bold uppercase tracking-wider text-cyan-300">{place.district}, Bihar</p>
            <h2 id="tourism-place-title" className="mt-1 max-w-2xl text-2xl font-black sm:text-3xl">{place.name}</h2>
          </div>
        </div>

        <div className="space-y-6 p-5 sm:p-7">
          <section>
            <h3 className="text-sm font-black uppercase tracking-wider text-cyan-300">About</h3>
            <p className="mt-2 text-sm leading-6 text-white/80">{place.overview}</p>
          </section>
          <section>
            <h3 className="text-sm font-black uppercase tracking-wider text-cyan-300">History / Background</h3>
            <p className="mt-2 text-sm leading-6 text-white/80">{place.historicalBackground}</p>
          </section>
          <section>
            <h3 className="text-sm font-black uppercase tracking-wider text-cyan-300">Significance</h3>
            <p className="mt-2 text-sm leading-6 text-white/80">{place.significance}</p>
          </section>
          <section>
            <h3 className="text-sm font-black uppercase tracking-wider text-cyan-300">Travel Information</h3>
            <dl className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 sm:col-span-2">
                <dt className="text-xs font-bold text-white/50">Location</dt>
                <dd className="mt-1 text-sm leading-5 text-white/85">{place.location}</dd>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 sm:col-span-2">
                <dt className="text-xs font-bold text-white/50">How to reach</dt>
                <dd className="mt-1 text-sm leading-5 text-white/85">{place.howToReach}</dd>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <dt className="text-xs font-bold text-white/50">Timings</dt>
                <dd className="mt-1 text-sm text-white/85">{place.timings || "Not published in the official sources reviewed."}</dd>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <dt className="text-xs font-bold text-white/50">Entry fee</dt>
                <dd className="mt-1 text-sm text-white/85">{place.entryFee || "Not published in the official sources reviewed."}</dd>
              </div>
            </dl>
          </section>
          <section>
            <h3 className="text-sm font-black uppercase tracking-wider text-cyan-300">Sources</h3>
            <ul className="mt-2 space-y-2">
              {place.historySources.map((source) => (
                <li key={source.url}>
                  <a href={source.url} target="_blank" rel="noreferrer" className="text-sm font-semibold text-cyan-200 underline decoration-cyan-200/40 underline-offset-4 hover:text-white">
                    {source.label} ↗
                  </a>
                </li>
              ))}
            </ul>
          </section>
          <a href={mapUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center rounded-xl bg-cyan-500/15 px-4 text-sm font-bold text-cyan-100 hover:bg-cyan-500/25">
            View on Map ↗
          </a>
        </div>
      </article>
    </div>
  );
}

// Tourism Place Card without the Plan Visit button
function PlaceCard({
  place,
  onOpenDetails,
}: {
  place: TourismPlace;
  onOpenDetails: (place: TourismPlace) => void;
}) {
  const catStyle = getCategoryBadge(place.category);
  const [saved, setSaved] = useState(false);
  const mapUrl = getPlaceMapUrl(place);

  return (
    <div className="group bg-[#0f0a1e] border border-white/10 rounded-3xl overflow-hidden flex flex-col shadow-[0_8px_30px_rgba(0,0,0,0.5)] transition-all duration-300 hover:border-cyan-500/50 hover:shadow-[0_12px_40px_rgba(6,182,212,0.15)] hover:-translate-y-1">
      {/* Visual Header / Image */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-gradient-to-br from-violet-950/40 via-[#150f28] to-[#0a0614]">
        {place.image ? (
          <>
            <Image
              src={place.image}
              alt={place.name}
              fill
              unoptimized={place.image.startsWith("https://")}
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0f0a1e] via-[#0f0a1e]/40 to-transparent" />
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl mb-2 backdrop-blur-md shadow-inner">
              {catStyle.icon}
            </div>
            <span className="text-xs font-semibold text-white/40 tracking-wider uppercase">
              {place.district} District
            </span>
          </div>
        )}

        {/* Category Pill Over Image */}
        <div className="absolute top-4 left-4 z-10">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md border ${catStyle.bg} ${catStyle.border} ${catStyle.text}`}
          >
            <span>{catStyle.icon}</span>
            {place.category}
          </span>
        </div>

        {/* Top Right Badges & Save Bookmark Button */}
        <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5">
          {place.featured && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/40 backdrop-blur-md">
              ★ Featured
            </span>
          )}
          <button
            onClick={() => setSaved(!saved)}
            className={`w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md border transition-all ${saved
              ? "bg-cyan-500 border-cyan-400 text-black shadow-[0_0_10px_rgba(6,182,212,0.5)]"
              : "bg-black/40 border-white/10 text-white/80 hover:text-white hover:bg-black/60"
              }`}
            title={saved ? "Saved to your list" : "Bookmark place"}
            aria-label="Bookmark place"
          >
            <svg className="w-4 h-4" fill={saved ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Card Content with balanced spacing */}
      <div className="p-6 flex flex-col flex-1">
        <div className="mb-2">
          <div className="flex items-center gap-1.5 text-cyan-400 text-xs font-bold tracking-wide uppercase mb-1">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {place.district}, Bihar
          </div>
          <h3 className="text-xl font-bold text-white group-hover:text-cyan-300 transition-colors">
            {place.name}
          </h3>
        </div>

        <p className="text-sm text-white/70 leading-relaxed mb-5 flex-1">
          {place.description}
        </p>

        {/* Action Row: Map link */}
        <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-3 mt-auto">
          <button
            type="button"
            onClick={() => onOpenDetails(place)}
            className="inline-flex min-h-10 items-center rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-3 text-xs font-bold text-cyan-100 hover:bg-cyan-400/20"
          >
            Place Details
          </button>
          <a
            href={mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white/80 hover:text-white hover:bg-white/10 transition-colors text-xs font-semibold"
            title="Open in Google Maps"
          >
            <svg className="w-3.5 h-3.5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            <span>Directions &rarr;</span>
          </a>
        </div>
      </div>
    </div>
  );
}

function TourismResults() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedDistrict = searchParams.get("district");
  const resolvedDistrict = getDistrictId(requestedDistrict);
  const selectedDistrict = resolvedDistrict ?? "Jamui";
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showMap, setShowMap] = useState<boolean>(true);
  const [selectedPlace, setSelectedPlace] = useState<TourismPlace | null>(null);

  useEffect(() => {
    setSelectedCategory(getTripTypeCategory(searchParams.get("tripType")));
  }, [searchParams]);

  const currentDistrictInfo = TOURISM_DISTRICTS.find((d) => d.id === selectedDistrict);
  const requestedTripType = searchParams.get("tripType");
  const selectedTripType = requestedTripType?.trim().toLowerCase() ?? "";
  const isSupportedTripType = ["spiritual", "heritage", "nature", "culture"].includes(selectedTripType);
  const tripTypeLabel = isSupportedTripType
    ? selectedTripType.charAt(0).toUpperCase() + selectedTripType.slice(1)
    : null;
  const requestedTravelDate = searchParams.get("date");
  const travelDateLabel = formatTravelDate(requestedTravelDate);
  const queryErrors = [
    requestedDistrict?.trim() && !resolvedDistrict
      ? `We couldn't find the district "${requestedDistrict}". Showing Jamui instead.`
      : null,
    requestedTripType?.trim() && !isSupportedTripType
      ? "That trip type isn't supported. Choose Spiritual, Heritage, Nature, or Culture."
      : null,
    requestedTravelDate && !travelDateLabel
      ? "The travel date in this link is invalid."
      : null,
  ].filter((message): message is string => Boolean(message));

  const getDistrictHref = (districtId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("district", districtId);
    return `/services/tourism?${params.toString()}`;
  };

  const districtPlaces = TOURISM_PLACES.filter((place) =>
    place.district.toLowerCase() === selectedDistrict.toLowerCase() ||
    (selectedDistrict === "Rajgir" && place.district.toLowerCase() === "nalanda")
  );

  const filteredPlaces = districtPlaces.filter((p) => {
    if (selectedCategory === "all") return true;
    if (selectedCategory === "nature") {
      return (
        p.category.toLowerCase().includes("nature") ||
        p.category.toLowerCase().includes("wildlife") ||
        p.category.toLowerCase().includes("hill")
      );
    }
    if (selectedCategory === "religious") {
      return (
        p.category.toLowerCase().includes("religious") ||
        p.category.toLowerCase().includes("jain") ||
        p.category.toLowerCase().includes("temple")
      );
    }
    if (selectedCategory === "historical") {
      return (
        p.category.toLowerCase().includes("historical") ||
        p.category.toLowerCase().includes("monument") ||
        p.category.toLowerCase().includes("heritage")
      );
    }
    if (selectedCategory === "culture") {
      return (
        p.category.toLowerCase().includes("cultural") ||
        p.category.toLowerCase().includes("culture") ||
        p.category.toLowerCase().includes("art") ||
        p.category.toLowerCase().includes("food")
      );
    }
    if (selectedCategory === "hidden") {
      return !p.featured;
    }
    return true;
  });

  const selectedDistrictInfo: TourismDistrict | undefined = currentDistrictInfo;

  return (
    <div className="min-h-screen bg-[#0f172a] text-white selection:bg-orange-500/30 relative">
      {/* District Hero Section - Premium Design with Video/Thumbnail Area */}
      <section className="relative isolate min-h-[400px] overflow-hidden border-b border-white/10 sm:min-h-[450px] md:min-h-[500px]">
        {selectedDistrictInfo && (
          <Image
            src={selectedDistrictInfo.heroImage}
            alt={selectedDistrictInfo.heroImageAlt}
            fill
            preload
            unoptimized={selectedDistrictInfo.heroImage.startsWith("https://")}
            sizes="100vw"
            className="object-cover object-center"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0b1424]/95 via-[#0b1424]/75 to-[#0b1424]/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-transparent to-black/20" />

        <Container className="relative z-10 flex min-h-[400px] flex-col justify-end pb-8 pt-20 sm:min-h-[450px] sm:pb-10 sm:pt-24 md:min-h-[500px] md:justify-center md:py-28">
          <div className="grid gap-8">
            {/* Left: Hero Content */}
            <div className="max-w-2xl">
              {/* Breadcrumb */}
              <nav className="flex items-center gap-2 text-sm font-semibold text-white/60 mb-5">
                <Link href="/" className="hover:text-white transition-colors">Home</Link>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <Link href="/travel-tourism" className="hover:text-white transition-colors">Travel & Tourism</Link>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <span className="text-cyan-400">{selectedDistrictInfo?.name || "Jamui"}</span>
              </nav>

              {/* Category Badges */}
              <div className="flex flex-wrap items-center gap-3 mb-5">
                <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 backdrop-blur-md">
                  <span>🌟</span>
                  Bihar Tourism
                </div>
                <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold text-orange-300 bg-orange-500/10 border border-orange-500/20 backdrop-blur-md">
                  <span>📍</span>
                  {selectedDistrictInfo?.name || "Jamui"}
                </div>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-4 text-white">
                {selectedDistrictInfo?.name || "Jamui"} <span className="text-orange-500">District</span>
              </h1>
              <p className="text-lg sm:text-xl text-white/90 leading-relaxed mb-5 font-medium">
                {selectedDistrictInfo?.tagline || "Hills, Jain Pilgrimage & Ancient Heritage"}
              </p>
              <p className="max-w-2xl text-sm sm:text-base leading-7 text-white/75 mb-6">
                {selectedDistrictInfo?.description}
              </p>

              {/* Info Groups */}
              <div className="flex flex-wrap gap-4">
                <div className="inline-flex items-center gap-2 rounded-lg bg-white/5 border border-white/10 px-4 py-2">
                  <svg className="w-4 h-4 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-xs font-semibold text-white/80">Oct - Mar</span>
                </div>
                <div className="inline-flex items-center gap-2 rounded-lg bg-white/5 border border-white/10 px-4 py-2">
                  <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                  <span className="text-xs font-semibold text-white/80">Jain Heritage</span>
                </div>
                <div className="inline-flex items-center gap-2 rounded-lg bg-white/5 border border-white/10 px-4 py-2">
                  <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="text-xs font-semibold text-white/80">Pilgrims</span>
                </div>
              </div>
            </div>

          </div>
        </Container>
        {selectedDistrictInfo?.imageAttribution && (
          <div className="absolute bottom-3 right-4 z-10 max-w-[40%] text-right text-[10px] leading-4 text-white/70 sm:right-6">
            Photo{" "}
            <a href={selectedDistrictInfo.imageAttribution.source} target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-white">
              {selectedDistrictInfo.imageAttribution.name}
            </a>
            {" · "}
            <a href={selectedDistrictInfo.imageAttribution.licenseUrl} target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-white">
              {selectedDistrictInfo.imageAttribution.license}
            </a>
          </div>
        )}
      </section>

      {/* Explore Other Districts in Bihar */}
      <section className="py-8 bg-[#0f172a]">
        <Container className="max-w-7xl">
          <h2 className="text-xl font-bold text-white mb-6">Explore Other Districts in Bihar</h2>
          <div className="flex items-center gap-4 overflow-x-auto pb-4 scrollbar-none">
            {TOURISM_DISTRICTS.map((dist) => {
              const isActive = selectedDistrict === dist.id;
              return (
                <Link
                  key={dist.id}
                  href={getDistrictHref(dist.id)}
                  className={`shrink-0 group block w-36 rounded-xl overflow-hidden border transition-all duration-300 ${isActive
                    ? "border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                    : "border-white/10 hover:border-white/30"
                  }`}
                >
                  <div className="relative aspect-square w-full">
                    <Image
                      src={dist.heroImage}
                      alt={dist.name}
                      fill
                      unoptimized={dist.heroImage.startsWith("https://")}
                      sizes="144px"
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  </div>
                  <div className="p-3 bg-[#0f172a]">
                    <h3 className={`text-sm font-bold ${isActive ? "text-cyan-400" : "text-white/80 group-hover:text-white"}`}>
                      {dist.name}
                    </h3>
                  </div>
                </Link>
              );
            })}
          </div>
        </Container>
      </section>

      {/* District Main Content */}
      <section className="py-10 sm:py-12 md:py-16">
        <Container className="max-w-6xl">
          {/* District Filter Pills */}
          <div className="mb-10">
            <div className="flex items-center justify-between gap-4 mb-5">
              <span className="text-xs font-bold tracking-wider text-white/50 uppercase">
                Select District
              </span>
              <span className="text-xs text-white/40">
                {TOURISM_DISTRICTS.length} districts available
              </span>
            </div>

            <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
              {TOURISM_DISTRICTS.map((dist) => {
                const isActive = selectedDistrict === dist.id;
                return (
                  <button
                    key={dist.id}
                    onClick={() => router.push(getDistrictHref(dist.id), { scroll: false })}
                    className={`shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 border ${isActive
                      ? "bg-cyan-500 text-white border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)]"
                      : dist.available
                        ? "bg-white/5 text-white/80 border-white/10 hover:bg-white/10 hover:text-white"
                        : "bg-white/[0.02] text-white/40 border-white/5 hover:bg-white/5 hover:text-white/60"
                      }`}
                  >
                    <span>{dist.name}</span>
                    {dist.available ? (
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-black ${isActive ? "bg-black/30 text-white" : "bg-cyan-500/20 text-cyan-300"
                          }`}
                      >
                        {dist.count}
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 text-white/30 font-medium">
                        Soon
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* About Jamui Section - Two Column Layout */}
          {currentDistrictInfo && currentDistrictInfo.id === "Jamui" && (
            <div className="mb-10 grid md:grid-cols-[1fr_320px] gap-8 p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-white/[0.04] via-white/[0.02] to-transparent border border-white/10 backdrop-blur-sm">
              <div>
                <div className="flex items-center gap-2.5 text-xs font-bold text-cyan-400 uppercase tracking-wider mb-3">
                  <span>📍</span> About Jamui
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-white mb-3">
                  Discover Jamui District
                </h2>
                <p className="text-sm sm:text-base text-white/70 leading-relaxed mb-6 max-w-2xl">
                  Jamui district in Bihar is known for its scenic hills, ancient Jain heritage sites, and spiritual significance. Home to the famous Kshatriya Kund Gram and Lachhuar Jain Temple, it attracts pilgrims and nature lovers alike.
                </p>
                <Link
                  href="/services/tourism?district=Jamui"
                  className="inline-flex items-center justify-center px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-lg transition-colors"
                >
                  Plan Your Trip to Jamui →
                </Link>
              </div>
              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">🏛️</span>
                    <h3 className="text-sm font-bold text-white">Famous Attractions</h3>
                  </div>
                  <p className="text-xs text-white/60">Lachhuar Jain Temple, Giddheshwar Mandir, Simultala Hills</p>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">🌤️</span>
                    <h3 className="text-sm font-bold text-white">Best Time to Visit</h3>
                  </div>
                  <p className="text-xs text-white/60">October to March for pleasant weather</p>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">🗺️</span>
                    <h3 className="text-sm font-bold text-white">Nearby Areas</h3>
                  </div>
                  <p className="text-xs text-white/60">Bhagalpur, Munger, Deoghar</p>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">🎯</span>
                    <h3 className="text-sm font-bold text-white">Activities</h3>
                  </div>
                  <p className="text-xs text-white/60">Pilgrimage, Trekking, Nature Walks</p>
                </div>
              </div>
            </div>
          )}

          {/* Category Filter Chips & Map Toggle */}
          {(tripTypeLabel || travelDateLabel) && (
            <p role="status" className="mb-5 text-sm text-white/70">
              {tripTypeLabel && <>Trip type: <span className="font-semibold text-cyan-200">{tripTypeLabel}</span></>}
              {tripTypeLabel && travelDateLabel && <span className="mx-2 text-white/35">·</span>}
              {travelDateLabel && <>Travel date: <span className="font-semibold text-cyan-200">{travelDateLabel}</span></>}
            </p>
          )}
          {queryErrors.length > 0 && (
            <div role="alert" className="mb-5 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
              <ul className="list-inside list-disc space-y-1">
                {queryErrors.map((message) => <li key={message}>{message}</li>)}
              </ul>
            </div>
          )}
          {districtPlaces.length > 0 && (
            <div className="mb-8 flex flex-wrap items-center gap-2">
              <button
                onClick={() => setSelectedCategory("all")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${selectedCategory === "all"
                  ? "bg-orange-500 text-white border-orange-500"
                  : "bg-white/5 text-white/70 border-white/10 hover:bg-white/10 hover:text-white"
                  }`}
              >
                All ({districtPlaces.length})
              </button>
              <button
                onClick={() => setSelectedCategory("religious")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${selectedCategory === "religious"
                  ? "bg-amber-500 text-white border-amber-500"
                  : "bg-white/5 text-white/70 border-white/10 hover:bg-white/10 hover:text-white"
                  }`}
              >
                Temples
              </button>
              <button
                onClick={() => setSelectedCategory("nature")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${selectedCategory === "nature"
                  ? "bg-emerald-500 text-white border-emerald-500"
                  : "bg-white/5 text-white/70 border-white/10 hover:bg-white/10 hover:text-white"
                  }`}
              >
                Nature & Adventure
              </button>
              <button
                onClick={() => setSelectedCategory("historical")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${selectedCategory === "historical"
                  ? "bg-violet-500 text-white border-violet-500"
                  : "bg-white/5 text-white/70 border-white/10 hover:bg-white/10 hover:text-white"
                  }`}
              >
                Historical Sites
              </button>
              <button
                onClick={() => setSelectedCategory("hidden")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${selectedCategory === "hidden"
                  ? "bg-cyan-500 text-white border-cyan-500"
                  : "bg-white/5 text-white/70 border-white/10 hover:bg-white/10 hover:text-white"
                  }`}
              >
                Viewpoints
              </button>
              <button
                onClick={() => setShowMap(!showMap)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${showMap
                  ? "bg-white/15 text-white border-white/30"
                  : "bg-white/5 text-white/70 border-white/10 hover:text-white"
                  }`}
              >
                <span>🗺️</span>
                <span>{showMap ? "Hide Map" : "Show Map"}</span>
              </button>
            </div>
          )}

          {/* Explore selected district on Map */}
          {districtPlaces.length > 0 && showMap && (
            <div className="mb-10">
              <div className="mb-6">
                <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">Explore {currentDistrictInfo?.name} on Map</h2>
                <p className="text-sm text-white/60">Discover all attractions with our interactive map</p>
              </div>
              <div className="rounded-2xl overflow-hidden border border-white/15 shadow-[0_8px_40px_rgba(0,0,0,0.6)]">
                <div className="relative h-[400px] w-full sm:h-[450px]">
                  <TourismMap
                    places={filteredPlaces}
                    centerLat={filteredPlaces[0]?.lat ?? 24.9278}
                    centerLng={filteredPlaces[0]?.lng ?? 86.2265}
                  />
                </div>
                <div className="p-4 bg-white/5 border-t border-white/10 flex items-center justify-between">
                  <span className="text-xs text-white/50">{filteredPlaces.length} places marked on map</span>
                  <button className="text-xs font-bold text-cyan-400 hover:text-cyan-300">
                    View Full Map →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Top Places to Visit in Jamui - 5 Card Grid */}
          {districtPlaces.length > 0 && (
            <>
              <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">Top Places to Visit</p>
                  <h2 className="mt-1 text-2xl sm:text-3xl font-black text-white">
                    in {selectedDistrictInfo?.name}
                  </h2>
                </div>
                <Link
                  href="/services/tourism"
                  className="text-sm font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-2 transition-colors"
                >
                  View all →
                </Link>
              </div>
              {filteredPlaces.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {filteredPlaces.slice(0, 5).map((place) => (
                    <PlaceCard
                      key={place.id}
                      place={place}
                      onOpenDetails={setSelectedPlace}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 px-4 bg-white/5 border border-white/10 rounded-2xl">
                  <div className="text-3xl mb-3">🔍</div>
                  <h3 className="text-lg font-bold text-white mb-1">
                    No places matching this category
                  </h3>
                  <p className="text-sm text-white/50 mb-4">
                    Try selecting another filter category above.
                  </p>
                  <button
                    onClick={() => setSelectedCategory("all")}
                    className="px-4 py-2 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-xs font-bold"
                  >
                    Show All Places
                  </button>
                </div>
              )}
            </>
          )}

          {/* Local Experiences in Jamui - 4 Card Section */}
          {currentDistrictInfo && currentDistrictInfo.id === "Jamui" && (
            <div className="mb-10">
              <div className="mb-6">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">Local Experiences</p>
                <h2 className="mt-1 text-2xl sm:text-3xl font-black text-white">
                  in Jamui
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  {
                    title: "Trekking & Nature Walks",
                    description: "Explore scenic trails through Simultala hills and nature spots",
                    image: "/tourism/jamui/simultala.png",
                    icon: "🥾"
                  },
                  {
                    title: "Spiritual Tours",
                    description: "Visit ancient Jain temples and sacred pilgrimage sites",
                    image: "/tourism/jamui/lachhuar_jain.png",
                    icon: "🛕"
                  },
                  {
                    title: "Local Food Experience",
                    description: "Taste authentic local cuisine and traditional dishes",
                    image: "/tourism/jamui/kund_gram.png",
                    icon: "🍽️"
                  },
                  {
                    title: "Village & Rural Tourism",
                    description: "Experience rural life and traditional village culture",
                    image: "/tourism/jamui/patneshwar.png",
                    icon: "🏘️"
                  }
                ].map((exp, index) => (
                  <div key={index} className="group">
                    <div className="relative aspect-[16/10] rounded-xl overflow-hidden mb-4">
                      <Image
                        src={exp.image}
                        alt={exp.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">{exp.icon}</span>
                      <h3 className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors">
                        {exp.title}
                      </h3>
                    </div>
                    <p className="text-xs text-white/60 leading-relaxed">
                      {exp.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Coming Soon State for districts without places */}
          {districtPlaces.length === 0 && (
            <div className="py-12 px-6 rounded-2xl bg-gradient-to-b from-white/[0.03] to-transparent border border-white/10 text-center max-w-3xl mx-auto backdrop-blur-sm">
              <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-2xl mx-auto mb-4">
                🗺️
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                Curated District Trails
              </h3>
              <p className="text-sm text-white/60 leading-relaxed max-w-md mx-auto mb-6">
                Our team is currently surveying and verifying scenic trails, pilgrimage itineraries, and licensed local guides for {currentDistrictInfo?.name}.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={() => router.push(getDistrictHref("Jamui"), { scroll: false })}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-cyan-500 text-white text-xs font-bold transition-all hover:bg-cyan-600"
                >
                  Explore Jamui District
                </button>
                <a
                  href={`https://wa.me/918809988099?text=${encodeURIComponent(
                    `Hi Evigo, I am interested in travel & guide services for ${currentDistrictInfo?.name} district.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white text-xs font-bold hover:bg-white/20 transition-colors"
                >
                  Request Custom Guide
                </a>
              </div>
            </div>
          )}

          <section className="mt-12 grid gap-6 lg:grid-cols-2">
            <article className="overflow-hidden rounded-2xl border border-slate-200 bg-[#f8fafc] text-slate-900 shadow-xl">
              <div className="flex h-full flex-col sm:flex-row">
                <div className="relative min-h-56 w-full shrink-0 bg-slate-200 sm:min-h-0 sm:w-2/5">
                  <Image
                    src="/tourism/jamui/lachhuar_jain.png"
                    alt="Jain temple at Lachhuar in Jamui, Bihar"
                    fill
                    sizes="(max-width: 640px) 100vw, 320px"
                    className="object-cover"
                  />
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <span className="inline-flex w-fit rounded-full border border-teal-700/15 bg-teal-700/5 px-3 py-1 text-xs font-bold uppercase tracking-wider text-teal-800">
                    Curated travel bundles
                  </span>
                  <h2 className="mt-3 text-2xl font-black text-slate-900 sm:text-3xl">Travel Pack Combo</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Browse available multi-service packages and trip add-ons for your Bihar journey.
                  </p>
                  <ul className="mt-4 grid grid-cols-2 gap-2 text-xs font-semibold text-slate-700 sm:text-sm">
                    <li className="rounded-lg bg-white px-3 py-2">Package options</li>
                    <li className="rounded-lg bg-white px-3 py-2">Travel add-ons</li>
                    <li className="rounded-lg bg-white px-3 py-2">Availability details</li>
                    <li className="rounded-lg bg-white px-3 py-2">Booking information</li>
                  </ul>
                  <Link
                    href="/combo-packs"
                    className="mt-6 inline-flex min-h-11 w-fit items-center rounded-xl bg-teal-600 px-5 text-sm font-bold text-white transition-colors hover:bg-teal-700"
                  >
                    Explore Travel Packages <span className="ml-2" aria-hidden="true">→</span>
                  </Link>
                </div>
              </div>
            </article>

            <article className="overflow-hidden rounded-2xl border border-white/10 bg-[#07111d] shadow-2xl">
              <div className="flex h-full flex-col sm:flex-row">
                <div className="relative min-h-56 w-full shrink-0 bg-slate-900 sm:min-h-0 sm:w-2/5">
                  <Image
                    src="/faabcab-vehicle.jpg"
                    alt="FaabCab SUV on a road at sunset"
                    fill
                    sizes="(max-width: 640px) 100vw, 320px"
                    className="object-contain"
                  />
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <span className="inline-flex w-fit rounded-full border border-orange-400/30 bg-orange-400/10 px-3 py-1 text-xs font-bold text-orange-200">
                    Transport Partner · Bihar
                  </span>
                  <h2 className="mt-3 text-2xl font-black text-white sm:text-3xl">FaabCab</h2>
                  <p className="mt-2 text-sm leading-6 text-white/75">
                    Explore FaabCab for inter-city journeys, airport transfers, railway pickups, and local rides.
                  </p>
                  <ul className="mt-4 grid grid-cols-2 gap-2 text-xs font-semibold text-white/80 sm:text-sm">
                    <li className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">Inter-city trips</li>
                    <li className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">Airport transfers</li>
                    <li className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">Railway pickup</li>
                    <li className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">Hourly rentals</li>
                  </ul>
                  <Link
                    href="/travel-tourism/faabcab"
                    className="mt-6 inline-flex min-h-11 w-fit items-center rounded-xl bg-orange-500 px-5 text-sm font-bold text-white transition-colors hover:bg-orange-600"
                  >
                    Explore FaabCab <span className="ml-2" aria-hidden="true">→</span>
                  </Link>
                </div>
              </div>
            </article>
          </section>

        </Container>
      </section>
      {selectedPlace && (
        <PlaceDetailsModal place={selectedPlace} onClose={() => setSelectedPlace(null)} />
      )}
    </div>
  );
}

function TourismLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-[#0f172a] text-sm font-semibold text-white/70">
      Loading tourism destinations...
    </div>
  );
}

export default function TourismPage() {
  return (
    <Suspense fallback={<TourismLoading />}>
      <TourismResults />
    </Suspense>
  );
}
