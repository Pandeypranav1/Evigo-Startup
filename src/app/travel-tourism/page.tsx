"use client";

import { useState, useEffect, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Container } from "@/components/Container";
import { BIHAR_DESTINATIONS, HERO_SLIDER_IMAGES } from "@/lib/constants";
import type { TourismImageAttribution } from "@/lib/constants";

function TourismImage({
    src,
    alt,
    sizes,
    className,
    loading = "lazy",
    objectPosition,
}: {
    src: string;
    alt: string;
    sizes: string;
    className?: string;
    loading?: "eager" | "lazy";
    objectPosition?: string;
}) {
    const [hasError, setHasError] = useState(false);
    const [hasFallbackError, setHasFallbackError] = useState(false);
    const imageSrc = hasError ? "/images/districts/02_Patna.jpg" : src;

    if (hasError && hasFallbackError) {
        return (
            <div
                role="img"
                aria-label={`${alt} (photo unavailable)`}
                className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-teal-950 via-slate-900 to-slate-800 px-4 text-center text-white/75"
            >
                <svg aria-hidden="true" className="h-9 w-9 text-teal-200/80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7.5A2.5 2.5 0 0 1 5.5 5h13A2.5 2.5 0 0 1 21 7.5v9a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 16.5v-9Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="m3.5 16 5-5a2 2 0 0 1 2.8 0l2.2 2.2 1.2-1.2a2 2 0 0 1 2.8 0l3 3" />
                </svg>
                <span className="text-xs font-semibold">Photo unavailable</span>
            </div>
        );
    }

    return (
        <Image
            src={imageSrc}
            alt={hasError ? `${alt} — Bihar riverfront fallback photo` : alt}
            fill
            loading={loading}
            unoptimized={imageSrc.startsWith("https://")}
            onError={() => {
                if (hasError) setHasFallbackError(true);
                else setHasError(true);
            }}
            sizes={sizes}
            style={objectPosition ? { objectPosition } : undefined}
            className={className}
        />
    );
}

function PhotoCredit({ attribution }: { attribution: TourismImageAttribution }) {
    return (
        <a
            href={attribution.source}
            target="_blank"
            rel="noreferrer"
            className="mt-1 inline-block max-w-full truncate text-[10px] leading-4 text-gray-500 underline decoration-gray-300 underline-offset-2 hover:text-teal-700"
            aria-label={`Photo by ${attribution.name}, licensed ${attribution.license}`}
        >
            Photo: {attribution.name} · {attribution.license}
        </a>
    );
}

export default function TravelTourismPage() {
    const router = useRouter();
    const [currentSlide, setCurrentSlide] = useState(0);
    const [searchData, setSearchData] = useState({
        destination: "",
        tripType: "",
        date: ""
    });
    const [searchError, setSearchError] = useState("");

    const [isPaused, setIsPaused] = useState(false);

    useEffect(() => {
        if (isPaused) return;

        const timeout = setTimeout(() => {
            setCurrentSlide((prev) => (prev + 1) % HERO_SLIDER_IMAGES.length);
        }, 4500);
        return () => clearTimeout(timeout);
    }, [currentSlide, isPaused]);

    const showPreviousSlide = () => {
        setCurrentSlide((previous) => (previous - 1 + HERO_SLIDER_IMAGES.length) % HERO_SLIDER_IMAGES.length);
    };

    const showNextSlide = () => {
        setCurrentSlide((previous) => (previous + 1) % HERO_SLIDER_IMAGES.length);
    };

    const handleSearch = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!searchData.destination || !searchData.tripType || !searchData.date) {
            setSearchError("Please choose a destination, trip type, and travel date.");
            return;
        }

        const parsedDate = new Date(`${searchData.date}T00:00:00.000Z`);
        if (Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== searchData.date) {
            setSearchError("Please choose a valid travel date.");
            return;
        }

        setSearchError("");
        const params = new URLSearchParams({
            district: searchData.destination,
            tripType: searchData.tripType,
            date: searchData.date,
        });
        router.push(`/services/tourism?${params.toString()}`);
    };

    return (
        <main className="flex-1 bg-white">
            {/* Hero section with the destination carousel */}
            <section
                className="relative min-h-[600px] overflow-hidden sm:min-h-[650px] lg:min-h-[700px]"
                role="region"
                aria-label="Bihar destination highlights"
                aria-roledescription="carousel"
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
            >
                {HERO_SLIDER_IMAGES.map((slide, index) => {
                    const isActive = index === currentSlide;
                    const isNearActive = index === currentSlide
                        || index === (currentSlide + 1) % HERO_SLIDER_IMAGES.length
                        || index === (currentSlide - 1 + HERO_SLIDER_IMAGES.length) % HERO_SLIDER_IMAGES.length;

                    return (
                        <div
                            key={slide.src}
                            aria-hidden={!isActive}
                            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out motion-reduce:transition-none ${
                                isActive ? "opacity-100" : "pointer-events-none opacity-0"
                            }`}
                        >
                            <TourismImage
                                src={slide.src}
                                alt={slide.alt}
                                loading={isNearActive ? "eager" : "lazy"}
                                className="object-cover object-center"
                                sizes="100vw"
                            />
                            <div className="absolute inset-0 bg-gradient-to-b from-[#061426]/45 via-[#061426]/30 to-[#061426]/75" />
                        </div>
                    );
                })}

                {/* Hero Content - Left Aligned */}
                <div className="relative z-10 flex min-h-[600px] flex-col justify-center px-4 py-12 sm:min-h-[650px] sm:py-16 lg:min-h-[700px]">
                    <Container className="flex flex-col items-start">
                        <h1 className="mb-4 text-4xl font-black tracking-tight text-white drop-shadow-2xl sm:mb-5 sm:text-5xl md:text-6xl lg:text-7xl max-w-3xl">
                            Discover the Real <span className="text-orange-400">Bihar</span>
                        </h1>
                        <p className="mb-8 max-w-2xl text-base leading-relaxed text-white/95 drop-shadow-lg sm:mb-10 sm:text-lg md:text-xl">
                            Explore ancient heritage, spiritual destinations, vibrant culture and natural beauty.
                        </p>

                        <div className="mb-7 min-h-12 max-w-2xl" aria-live="polite" aria-atomic="true">
                            <p className="text-sm font-bold text-white sm:text-base">
                                <span className="mr-2 text-orange-400" aria-hidden="true">●</span>
                                {HERO_SLIDER_IMAGES[currentSlide].title}
                            </p>
                            <p className="mt-1 text-xs leading-5 text-white/80 sm:text-sm">
                                {HERO_SLIDER_IMAGES[currentSlide].subtitle}
                            </p>
                        </div>

                        {/* Hero Highlight Cards */}
                        <div className="mb-8 flex flex-wrap gap-3 sm:gap-4">
                            <div className="flex items-center gap-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2.5">
                                <span className="text-xl">🏛️</span>
                                <span className="text-sm font-semibold text-white">Heritage & Culture</span>
                            </div>
                            <div className="flex items-center gap-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2.5">
                                <span className="text-xl">🛕</span>
                                <span className="text-sm font-semibold text-white">Spiritual Journeys</span>
                            </div>
                            <div className="flex items-center gap-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2.5">
                                <span className="text-xl">🌿</span>
                                <span className="text-sm font-semibold text-white">Nature Escapes</span>
                            </div>
                        </div>

                        {/* Search Panel - White with Orange Button */}
                        <form
                            noValidate
                            onSubmit={handleSearch}
                            className="w-full max-w-4xl rounded-2xl bg-white p-4 shadow-2xl sm:p-5 md:p-6"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="md:col-span-1">
                                    <label htmlFor="tourism-destination" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                                        Select Destination
                                    </label>
                                    <select
                                        id="tourism-destination"
                                        name="destination"
                                        required
                                        value={searchData.destination}
                                        onChange={(e) => {
                                            setSearchData((current) => ({ ...current, destination: e.target.value }));
                                            setSearchError("");
                                        }}
                                        className="w-full px-4 py-3 rounded-lg border border-gray-200 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                                    >
                                        <option value="">Choose destination</option>
                                        {BIHAR_DESTINATIONS.map((dest) => (
                                            <option key={dest.name} value={dest.district}>
                                                {dest.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="md:col-span-1">
                                    <label htmlFor="tourism-trip-type" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                                        Trip Type
                                    </label>
                                    <select
                                        id="tourism-trip-type"
                                        name="tripType"
                                        required
                                        value={searchData.tripType}
                                        onChange={(e) => {
                                            setSearchData((current) => ({ ...current, tripType: e.target.value }));
                                            setSearchError("");
                                        }}
                                        className="w-full px-4 py-3 rounded-lg border border-gray-200 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                                    >
                                        <option value="">Choose trip type</option>
                                        <option value="spiritual">Spiritual Circuit</option>
                                        <option value="heritage">Heritage Trail</option>
                                        <option value="nature">Nature & Adventure</option>
                                        <option value="culture">Food & Culture</option>
                                    </select>
                                </div>
                                <div className="md:col-span-1">
                                    <label htmlFor="tourism-travel-date" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                                        Travel Date
                                    </label>
                                    <input
                                        id="tourism-travel-date"
                                        name="date"
                                        type="date"
                                        required
                                        value={searchData.date}
                                        onChange={(e) => {
                                            setSearchData((current) => ({ ...current, date: e.target.value }));
                                            setSearchError("");
                                        }}
                                        className="w-full px-4 py-3 rounded-lg border border-gray-200 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                                    />
                                </div>
                                <div className="md:col-span-1 flex items-end">
                                    <button
                                        type="submit"
                                        className="w-full px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                                    >
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                        Search
                                    </button>
                                </div>
                            </div>
                            {searchError && (
                                <p role="alert" className="mt-3 text-sm font-semibold text-red-700">
                                    {searchError}
                                </p>
                            )}
                        </form>
                    </Container>
                </div>

                <div className="absolute inset-x-0 bottom-3 z-20 flex items-center justify-between px-4 sm:px-6">
                    <button
                        type="button"
                        onClick={showPreviousSlide}
                        className="grid h-10 w-10 place-items-center rounded-full border border-white/35 bg-[#081629]/60 text-white shadow-lg backdrop-blur-sm transition hover:bg-[#081629]/85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                        aria-label="Previous destination"
                    >
                        <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m15 18-6-6 6-6" />
                        </svg>
                    </button>
                    <div className="absolute left-1/2 flex -translate-x-1/2 items-center gap-2">
                        {HERO_SLIDER_IMAGES.map((slide, index) => (
                            <button
                                key={slide.src}
                                type="button"
                                onClick={() => setCurrentSlide(index)}
                                className={`h-2.5 rounded-full transition-all ${
                                    index === currentSlide ? "w-8 bg-white" : "w-2.5 bg-white/55 hover:bg-white/80"
                                }`}
                                aria-label={`Go to ${slide.title}`}
                                aria-pressed={index === currentSlide}
                            />
                        ))}
                    </div>
                    <button
                        type="button"
                        onClick={showNextSlide}
                        className="grid h-10 w-10 place-items-center rounded-full border border-white/35 bg-[#081629]/60 text-white shadow-lg backdrop-blur-sm transition hover:bg-[#081629]/85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                        aria-label="Next destination"
                    >
                        <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m9 18 6-6-6-6" />
                        </svg>
                    </button>
                </div>
                {HERO_SLIDER_IMAGES[currentSlide]?.imageAttribution && (
                    <a
                        href={HERO_SLIDER_IMAGES[currentSlide].imageAttribution?.source}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`Hero photo credit: ${HERO_SLIDER_IMAGES[currentSlide].imageAttribution?.name}, ${HERO_SLIDER_IMAGES[currentSlide].imageAttribution?.license}`}
                        className="absolute right-4 top-4 z-20 max-w-[42%] truncate rounded bg-[#081629]/45 px-2 py-1 text-right text-[10px] leading-4 text-white/80 underline underline-offset-2 hover:text-white sm:right-6"
                    >
                        Photo: {HERO_SLIDER_IMAGES[currentSlide].imageAttribution?.name} ·{" "}
                        {HERO_SLIDER_IMAGES[currentSlide].imageAttribution?.license}
                    </a>
                )}
            </section>

            {/* District destinations */}
            <section className="py-12 md:py-16 bg-white">
                <Container>
                    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
                        <div>
                            <h2 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
                                Explore Bihar's Top Circuits
                            </h2>
                            <p className="text-gray-600 mt-2 text-sm md:text-base">Discover the most popular travel destinations and experiences.</p>
                        </div>
                        <Link
                            href="/services/tourism"
                            className="text-sm font-bold text-orange-500 hover:text-orange-600 flex items-center gap-2 transition-colors"
                        >
                            View all destinations →
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        {BIHAR_DESTINATIONS.map((destination) => (
                            <div key={destination.district} className="min-w-0">
                                <Link
                                    href={`/services/tourism?district=${encodeURIComponent(destination.district)}`}
                                    className="group relative block aspect-[4/5] overflow-hidden rounded-xl bg-slate-900 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                                >
                                    <TourismImage
                                        src={destination.img}
                                        alt={destination.alt}
                                        objectPosition={destination.objectPosition}
                                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                                    <div className="absolute inset-x-0 bottom-0 p-4">
                                        <h3 className="text-lg font-bold text-white">{destination.name}</h3>
                                        <p className="mt-1 text-sm text-white/80">{destination.tag}</p>
                                        <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-orange-500/90 px-2 py-0.5 text-[10px] font-bold text-white">
                                            Explore District
                                        </span>
                                    </div>
                                </Link>
                                {destination.imageAttribution && (
                                    <PhotoCredit attribution={destination.imageAttribution} />
                                )}
                            </div>
                        ))}
                    </div>
                </Container>
            </section>

            {/* Trust Section */}
            <section className="py-12 md:py-16 bg-slate-50">
                <Container>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="text-center md:text-left">
                            <div className="w-16 h-16 rounded-2xl bg-teal-100 flex items-center justify-center mx-auto md:mx-0 mb-4">
                                <svg className="w-8 h-8 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Local experiences</h3>
                            <p className="text-sm text-gray-600">Authentic, community-led travel</p>
                        </div>
                        <div className="text-center md:text-left">
                            <div className="w-16 h-16 rounded-2xl bg-orange-100 flex items-center justify-center mx-auto md:mx-0 mb-4">
                                <svg className="w-8 h-8 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Explore local services</h3>
                            <p className="text-sm text-gray-600">Check provider details and availability before requesting</p>
                        </div>
                        <div className="text-center md:text-left">
                            <div className="w-16 h-16 rounded-2xl bg-cyan-100 flex items-center justify-center mx-auto md:mx-0 mb-4">
                                <svg className="w-8 h-8 text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Easy trip planning</h3>
                            <p className="text-sm text-gray-600">Curated itineraries for every traveler</p>
                        </div>
                    </div>
                </Container>
            </section>

            {/* Travel Experiences Section */}
            <section className="py-12 md:py-16 bg-white">
                <Container>
                    <div className="mb-8">
                        <h2 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
                            Plan your journey, your way
                        </h2>
                        <p className="text-gray-600 mt-2 text-sm md:text-base">Curated travel experiences, local culture, comfortable stays and reliable transport.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Heritage & Spiritual Tours */}
                        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
                            <div className="w-14 h-14 rounded-xl bg-teal-100 flex items-center justify-center mb-4">
                                <svg className="w-7 h-7 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Heritage & Spiritual Tours</h3>
                            <p className="text-sm text-gray-600 mb-4">Visit ancient sites, temples and spiritual destinations.</p>
                            <Link
                                href="/services/tourism"
                                className="inline-flex items-center text-sm font-bold text-teal-600 hover:text-teal-700 transition-colors"
                            >
                                Explore Tours →
                            </Link>
                        </div>

                        {/* Local Experiences */}
                        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
                            <div className="w-14 h-14 rounded-xl bg-orange-100 flex items-center justify-center mb-4">
                                <svg className="w-7 h-7 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Local Experiences</h3>
                            <p className="text-sm text-gray-600 mb-4">Discover local culture, art, food and traditional villages.</p>
                            <Link
                                href="/services/tourism"
                                className="inline-flex items-center text-sm font-bold text-orange-600 hover:text-orange-700 transition-colors"
                            >
                                Explore Experiences →
                            </Link>
                        </div>

                        {/* Stays & Transport */}
                        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
                            <div className="w-14 h-14 rounded-xl bg-cyan-100 flex items-center justify-center mb-4">
                                <svg className="w-7 h-7 text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Stays & Transport</h3>
                            <p className="text-sm text-gray-600 mb-4">Find comfortable stays and reliable transport options.</p>
                            <Link
                                href="/services/tourism"
                                className="inline-flex items-center text-sm font-bold text-cyan-600 hover:text-cyan-700 transition-colors"
                            >
                                Explore Stays →
                            </Link>
                        </div>
                    </div>
                </Container>
            </section>

            <section className="py-8 bg-white">
                <Container>
                    <Link
                        href="/services/tourism?district=Jamui"
                        className="inline-flex text-sm font-bold text-teal-600 hover:text-teal-700"
                    >
                        Explore Jamui places, map and tourism assistant
                        <span className="ml-2" aria-hidden="true">→</span>
                    </Link>
                </Container>
            </section>
        </main>
    );
}
