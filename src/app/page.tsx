
import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/Container";
import { TourismImage, TourismPhotoCredit } from "@/components/TourismImage";
import {
    BIHAR_DESTINATIONS,
    CATEGORY_IMAGE,
    CATEGORY_TAGLINE,
    EVENT_VENUES,
    SERVICE_CATEGORIES,
    TOURISM_IMAGE_ASSETS,
} from "@/lib/constants";

const EVENT_CATEGORY_DETAILS: Record<
    string,
    { title: string; label: string; icon: string }
> = {
    Catering: {
        title: "Food for every celebration",
        label: "Catering",
        icon: "🍽️",
    },
    Photography: {
        title: "Moments worth keeping",
        label: "Photography",
        icon: "📷",
    },
    DJ: {
        title: "Music & entertainment",
        label: "Live entertainment",
        icon: "🎶",
    },
    "Mehendi & Makeup": {
        title: "Artistry for your occasion",
        label: "Beauty & culture",
        icon: "✨",
    },
    Restaurant: {
        title: "Gather, stay and celebrate",
        label: "Hotels & venues",
        icon: "🏨",
    },
    Transport: {
        title: "Travel around Bihar",
        label: "Transport",
        icon: "🚕",
    },
};

const QUICK_SERVICES = [
    {
        title: "Hotels & Stays",
        subtitle: "Find a place to stay",
        icon: "🏨",
        href: "/hotels",
        color: "bg-violet-50 text-violet-700",
    },
    {
        title: "Transport",
        subtitle: "Plan your journey",
        icon: "🚕",
        href: "/travel-tourism/faabcab",
        color: "bg-orange-50 text-orange-700",
    },
    {
        title: "Events",
        subtitle: "Celebrate special moments",
        icon: "🎉",
        href: "/events",
        color: "bg-pink-50 text-pink-700",
    },
    {
        title: "Catering",
        subtitle: "Food for every occasion",
        icon: "🍽️",
        href: "/explore?category=Catering",
        color: "bg-amber-50 text-amber-700",
    },
    {
        title: "Tour Packages",
        subtitle: "Explore curated journeys",
        icon: "🧳",
        href: "/combo-packs",
        color: "bg-cyan-50 text-cyan-700",
    },
    {
        title: "Local Experiences",
        subtitle: "Discover Bihar",
        icon: "📍",
        href: "/travel-tourism",
        color: "bg-emerald-50 text-emerald-700",
    },
];

const FEATURED_DESTINATIONS = [
    {
        district: "Gaya",
        name: "Bodh Gaya",
        category: "Buddhist heritage",
    },
    {
        district: "Nalanda",
        name: "Nalanda",
        category: "Ancient university",
    },
    {
        district: "Rajgir",
        name: "Rajgir",
        category: "Hills & heritage",
    },
    {
        district: "Vaishali",
        name: "Vaishali",
        category: "Archaeological heritage",
    },
    {
        district: "Madhubani",
        name: "Madhubani",
        category: "Mithila art & culture",
    },
    {
        district: "Sitamarhi",
        name: "Sitamarhi",
        category: "Punaura Dham",
    },
];

const TRAVEL_PACK_IMAGES = [
    TOURISM_IMAGE_ASSETS["simultala-hill-station"],
    TOURISM_IMAGE_ASSETS["minto-tower-gidhaur"],
    TOURISM_IMAGE_ASSETS["nalanda-ruins"],
    TOURISM_IMAGE_ASSETS["vishwa-shanti-stupa"],
];

const HERO_IMAGES = [
    TOURISM_IMAGE_ASSETS["patna-golghar"],
    TOURISM_IMAGE_ASSETS["nalanda-ruins"],
    TOURISM_IMAGE_ASSETS["vishwa-shanti-stupa"],
    TOURISM_IMAGE_ASSETS["simultala-hill-station"],
];

const TRUST_BENEFITS = [
    {
        icon: "◇",
        title: "Local Choices",
        description: "Explore Bihar-based services and destinations.",
    },
    {
        icon: "✓",
        title: "Partner Listings",
        description: "Browse the partners listed on Evigo.",
    },
    {
        icon: "↗",
        title: "Easy Booking",
        description: "Send booking requests through the site.",
    },
    {
        icon: "☎",
        title: "Support Contacts",
        description: "Reach the team by email or phone.",
    },
];

export default function Home() {
    const destinations = FEATURED_DESTINATIONS.map((featured) => ({
        ...featured,
        destination: BIHAR_DESTINATIONS.find(
            (item) => item.district === featured.district
        ),
    })).filter((item) => item.destination);

    const featuredVenues = EVENT_VENUES.slice(0, 5);

    return (
        <main className="flex-1 overflow-hidden bg-white text-slate-900">

            {/* HERO SECTION */}
            <section className="relative overflow-hidden bg-gradient-to-br from-[#f7f5ff] via-white to-[#eef7ff]">
                <Container className="relative grid items-center gap-10 py-12 sm:py-16 lg:min-h-[560px] lg:grid-cols-[0.95fr_1.05fr] lg:gap-12 lg:py-16">

                    {/* Hero content */}
                    <div className="relative z-10">
                        <span className="inline-flex items-center gap-2 rounded-full border border-violet-100 bg-white px-4 py-2 text-xs font-bold text-violet-700 shadow-sm">
                            <span className="h-2 w-2 rounded-full bg-orange-500" />
                            Your Bihar Experience Partner
                        </span>

                        <h1 className="mt-6 max-w-2xl text-4xl font-black leading-[1.08] tracking-tight text-[#17233d] sm:text-5xl lg:text-6xl">
                            Discover, Plan &amp;
                            <span className="block bg-gradient-to-r from-violet-700 to-indigo-500 bg-clip-text text-transparent">
                                Experience Bihar
                            </span>
                        </h1>

                        <p className="mt-6 max-w-xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
                            A platform for events, travel, stays and local experiences.
                            Explore Bihar and connect with service providers through Evigo.
                        </p>

                        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                            <Link
                                href="/events"
                                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-violet-700 px-6 text-sm font-bold text-white shadow-lg shadow-violet-200 transition hover:-translate-y-0.5 hover:bg-violet-800"
                            >
                                Explore Events <span className="ml-2">→</span>
                            </Link>

                            <Link
                                href="/travel-tourism"
                                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-6 text-sm font-bold text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:border-violet-300 hover:text-violet-700"
                            >
                                Explore Travel &amp; Tourism <span className="ml-2">→</span>
                            </Link>
                        </div>

                        {/* Trust indicators */}
                        <div className="mt-8 flex flex-wrap gap-x-5 gap-y-3 text-xs font-semibold text-slate-600">
                            <span className="flex items-center gap-2">
                                <span className="text-emerald-600">✓</span>
                                Partner listings
                            </span>
                            <span className="flex items-center gap-2">
                                <span className="text-emerald-600">✓</span>
                                Multiple services
                            </span>
                            <span className="flex items-center gap-2">
                                <span className="text-emerald-600">✓</span>
                                Bihar focused
                            </span>
                        </div>
                    </div>

                    {/* Hero image collage */}
                    <div className="relative mx-auto w-full max-w-[650px]">
                        <div className="absolute -inset-5 rounded-[40px] bg-gradient-to-br from-violet-200/60 to-cyan-100/60 blur-2xl" />

                        <div className="relative grid grid-cols-2 gap-3 sm:gap-4">
                            {HERO_IMAGES.map((image, index) => (
                                <div
                                    key={image.src}
                                    className={`relative overflow-hidden rounded-2xl bg-slate-100 shadow-lg ${index === 0
                                        ? "aspect-[1.12/1]"
                                        : index === 1
                                            ? "mt-7 aspect-[1.12/1]"
                                            : index === 2
                                                ? "-mt-7 aspect-[1.12/1]"
                                                : "aspect-[1.12/1]"
                                        }`}
                                >
                                    <TourismImage
                                        src={image.src}
                                        alt={image.alt}
                                        attribution={image.attribution}
                                        sizes="(max-width: 640px) 50vw, 320px"
                                        className="object-cover transition duration-700 hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/35 to-transparent" />

                                    {image.attribution && (
                                        <TourismPhotoCredit
                                            attribution={image.attribution}
                                            className="absolute bottom-1 left-1 z-10 max-w-[calc(100%-0.5rem)] truncate rounded bg-black/65 px-1.5 py-0.5 text-[8px] text-white"
                                        />
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="absolute -bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-3 whitespace-nowrap rounded-2xl border border-white bg-white/95 px-5 py-3 shadow-xl sm:left-auto sm:right-3 sm:translate-x-0">
                            <span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-100 text-xl">
                                📍
                            </span>
                            <span>
                                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                    Explore Bihar
                                </span>
                                <span className="block text-sm font-extrabold text-slate-800">
                                    Heritage • Culture • Nature
                                </span>
                            </span>
                        </div>
                    </div>
                </Container>
            </section>

            {/* QUICK SERVICE NAVIGATION */}
            <section className="relative z-10 -mt-1 bg-white py-8 sm:py-10">
                <Container>
                    <div className="rounded-3xl border border-slate-200 bg-white p-3 shadow-[0_12px_45px_rgba(30,41,59,0.07)] sm:p-5">
                        <div className="mb-4 flex items-center justify-between gap-3 px-2">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-600">
                                    Explore Evigo
                                </p>
                                <h2 className="mt-1 text-lg font-black text-slate-900 sm:text-xl">
                                    What are you looking for?
                                </h2>
                            </div>
                            <Link
                                href="/explore"
                                className="shrink-0 text-xs font-bold text-violet-700 hover:text-violet-900"
                            >
                                Explore all →
                            </Link>
                        </div>

                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
                            {QUICK_SERVICES.map((service) => (
                                <Link
                                    key={service.title}
                                    href={service.href}
                                    className="group flex min-h-[105px] flex-col justify-center rounded-2xl border border-slate-100 bg-white p-3 transition duration-200 hover:-translate-y-1 hover:border-violet-200 hover:shadow-lg sm:p-4"
                                >
                                    <span
                                        className={`grid h-10 w-10 place-items-center rounded-xl text-xl ${service.color}`}
                                    >
                                        {service.icon}
                                    </span>
                                    <span className="mt-3 text-sm font-extrabold text-slate-800 group-hover:text-violet-700">
                                        {service.title}
                                    </span>
                                    <span className="mt-1 text-[10px] leading-4 text-slate-500 sm:text-xs">
                                        {service.subtitle}
                                    </span>
                                </Link>
                            ))}
                        </div>
                    </div>
                </Container>
            </section>

            {/* EVENTS IN BIHAR */}
            <section className="bg-[#fafbff] py-14 sm:py-16" aria-labelledby="events-heading">
                <Container>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-700">
                                Celebrate together
                            </p>
                            <h2
                                id="events-heading"
                                className="mt-2 text-3xl font-black tracking-tight text-[#17233d] sm:text-4xl"
                            >
                                Events &amp; Services in Bihar
                            </h2>
                            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                                Find services and professionals for celebrations and special
                                occasions.
                            </p>
                        </div>

                        <Link
                            href="/events"
                            className="inline-flex w-fit items-center gap-2 text-sm font-bold text-violet-700 hover:text-violet-900"
                        >
                            View All Services <span>→</span>
                        </Link>
                    </div>

                    <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                        {SERVICE_CATEGORIES.map((category) => {
                            const details = EVENT_CATEGORY_DETAILS[category];

                            const categoryName = String(category);
                            const href =
                                categoryName === "Restaurant"
                                    ? "/hotels"
                                    : categoryName === "Transport"
                                        ? "/travel-tourism/faabcab"
                                        : `/explore?category=${encodeURIComponent(categoryName)}`;

                            return (
                                <Link
                                    key={category}
                                    href={href}
                                    className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-violet-200 hover:shadow-xl"
                                >
                                    <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                                        <Image
                                            src={CATEGORY_IMAGE[category]}
                                            alt={`${category} services in Bihar`}
                                            fill
                                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 17vw"
                                            className="object-cover transition duration-700 group-hover:scale-105"
                                        />
                                        <span className="absolute left-3 top-3 rounded-full border border-white/80 bg-white/95 px-3 py-1 text-[10px] font-bold text-slate-700 shadow-sm">
                                            {details.label}
                                        </span>
                                    </div>

                                    <div className="flex min-h-[145px] flex-col p-4">
                                        <p className="text-xs font-semibold text-violet-700">
                                            {details.icon} {category}
                                        </p>
                                        <h3 className="mt-2 text-sm font-black leading-snug text-slate-900">
                                            {details.title}
                                        </h3>
                                        <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">
                                            {CATEGORY_TAGLINE[category]}
                                        </p>
                                        <span className="mt-auto pt-4 text-xs font-bold text-violet-700">
                                            Explore options →
                                        </span>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </Container>
            </section>

            {/* DISCOVER BIHAR */}
            <section
                className="bg-[#111d35] py-16 text-white sm:py-20"
                aria-labelledby="travel-heading"
            >
                <Container>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">
                                A place for every kind of journey
                            </p>
                            <h2
                                id="travel-heading"
                                className="mt-2 text-3xl font-black tracking-tight sm:text-4xl"
                            >
                                Discover Bihar
                            </h2>
                            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/70 sm:text-base">
                                Explore heritage sites, spiritual destinations, natural beauty
                                and vibrant culture.
                            </p>
                        </div>

                        <Link
                            href="/travel-tourism"
                            className="inline-flex w-fit items-center gap-2 text-sm font-bold text-cyan-300 transition hover:text-white"
                        >
                            View All Destinations <span>→</span>
                        </Link>
                    </div>

                    <div className="mt-9 grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
                        {destinations.map(({ district, name, category, destination }) => (
                            <div key={district} className="min-w-0">
                                <Link
                                    href={`/services/tourism?district=${encodeURIComponent(district)}`}
                                    className="group relative isolate block aspect-[3/4] overflow-hidden rounded-2xl border border-white/10 bg-slate-800 shadow-lg"
                                >
                                    <TourismImage
                                        src={destination!.img}
                                        alt={destination!.alt}
                                        attribution={destination!.imageAttribution}
                                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 17vw"
                                        className="object-cover transition duration-700 group-hover:scale-105"
                                    />

                                    <div className="absolute inset-0 bg-gradient-to-t from-[#071326] via-[#071326]/15 to-transparent opacity-95" />

                                    <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4">
                                        <span className="text-[10px] font-bold uppercase tracking-wide text-cyan-200">
                                            {category}
                                        </span>
                                        <h3 className="mt-1 text-base font-black text-white sm:text-lg">
                                            {name}
                                        </h3>
                                        <span className="mt-2 inline-block text-xs font-semibold text-white/80 group-hover:text-cyan-200">
                                            Explore district →
                                        </span>
                                    </div>
                                </Link>

                                {destination!.imageAttribution && (
                                    <TourismPhotoCredit
                                        attribution={destination!.imageAttribution}
                                        className="mt-1 truncate text-[9px] leading-3 text-white/60"
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                </Container>
            </section>

            {/* VERIFIED HOTELS AND VENUES */}
            <section
                className="bg-[#f7f8fc] py-16 sm:py-20"
                aria-labelledby="stay-heading"
            >
                <Container>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-700">
                                Rest easy, celebrate beautifully
                            </p>
                            <h2
                                id="stay-heading"
                                className="mt-2 text-3xl font-black tracking-tight text-[#17233d] sm:text-4xl"
                            >
                                Stay &amp; Celebrate
                            </h2>
                            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                                Explore the hotel and venue partners listed on Evigo.
                            </p>
                        </div>

                        <Link
                            href="/hotels"
                            className="inline-flex w-fit items-center gap-2 text-sm font-bold text-violet-700 hover:text-violet-900"
                        >
                            View All Hotels &amp; Venues <span>→</span>
                        </Link>
                    </div>

                    <div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                        {featuredVenues.map((venue) => (
                            <Link
                                key={venue.id}
                                href={`/hotels#${venue.id}`}
                                className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
                            >
                                <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                                    <Image
                                        src={venue.images[0]}
                                        alt={`${venue.name} property`}
                                        fill
                                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 20vw"
                                        className="object-cover transition duration-700 group-hover:scale-105"
                                    />

                                    <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-800 shadow-sm">
                                        Listed partner
                                    </span>
                                </div>

                                <div className="p-4">
                                    <h3 className="text-base font-black text-[#17233d]">
                                        {venue.name}
                                    </h3>

                                    <p className="mt-1 text-xs text-slate-500">
                                        {venue.location}
                                    </p>

                                    {venue.description && (
                                        <p className="mt-3 line-clamp-2 text-xs leading-5 text-slate-600">
                                            {venue.description}
                                        </p>
                                    )}

                                    <span className="mt-4 inline-flex text-xs font-bold text-violet-700">
                                        View property →
                                    </span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </Container>
            </section>

            {/* TRAVEL PACK COMBO AND FAABCAB */}
            <section
                className="bg-white py-16 sm:py-20"
                aria-label="Travel package and transport promotions"
            >
                <Container>
                    <div className="grid items-stretch gap-6 lg:grid-cols-2">

                        {/* Travel Pack Combo */}
                        <article className="overflow-hidden rounded-3xl border border-orange-100 bg-[#fff8ef] shadow-sm">
                            <div className="grid h-full sm:grid-cols-[0.9fr_1.1fr]">
                                <div className="grid min-h-64 grid-cols-2 grid-rows-2 gap-1.5 bg-orange-100 p-1.5 sm:min-h-full">
                                    {TRAVEL_PACK_IMAGES.map((image) => (
                                        <div
                                            key={image.src}
                                            className="relative min-h-28 overflow-hidden rounded-xl"
                                        >
                                            <TourismImage
                                                src={image.src}
                                                alt={image.alt}
                                                attribution={image.attribution}
                                                sizes="(max-width: 640px) 50vw, 240px"
                                                className="object-cover"
                                            />

                                            {image.attribution && (
                                                <TourismPhotoCredit
                                                    attribution={image.attribution}
                                                    className="absolute bottom-1 left-1 z-10 max-w-[calc(100%-0.5rem)] truncate rounded bg-black/70 px-1 text-[8px] leading-3 text-white"
                                                />
                                            )}
                                        </div>
                                    ))}
                                </div>

                                <div className="flex flex-col p-6 sm:p-7">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-800">
                                        Bihar • Curated Journey
                                    </p>

                                    <h2 className="mt-3 text-2xl font-black tracking-tight text-[#17233d] sm:text-3xl">
                                        Travel Pack Combo
                                    </h2>

                                    <p className="mt-3 text-sm leading-6 text-slate-600">
                                        Explore travel and service combinations for your Bihar
                                        journey. Contact the team to discuss your requirements.
                                    </p>

                                    <ul className="mt-5 space-y-3 text-sm font-semibold text-slate-700">
                                        {[
                                            "Explore travel options",
                                            "Discover local destinations",
                                            "Ask about available services",
                                        ].map((benefit) => (
                                            <li key={benefit} className="flex items-center gap-2.5">
                                                <span className="grid h-6 w-6 place-items-center rounded-full bg-teal-100 text-xs font-black text-teal-800">
                                                    ✓
                                                </span>
                                                {benefit}
                                            </li>
                                        ))}
                                    </ul>

                                    <Link
                                        href="/combo-packs"
                                        className="mt-6 inline-flex min-h-11 w-fit items-center justify-center rounded-xl bg-orange-500 px-5 text-sm font-bold text-white transition hover:bg-orange-600"
                                    >
                                        Explore Travel Packs <span className="ml-2">→</span>
                                    </Link>
                                </div>
                            </div>
                        </article>

                        {/* FaabCab */}
                        <article className="overflow-hidden rounded-3xl border border-[#223956] bg-[#101d34] text-white shadow-sm">
                            <div className="grid h-full sm:grid-cols-[1.1fr_0.9fr]">
                                <div className="flex flex-col p-6 sm:p-7">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-300">
                                        Transport Partner
                                    </p>

                                    <h2 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">
                                        FaabCab
                                    </h2>

                                    <p className="mt-3 text-sm leading-6 text-white/75">
                                        Explore transport options for your journeys across Bihar.
                                        Submit an enquiry to discuss your route and requirements.
                                    </p>

                                    <ul className="mt-5 grid grid-cols-2 gap-2 text-xs font-semibold text-white/85">
                                        {[
                                            "Inter-city travel",
                                            "Airport travel enquiries",
                                            "Railway pickup enquiries",
                                            "Local travel enquiries",
                                        ].map((service) => (
                                            <li
                                                key={service}
                                                className="rounded-lg border border-white/10 bg-white/5 px-3 py-2.5"
                                            >
                                                {service}
                                            </li>
                                        ))}
                                    </ul>

                                    <Link
                                        href="/travel-tourism/faabcab"
                                        className="mt-6 inline-flex min-h-11 w-fit items-center justify-center rounded-xl bg-orange-500 px-5 text-sm font-bold text-white transition hover:bg-orange-600"
                                    >
                                        Explore FaabCab <span className="ml-2">→</span>
                                    </Link>
                                </div>

                                <div className="relative min-h-64 bg-[#18263b]">
                                    <Image
                                        src="/faabcab-vehicle.jpg"
                                        alt="FaabCab transport vehicle"
                                        fill
                                        sizes="(max-width: 640px) 100vw, 440px"
                                        className="object-cover"
                                    />

                                    <div className="absolute inset-0 bg-gradient-to-t from-[#101d34]/50 via-transparent to-transparent sm:bg-gradient-to-r sm:from-[#101d34]/30 sm:to-transparent" />
                                </div>
                            </div>
                        </article>

                    </div>
                </Container>
            </section>

            {/* BENEFITS STRIP */}
            <section
                className="border-t border-slate-200 bg-[#f5f7fc] py-9"
                aria-label="Evigo benefits"
            >
                <Container>
                    <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
                        {TRUST_BENEFITS.map((benefit) => (
                            <div key={benefit.title} className="flex items-start gap-3">
                                <span
                                    className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-violet-100 text-lg font-bold text-violet-800"
                                    aria-hidden="true"
                                >
                                    {benefit.icon}
                                </span>

                                <div>
                                    <h2 className="text-sm font-black text-[#17233d]">
                                        {benefit.title}
                                    </h2>
                                    <p className="mt-1 text-xs leading-5 text-slate-600">
                                        {benefit.description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </Container>
            </section>
        </main>
    );
}
