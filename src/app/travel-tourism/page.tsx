"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Container } from "@/components/Container";
import { TourismImage, TourismPhotoCredit } from "@/components/TourismImage";
import { BIHAR_DESTINATIONS } from "@/lib/constants";

const EXPERIENCE_CARDS = [
    {
        title: "Heritage & Spiritual Tours",
        description: "Explore ancient monasteries, historic landmarks and sacred destinations.",
        href: "/services/tourism?tripType=heritage",
        icon: "🏛️",
        tone: "from-violet-100 to-purple-50",
        accent: "text-violet-700",
    },
    {
        title: "Local Experiences",
        description: "Discover Bihar's culture, local food, art and traditional communities.",
        href: "/services/tourism?tripType=culture",
        icon: "✦",
        tone: "from-orange-100 to-amber-50",
        accent: "text-orange-700",
    },
    {
        title: "Stays & Transport",
        description: "Find comfortable stays and convenient transport for your journey.",
        href: "/hotels",
        icon: "⌂",
        tone: "from-sky-100 to-cyan-50",
        accent: "text-sky-700",
    },
];

const TRUST_ITEMS = [
    { icon: "✦", title: "Local experiences", text: "Discover Bihar beyond the usual routes." },
    { icon: "✓", title: "Verified partners", text: "Explore trusted stays, guides and services." },
    { icon: "⌖", title: "Easy trip planning", text: "Find destinations and plan your visit." },
];

export default function TravelTourismPage() {
    const router = useRouter();
    const [searchData, setSearchData] = useState({
        destination: "",
        tripType: "",
        date: "",
    });
    const [searchError, setSearchError] = useState("");

    const handleSearch = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!searchData.destination || !searchData.tripType || !searchData.date) {
            setSearchError("Please choose a destination, trip type, and travel date.");
            return;
        }

        const parsedDate = new Date(`${searchData.date}T00:00:00.000Z`);
        if (
            Number.isNaN(parsedDate.getTime()) ||
            parsedDate.toISOString().slice(0, 10) !== searchData.date
        ) {
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

    const heroDestinations = BIHAR_DESTINATIONS.slice(0, 4);

    return (
        <main className="flex-1 overflow-hidden bg-[#fcfaff] text-[#17213d]">
            {/* HERO — fixed collage, no automatic image slider */}
            <section className="relative overflow-hidden bg-gradient-to-br from-[#f3edff] via-[#fffaff] to-[#fff0e8]">
                <div className="pointer-events-none absolute -left-40 top-10 h-96 w-96 rounded-full bg-violet-300/30 blur-[100px]" />
                <div className="pointer-events-none absolute -right-32 top-0 h-96 w-96 rounded-full bg-orange-200/35 blur-[100px]" />

                <Container className="relative grid items-center gap-12 py-14 sm:py-18 lg:min-h-[590px] lg:grid-cols-[0.9fr_1.1fr] lg:gap-10 lg:py-16">
                    <div className="relative z-10">
                        <span className="inline-flex items-center gap-2 rounded-full border border-violet-200/80 bg-white/85 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.16em] text-violet-800 shadow-sm">
                            <span className="h-2 w-2 rounded-full bg-orange-500" />
                            Evigo Travel & Tourism
                        </span>

                        <h1 className="mt-6 max-w-xl text-4xl font-black leading-[1.08] tracking-tight text-[#17213d] sm:text-5xl lg:text-[3.8rem]">
                            Explore the
                            <span className="block bg-gradient-to-r from-violet-700 via-purple-600 to-orange-500 bg-clip-text text-transparent">
                                Heritage of Bihar
                            </span>
                        </h1>

                        <p className="mt-5 max-w-xl text-base leading-8 text-slate-600 sm:text-lg">
                            From timeless heritage and spiritual landmarks to vibrant
                            local culture, discover the places and experiences that
                            make Bihar unforgettable.
                        </p>

                        <div className="mt-7 flex flex-wrap gap-3">
                            <Link
                                href="/services/tourism"
                                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-gradient-to-r from-violet-700 to-purple-600 px-6 text-sm font-bold text-white shadow-lg shadow-violet-200 transition hover:-translate-y-0.5 hover:shadow-xl"
                            >
                                Explore Destinations <span className="ml-2">→</span>
                            </Link>
                            <Link
                                href="#experiences"
                                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-violet-200 bg-white/90 px-6 text-sm font-bold text-violet-800 shadow-sm transition hover:-translate-y-0.5 hover:border-violet-300"
                            >
                                Discover Experiences
                            </Link>
                        </div>

                        <div className="mt-8 flex flex-wrap gap-2.5">
                            {[
                                ["🏛️", "Heritage"],
                                ["🛕", "Spiritual"],
                                ["🌿", "Nature & Culture"],
                            ].map(([icon, label]) => (
                                <span
                                    key={label}
                                    className="inline-flex items-center gap-2 rounded-full border border-white bg-white/75 px-3.5 py-2 text-xs font-bold text-slate-700 shadow-sm"
                                >
                                    <span>{icon}</span>
                                    {label}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Fixed four-image destination collage */}
                    <div className="relative mx-auto w-full max-w-[650px]">
                        <div className="absolute -inset-5 rounded-[40px] bg-gradient-to-br from-violet-300/40 to-orange-200/40 blur-2xl" />
                        <div className="relative grid grid-cols-[1.15fr_0.85fr] gap-3 sm:gap-4">
                            {heroDestinations[0] && (
                                <Link
                                    href={`/services/tourism?district=${encodeURIComponent(heroDestinations[0].district)}`}
                                    className="group relative min-h-[330px] overflow-hidden rounded-[28px] border-4 border-white shadow-xl sm:min-h-[420px]"
                                >
                                    <TourismImage
                                        src={heroDestinations[0].img}
                                        alt={heroDestinations[0].alt}
                                        attribution={heroDestinations[0].imageAttribution}
                                        objectPosition={heroDestinations[0].objectPosition}
                                        loading="eager"
                                        sizes="(max-width: 768px) 60vw, 34vw"
                                        className="object-cover transition duration-700 group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#10172c]/75 via-transparent to-transparent" />
                                    <div className="absolute bottom-5 left-5 right-4 text-white">
                                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/80">
                                            Discover Bihar
                                        </span>
                                        <h2 className="mt-2 text-2xl font-black sm:text-3xl">
                                            {heroDestinations[0].name}
                                        </h2>
                                        <p className="mt-1 text-xs text-white/85">
                                            {heroDestinations[0].tag}
                                        </p>
                                    </div>
                                </Link>
                            )}

                            <div className="grid gap-3 sm:gap-4">
                                {heroDestinations.slice(1, 4).map((destination, index) => (
                                    <Link
                                        key={destination.name}
                                        href={`/services/tourism?district=${encodeURIComponent(destination.district)}`}
                                        className={`group relative min-h-[102px] overflow-hidden rounded-[22px] border-4 border-white shadow-lg sm:min-h-[128px] ${index === 2 ? "hidden sm:block" : ""
                                            }`}
                                    >
                                        <TourismImage
                                            src={destination.img}
                                            alt={destination.alt}
                                            attribution={destination.imageAttribution}
                                            objectPosition={destination.objectPosition}
                                            loading="lazy"
                                            sizes="(max-width: 768px) 35vw, 22vw"
                                            className="object-cover transition duration-700 group-hover:scale-110"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                                        <div className="absolute bottom-3 left-3 right-3">
                                            <p className="text-sm font-black text-white sm:text-base">
                                                {destination.name}
                                            </p>
                                            <p className="mt-0.5 line-clamp-1 text-[10px] text-white/80">
                                                {destination.tag}
                                            </p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>

                        <div className="absolute -bottom-5 right-3 rounded-2xl border border-white bg-white/95 px-4 py-3 shadow-xl sm:-right-4">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-violet-600">
                                Explore more
                            </p>
                            <p className="text-sm font-black text-[#17213d]">
                                Experience Bihar with Evigo
                            </p>
                        </div>
                    </div>
                </Container>
            </section>

            {/* FLOATING SEARCH PANEL */}
            <section className="relative z-10 -mt-1 bg-white pb-10 pt-8 sm:pb-12">
                <Container>
                    <form
                        noValidate
                        onSubmit={handleSearch}
                        className="rounded-[24px] border border-violet-100 bg-white p-5 shadow-[0_18px_55px_rgba(69,36,115,0.10)] sm:p-7"
                    >
                        <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
                            <div>
                                <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-violet-700">
                                    Plan your journey
                                </p>
                                <h2 className="mt-1 text-xl font-black text-[#17213d] sm:text-2xl">
                                    Where would you like to go?
                                </h2>
                            </div>
                            <span className="rounded-full bg-orange-50 px-3 py-1.5 text-[11px] font-bold text-orange-700">
                                Your Bihar trip starts here
                            </span>
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_1fr_1fr_auto]">
                            <div>
                                <label
                                    htmlFor="tourism-destination"
                                    className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500"
                                >
                                    Destination
                                </label>
                                <select
                                    id="tourism-destination"
                                    name="destination"
                                    required
                                    value={searchData.destination}
                                    onChange={(event) => {
                                        setSearchData((current) => ({
                                            ...current,
                                            destination: event.target.value,
                                        }));
                                        setSearchError("");
                                    }}
                                    className="min-h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-violet-500 focus:bg-white focus:ring-2 focus:ring-violet-100"
                                >
                                    <option value="">Choose destination</option>
                                    {BIHAR_DESTINATIONS.map((destination) => (
                                        <option key={destination.name} value={destination.district}>
                                            {destination.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label
                                    htmlFor="tourism-trip-type"
                                    className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500"
                                >
                                    Experience
                                </label>
                                <select
                                    id="tourism-trip-type"
                                    name="tripType"
                                    required
                                    value={searchData.tripType}
                                    onChange={(event) => {
                                        setSearchData((current) => ({
                                            ...current,
                                            tripType: event.target.value,
                                        }));
                                        setSearchError("");
                                    }}
                                    className="min-h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-violet-500 focus:bg-white focus:ring-2 focus:ring-violet-100"
                                >
                                    <option value="">Choose experience</option>
                                    <option value="spiritual">Spiritual Circuit</option>
                                    <option value="heritage">Heritage Trail</option>
                                    <option value="nature">Nature & Adventure</option>
                                    <option value="culture">Food & Culture</option>
                                </select>
                            </div>

                            <div>
                                <label
                                    htmlFor="tourism-travel-date"
                                    className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500"
                                >
                                    Travel date
                                </label>
                                <input
                                    id="tourism-travel-date"
                                    name="date"
                                    type="date"
                                    required
                                    value={searchData.date}
                                    onChange={(event) => {
                                        setSearchData((current) => ({
                                            ...current,
                                            date: event.target.value,
                                        }));
                                        setSearchError("");
                                    }}
                                    className="min-h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-violet-500 focus:bg-white focus:ring-2 focus:ring-violet-100"
                                />
                            </div>

                            <div className="flex items-end">
                                <button
                                    type="submit"
                                    className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-700 to-purple-600 px-7 text-sm font-bold text-white shadow-lg shadow-violet-200 transition hover:-translate-y-0.5 hover:shadow-xl md:w-auto"
                                >
                                    <svg
                                        aria-hidden="true"
                                        className="h-5 w-5"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <circle cx="11" cy="11" r="7" strokeWidth="2" />
                                        <path d="m16 16 4 4" strokeWidth="2" strokeLinecap="round" />
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
            </section>

            {/* TRUST STRIP */}
            <section className="border-y border-violet-100 bg-[#faf7ff] py-9 sm:py-11">
                <Container>
                    <div className="grid gap-7 sm:grid-cols-3 sm:gap-5">
                        {TRUST_ITEMS.map((item) => (
                            <div key={item.title} className="flex items-center gap-4">
                                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-violet-100 to-orange-50 text-xl font-black text-violet-700">
                                    {item.icon}
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-[#17213d]">
                                        {item.title}
                                    </h3>
                                    <p className="mt-1 text-xs leading-5 text-slate-500">
                                        {item.text}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </Container>
            </section>

            {/* POPULAR DESTINATIONS */}
            <section className="bg-white py-14 sm:py-20">
                <Container>
                    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <span className="text-xs font-extrabold uppercase tracking-[0.2em] text-violet-700">
                                Explore the state
                            </span>
                            <h2 className="mt-2 text-3xl font-black tracking-tight text-[#17213d] sm:text-4xl">
                                Popular Destinations
                            </h2>
                            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500 sm:text-base">
                                Discover the landmarks, culture and experiences that make Bihar special.
                            </p>
                        </div>
                        <Link
                            href="/services/tourism"
                            className="inline-flex w-fit items-center gap-2 text-sm font-extrabold text-violet-700 transition hover:gap-3"
                        >
                            View all destinations <span>→</span>
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                        {BIHAR_DESTINATIONS.slice(0, 4).map((destination, index) => (
                            <div key={destination.name} className="min-w-0">
                                <Link
                                    href={`/services/tourism?district=${encodeURIComponent(destination.district)}`}
                                    className="group relative block aspect-[4/5] overflow-hidden rounded-[24px] bg-slate-900 shadow-md transition duration-300 hover:-translate-y-1 hover:shadow-xl"
                                >
                                    <TourismImage
                                        src={destination.img}
                                        alt={destination.alt}
                                        attribution={destination.imageAttribution}
                                        objectPosition={destination.objectPosition}
                                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                                        className="object-cover transition duration-700 group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#10172c]/85 via-[#10172c]/10 to-transparent" />
                                    <div className="absolute left-4 top-4 rounded-full border border-white/30 bg-black/20 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur">
                                        0{index + 1} / Bihar
                                    </div>
                                    <div className="absolute inset-x-0 bottom-0 p-5">
                                        <h3 className="text-xl font-black text-white">
                                            {destination.name}
                                        </h3>
                                        <p className="mt-1 text-xs leading-5 text-white/80">
                                            {destination.tag}
                                        </p>
                                        <span className="mt-4 inline-flex items-center gap-2 text-xs font-extrabold text-white">
                                            Explore destination <span>→</span>
                                        </span>
                                    </div>
                                </Link>
                                {destination.imageAttribution && (
                                    <TourismPhotoCredit attribution={destination.imageAttribution} />
                                )}
                            </div>
                        ))}
                    </div>
                </Container>
            </section>

            {/* PLAN YOUR JOURNEY */}
            <section
                id="experiences"
                className="relative overflow-hidden bg-gradient-to-br from-[#f5efff] via-[#fffaff] to-[#fff1e9] py-14 sm:py-20"
            >
                <div className="pointer-events-none absolute -right-24 top-0 h-80 w-80 rounded-full bg-violet-200/30 blur-3xl" />
                <Container>
                    <div className="relative mb-9 max-w-2xl">
                        <span className="text-xs font-extrabold uppercase tracking-[0.2em] text-violet-700">
                            Travel your way
                        </span>
                        <h2 className="mt-2 text-3xl font-black tracking-tight text-[#17213d] sm:text-4xl">
                            Plan Your Journey, Your Way
                        </h2>
                        <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">
                            Choose the kind of Bihar experience you want to discover.
                        </p>
                    </div>

                    <div className="relative grid gap-5 md:grid-cols-3">
                        {EXPERIENCE_CARDS.map((card) => (
                            <Link
                                key={card.title}
                                href={card.href}
                                className="group rounded-[24px] border border-white bg-white/90 p-6 shadow-[0_10px_35px_rgba(69,36,115,0.07)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(69,36,115,0.12)]"
                            >
                                <div className={`grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br ${card.tone} text-2xl ${card.accent}`}>
                                    {card.icon}
                                </div>
                                <h3 className="mt-5 text-lg font-black text-[#17213d] transition group-hover:text-violet-700">
                                    {card.title}
                                </h3>
                                <p className="mt-2 min-h-[48px] text-sm leading-6 text-slate-500">
                                    {card.description}
                                </p>
                                <span className={`mt-5 inline-flex items-center gap-2 text-sm font-extrabold ${card.accent}`}>
                                    Explore more <span className="transition group-hover:translate-x-1">→</span>
                                </span>
                            </Link>
                        ))}
                    </div>

                    <div className="mt-9 flex flex-col gap-4 rounded-[24px] border border-violet-100 bg-white/80 p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-7">
                        <div>
                            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-violet-700">
                                A local favourite
                            </p>
                            <h3 className="mt-1 text-xl font-black text-[#17213d]">
                                Discover Jamui&apos;s hidden gems
                            </h3>
                            <p className="mt-1 text-sm text-slate-500">
                                Explore places, maps and tourism information for Jamui.
                            </p>
                        </div>
                        <Link
                            href="/services/tourism?district=Jamui"
                            className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-violet-700 to-purple-600 px-6 text-sm font-bold text-white shadow-lg shadow-violet-200 transition hover:-translate-y-0.5"
                        >
                            Explore Jamui <span className="ml-2">→</span>
                        </Link>
                    </div>
                </Container>

                {/* Bihar-inspired decorative landscape */}
                <div className="pointer-events-none relative mt-12 h-20 overflow-hidden sm:h-28">
                    <svg
                        viewBox="0 0 1440 120"
                        preserveAspectRatio="none"
                        className="absolute bottom-0 h-full w-full"
                        fill="none"
                        aria-hidden="true"
                    >
                        <path
                            d="M0 76 Q120 35 240 76 T480 76 T720 76 T960 76 T1200 76 T1440 64 V120 H0Z"
                            fill="#d9c3ff"
                            opacity=".55"
                        />
                        <path
                            d="M0 98 Q180 65 360 98 T720 98 T1080 98 T1440 86 V120 H0Z"
                            fill="#a78bfa"
                            opacity=".5"
                        />
                        <path
                            d="M0 112 Q180 88 360 112 T720 112 T1080 112 T1440 102 V120 H0Z"
                            fill="#7c3aed"
                            opacity=".55"
                        />
                    </svg>
                </div>
            </section>
        </main>
    );
}
