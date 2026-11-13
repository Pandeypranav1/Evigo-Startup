import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/Container";
import { TourismImage, TourismPhotoCredit } from "@/components/TourismImage";
import {
    BIHAR_DESTINATIONS,
    CATEGORY_IMAGE,
    CATEGORY_TAGLINE,
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
        icon: "•",
    },
    Photography: {
        title: "Moments worth keeping",
        label: "Photography",
        icon: "•",
    },
    DJ: {
        title: "Music & entertainment",
        label: "Live entertainment",
        icon: "•",
    },
    "Mehendi & Makeup": {
        title: "Artistry for your occasion",
        label: "Beauty & culture",
        icon: "•",
    },
    Restaurant: {
        title: "Gather, stay and celebrate",
        label: "Hotels & venues",
        icon: "•",
    },
    Transport: {
        title: "Travel around Bihar",
        label: "Transport",
        icon: "•",
    },
};

const QUICK_SERVICES = [
    {
        title: "Hotels & Stays",
        subtitle: "Find a place to stay",
        icon: "hotel",
        href: "/hotels",
        color: "bg-violet-50 text-violet-700",
    },
    {
        title: "Transport",
        subtitle: "Plan your journey",
        icon: "transport",
        href: "/travel-tourism/faabcab",
        color: "bg-orange-50 text-orange-700",
    },
    {
        title: "Events",
        subtitle: "Celebrate special moments",
        icon: "events",
        href: "/events",
        color: "bg-pink-50 text-pink-700",
    },
    {
        title: "Catering",
        subtitle: "Food for every occasion",
        icon: "catering",
        href: "/explore?category=Catering",
        color: "bg-amber-50 text-amber-700",
    },
    {
        title: "Tour Packages",
        subtitle: "Explore curated journeys",
        icon: "packages",
        href: "/combo-packs",
        color: "bg-cyan-50 text-cyan-700",
    },
    {
        title: "Local Experiences",
        subtitle: "Discover Bihar",
        icon: "discover",
        href: "/travel-tourism",
        color: "bg-emerald-50 text-emerald-700",
    },
];

function QuickServiceIcon({ name }: { name: string }) {
    const common = {
        fill: "none",
        stroke: "currentColor",
        strokeWidth: 1.8,
        strokeLinecap: "round" as const,
        strokeLinejoin: "round" as const,
    };

    const icons = {
        hotel: <><path {...common} d="M3 20V9l9-6 9 6v11" /><path {...common} d="M9 20v-6h6v6M7 10h.01M17 10h.01" /></>,
        transport: <><path {...common} d="M5 16l1-5 2-4h8l2 4 1 5" /><path {...common} d="M4 16h16v3H4zM7 19v2M17 19v2M7 13h10" /><circle cx="7.5" cy="16" r=".8" fill="currentColor" /><circle cx="16.5" cy="16" r=".8" fill="currentColor" /></>,
        events: <><path {...common} d="M7 3v3M17 3v3M4 8h16M5 5h14a1 1 0 0 1 1 1v13H4V6a1 1 0 0 1 1-1Z" /><path {...common} d="m9 14 2 2 4-4" /></>,
        catering: <><path {...common} d="M4 3v7M7 3v7M4 7h3M5.5 10v11M15 3v18M15 3c3 2 4 5 4 8h-4" /></>,
        packages: <><path {...common} d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" /><path {...common} d="m4.5 7.5 7.5 4 7.5-4M12 12v9M8 5l8 4" /></>,
        discover: <><circle {...common} cx="10.8" cy="10.8" r="7.3" /><path {...common} d="m16.2 16.2 4.3 4.3M13.8 7.8l-2 5-5 2 2-5 5-2Z" /></>,
    };

    return (
        <svg viewBox="0 0 24 24" className="h-7 w-7" aria-hidden="true">
            {icons[name as keyof typeof icons] ?? icons.discover}
        </svg>
    );
}


function EventServiceIcon({ category }: { category: string }) {
    const common = {
        fill: "none",
        stroke: "currentColor",
        strokeWidth: 1.9,
        strokeLinecap: "round" as const,
        strokeLinejoin: "round" as const,
    };

    let artwork;
    switch (category) {
        case "Catering":
            artwork = <><path {...common} d="M6 3v7M9 3v7M6 7h3M7.5 10v11M16 3v18M16 3c3 2 4 5 4 8h-4" /></>;
            break;
        case "Photography":
            artwork = <><path {...common} d="M4 8h4l2-2h4l2 2h4a1 1 0 0 1 1 1v10H3V9a1 1 0 0 1 1-1Z" /><circle {...common} cx="12" cy="13" r="3.5" /></>;
            break;
        case "DJ":
            artwork = <><path {...common} d="M9 18V5l11-2v13" /><circle {...common} cx="6" cy="18" r="3" /><circle {...common} cx="17" cy="16" r="3" /></>;
            break;
        case "Mehendi & Makeup":
            artwork = <><path {...common} d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1m8.6 8.6 2.1 2.1m0-12.8-2.1 2.1m-8.6 8.6-2.1 2.1" /><path {...common} d="M12 8.5c1.4 1.6 2.5 2.7 2.5 4.1a2.5 2.5 0 1 1-5 0c0-1.4 1.1-2.5 2.5-4.1Z" /></>;
            break;
        case "Restaurant":
            artwork = <><path {...common} d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6M8 9h.01M16 9h.01M12 9h.01" /></>;
            break;
        case "Transport":
            artwork = <><path {...common} d="m5 16 1.5-6 2-4h7l2 4 1.5 6M4 16h16v3H4zM7 19v2m10-2v2M7 13h10" /><circle cx="7.5" cy="16" r="1" fill="currentColor" /><circle cx="16.5" cy="16" r="1" fill="currentColor" /></>;
            break;
        default:
            artwork = <><circle {...common} cx="12" cy="12" r="8" /><path {...common} d="m8 12 2.5 2.5L16 9" /></>;
    }

    return (
        <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
            {artwork}
        </svg>
    );
}

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
    return (
        <main className="flex-1 overflow-hidden bg-white text-slate-900">

            {/* HERO SECTION */}
            <section className="relative isolate overflow-hidden bg-gradient-to-br from-[#fbfaff] via-white to-[#edf8ff]">
                {/* Soft decorative background accents */}
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -left-40 top-10 h-80 w-80 rounded-full bg-violet-200/35 blur-3xl"
                />
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-cyan-200/35 blur-3xl"
                />

                {/* Wider hero container reduces the empty space on both sides. */}
                <div className="relative mx-auto grid w-full max-w-[1520px] items-center gap-10 px-5 py-12 sm:px-8 sm:py-16 lg:min-h-[650px] lg:grid-cols-[minmax(0,0.94fr)_minmax(0,1.06fr)] lg:gap-10 lg:px-10 lg:py-16 xl:gap-14 xl:px-14 2xl:px-16">
                    {/* Hero content */}
                    <div className="relative z-10 mx-auto w-full max-w-[650px] lg:mx-0">
                        <span className="inline-flex items-center gap-2 rounded-full border border-violet-100 bg-white/90 px-4 py-2 text-xs font-bold text-violet-700 shadow-sm shadow-violet-100/70 backdrop-blur">
                            <span className="h-2 w-2 rounded-full bg-orange-500" />
                            Your Bihar Experience Partner
                        </span>

                        <h1 className="mt-6 max-w-2xl text-[clamp(2.75rem,4.2vw,4.15rem)] font-black leading-[1.04] tracking-[-0.045em] text-[#17233d]">
                            Discover, Plan&nbsp;&amp;
                            <span className="mt-1 block bg-gradient-to-r from-violet-700 via-violet-600 to-indigo-500 bg-clip-text pb-1 text-transparent">
                                Experience Bihar
                            </span>
                        </h1>

                        <p className="mt-6 max-w-xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
                            A platform for events, travel, stays and local experiences.
                            Explore Bihar and connect with service providers through Evigo.
                        </p>

                        <div className="mt-8 flex flex-col gap-3 min-[460px]:flex-row">
                            <Link
                                href="/events"
                                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-violet-700 px-6 text-sm font-bold text-white shadow-lg shadow-violet-200/80 transition duration-300 hover:-translate-y-1 hover:bg-violet-800 hover:shadow-xl hover:shadow-violet-200"
                            >
                                Explore Events <span className="ml-2">→</span>
                            </Link>

                            <Link
                                href="/travel-tourism"
                                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-200 bg-white/90 px-6 text-sm font-bold text-slate-800 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-violet-300 hover:text-violet-700 hover:shadow-lg"
                            >
                                Explore Travel &amp; Tourism <span className="ml-2">→</span>
                            </Link>
                        </div>

                        {/* Trust indicators */}
                        <div className="mt-8 flex flex-wrap gap-x-5 gap-y-3 text-xs font-semibold text-slate-600 sm:text-sm">
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
                    <div className="relative mx-auto w-full max-w-[760px] pb-10 sm:pb-12 lg:justify-self-end">
                        <div
                            aria-hidden="true"
                            className="absolute -inset-6 rounded-[44px] bg-gradient-to-br from-violet-200/65 via-indigo-100/45 to-cyan-100/75 blur-2xl"
                        />

                        <div className="relative grid grid-cols-2 items-start gap-3 sm:gap-4 lg:gap-5">
                            {HERO_IMAGES.map((image, index) => (
                                <div
                                    key={image.src}
                                    className={`group relative aspect-[1.12/1] min-w-0 overflow-hidden rounded-[1.35rem] bg-slate-100 shadow-[0_18px_45px_rgba(31,41,55,0.14)] ring-1 ring-white/80 transition duration-500 hover:-translate-y-1 hover:shadow-[0_24px_55px_rgba(31,41,55,0.2)] ${index === 1
                                        ? "mt-7 sm:mt-9"
                                        : index === 2
                                            ? "-mt-7 sm:-mt-9"
                                            : ""
                                        }`}
                                >
                                    <TourismImage
                                        src={image.src}
                                        alt={image.alt}
                                        sizes="(max-width: 640px) 46vw, (max-width: 1024px) 42vw, 360px"
                                        className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                                    />
                                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/20 via-transparent to-white/5" />
                                </div>
                            ))}
                        </div>

                        {/* Floating destination label */}
                        <div className="absolute -bottom-1 right-1 flex max-w-[calc(100%-1rem)] items-center gap-3 rounded-2xl border border-white/90 bg-white/95 px-4 py-3 shadow-[0_16px_40px_rgba(31,41,55,0.16)] backdrop-blur sm:bottom-0 sm:right-2 sm:px-5">
                            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-100 text-xl">
                                ⌖
                            </span>
                            <span className="min-w-0">
                                <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                                    Explore Bihar
                                </span>
                                <span className="block whitespace-nowrap text-xs font-extrabold text-slate-800 sm:text-sm">
                                    Heritage • Culture • Nature
                                </span>
                            </span>
                        </div>
                    </div>
                </div>
            </section>

            {/* QUICK SERVICE NAVIGATION */}
            <section className="relative z-10 bg-white py-12 sm:py-16">
                <Container>
                    <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-violet-700">
                                Explore Evigo
                            </p>
                            <h2 className="mt-2 text-2xl font-black tracking-tight text-[#17233d] sm:text-3xl">
                                What are you looking for?
                            </h2>
                            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500 sm:text-base">
                                Find trusted local services and experiences across Bihar.
                            </p>
                        </div>
                        <Link
                            href="/explore"
                            className="inline-flex w-fit items-center gap-2 text-sm font-bold text-violet-700 transition hover:text-violet-900"
                        >
                            Explore all services <span aria-hidden="true">→</span>
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        {QUICK_SERVICES.map((service) => (
                            <Link
                                key={service.title}
                                href={service.href}
                                className="group relative flex min-h-[142px] items-center gap-5 overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white via-white to-slate-50 p-5 shadow-[0_8px_26px_rgba(30,41,59,0.055)] transition-all duration-300 hover:-translate-y-1 hover:border-violet-200 hover:shadow-[0_18px_42px_rgba(91,33,182,0.13)] sm:p-6"
                            >
                                <span className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl ring-1 ring-black/[0.03] ${service.color} transition-transform duration-300 group-hover:scale-110`}>
                                    <QuickServiceIcon name={service.icon} />
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="block text-base font-extrabold text-slate-900 transition group-hover:text-violet-700 sm:text-lg">
                                        {service.title}
                                    </span>
                                    <span className="mt-1 block text-sm leading-5 text-slate-500">
                                        {service.subtitle}
                                    </span>
                                    <span className="mt-3 inline-flex items-center gap-2 text-xs font-bold text-violet-700">
                                        Explore <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span>
                                    </span>
                                </span>
                            </Link>
                        ))}
                    </div>
                </Container>
            </section>

            {/* EVENTS IN BIHAR */}
            <section
                className="relative overflow-hidden bg-[radial-gradient(ellipse_at_top_left,_#fff7f2_0%,_#faf7ff_48%,_#f3f8ff_100%)] py-16 sm:py-20"
                aria-labelledby="events-heading"
            >
                <div aria-hidden="true" className="pointer-events-none absolute -left-32 top-24 h-72 w-72 rounded-full bg-orange-100/50 blur-3xl" />
                <div aria-hidden="true" className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-violet-200/40 blur-3xl" />

                <Container>
                    <div className="relative mb-9 grid items-end gap-6 lg:grid-cols-[1fr_0.8fr]">
                        <div className="relative z-10">
                            <span className="inline-flex items-center gap-2 rounded-full border border-violet-100 bg-white/85 px-4 py-2 text-xs font-extrabold text-violet-800 shadow-sm">
                                <span className="grid h-5 w-5 place-items-center rounded-md bg-violet-100 text-violet-700">
                                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="3" y="5" width="18" height="16" rx="2" />
                                        <path d="M7 3v4M17 3v4M3 10h18M8 14h3m-3 3h3m3-3h2" />
                                    </svg>
                                </span>
                                Events &amp; Services
                            </span>

                            <h2
                                id="events-heading"
                                className="mt-4 text-3xl font-black leading-tight tracking-[-0.035em] text-[#17233d] sm:text-4xl lg:text-[2.75rem]"
                            >
                                Events &amp; Services <span className="bg-gradient-to-r from-violet-700 to-fuchsia-600 bg-clip-text text-transparent">in Bihar</span>
                            </h2>
                            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base sm:leading-7">
                                Find trusted services and professional partners for weddings, events, and special occasions across Bihar.
                            </p>
                        </div>

                        {/* Subtle Bihar-inspired architectural line art */}
                        <div className="pointer-events-none absolute right-0 top-0 hidden h-36 w-[48%] items-end justify-end opacity-[0.28] lg:flex" aria-hidden="true">
                            <svg viewBox="0 0 620 150" className="h-full w-full text-violet-700" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M15 130H605M45 122h530M90 122V82h65v40M100 82V65h45v17M110 65V51h25v14M117 51V38h11v13M190 122V94h52v28M198 94V80h36v14M207 80V68h18v12M260 122V75h95v47M272 75V61h71v14M286 61V49h43v12M297 49V35h21v14M305 35V18h5v17M375 122V90h54v32M383 90V77h38v13M445 122V70h48v52M453 70V57h32v13M461 57V43h16v14M467 43V29h5v14" />
                                <path d="M75 122V99l15-10 15 10v23M160 122V104l15-12 15 12v18M355 122V101l12-9 12 9v21M500 122V99l14-11 14 11v23" />
                                <path d="M25 110q18-20 36 0M535 105q16-24 32 0M555 42q8-10 16 0m-8-8v16M570 58q7-8 14 0" />
                                <path d="M35 133q18-6 36 0t36 0 36 0 36 0 36 0 36 0 36 0 36 0 36 0 36 0 36 0 36 0 36 0 36 0 36 0 36 0 36 0" />
                            </svg>
                        </div>
                    </div>

                    <div className="relative grid gap-4 sm:grid-cols-2 xl:grid-cols-3 xl:gap-5">
                        {SERVICE_CATEGORIES.map((category) => {
                            const details = EVENT_CATEGORY_DETAILS[category];
                            const categoryName = String(category);
                            const href =
                                categoryName === "Restaurant"
                                    ? "/hotels"
                                    : categoryName === "Transport"
                                        ? "/travel-tourism/faabcab"
                                        : `/explore?category=${encodeURIComponent(categoryName)}`;

                            const theme = {
                                Catering: {
                                    panel: "from-[#fff5ed] to-[#fff0e7]",
                                    icon: "bg-amber-500 text-white shadow-amber-200",
                                    button: "border-amber-200 bg-amber-100/80 text-amber-900 hover:bg-amber-200",
                                    glow: "bg-orange-200/50",
                                },
                                Photography: {
                                    panel: "from-[#f6f0ff] to-[#f1eaff]",
                                    icon: "bg-violet-500 text-white shadow-violet-200",
                                    button: "border-violet-200 bg-violet-100/80 text-violet-900 hover:bg-violet-200",
                                    glow: "bg-violet-200/60",
                                },
                                DJ: {
                                    panel: "from-[#eef6ff] to-[#e8f2ff]",
                                    icon: "bg-sky-500 text-white shadow-sky-200",
                                    button: "border-sky-200 bg-sky-100/80 text-sky-900 hover:bg-sky-200",
                                    glow: "bg-sky-200/60",
                                },
                                "Mehendi & Makeup": {
                                    panel: "from-[#fff0f8] to-[#ffeaf5]",
                                    icon: "bg-pink-500 text-white shadow-pink-200",
                                    button: "border-pink-200 bg-pink-100/80 text-pink-900 hover:bg-pink-200",
                                    glow: "bg-pink-200/60",
                                },
                                Restaurant: {
                                    panel: "from-[#eefaf5] to-[#e7f6ef]",
                                    icon: "bg-emerald-600 text-white shadow-emerald-200",
                                    button: "border-emerald-200 bg-emerald-100/80 text-emerald-900 hover:bg-emerald-200",
                                    glow: "bg-emerald-200/60",
                                },
                                Transport: {
                                    panel: "from-[#fff7eb] to-[#fff0dc]",
                                    icon: "bg-orange-500 text-white shadow-orange-200",
                                    button: "border-orange-200 bg-orange-100/80 text-orange-900 hover:bg-orange-200",
                                    glow: "bg-orange-200/60",
                                },
                            }[categoryName] ?? {
                                panel: "from-[#f6f3ff] to-[#eff5ff]",
                                icon: "bg-violet-600 text-white shadow-violet-200",
                                button: "border-violet-200 bg-violet-100 text-violet-900 hover:bg-violet-200",
                                glow: "bg-violet-200/50",
                            };

                            return (
                                <Link
                                    key={category}
                                    href={href}
                                    className={`group relative isolate flex min-h-[238px] overflow-hidden rounded-[1.65rem] border border-white/90 bg-gradient-to-br ${theme.panel} shadow-[0_10px_30px_rgba(35,30,70,0.07)] ring-1 ring-slate-200/50 transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_22px_45px_rgba(35,30,70,0.14)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500`}
                                >
                                    <div className="relative z-10 flex w-[59%] flex-col items-start p-5 sm:p-5">
                                        <span className={`grid h-11 w-11 place-items-center rounded-2xl shadow-lg ${theme.icon}`}>
                                            <EventServiceIcon category={categoryName} />
                                        </span>

                                        <h3 className="mt-3 text-lg font-black leading-tight tracking-tight text-[#17233d] sm:text-xl">
                                            {categoryName === "DJ" ? "DJ & Live Entertainment" : categoryName === "Restaurant" ? "Hotels & Venues" : categoryName}
                                        </h3>

                                        <p className="mt-1 text-sm font-semibold text-slate-700">
                                            {details.title}
                                        </p>

                                        <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-600 sm:text-sm">
                                            {CATEGORY_TAGLINE[category]}
                                        </p>

                                        <span className={`mt-auto inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-extrabold transition duration-300 group-hover:gap-3 ${theme.button}`}>
                                            Explore options <span aria-hidden="true">→</span>
                                        </span>
                                    </div>

                                    <div className="absolute inset-y-0 right-0 w-[45%] overflow-hidden">
                                        <div className={`absolute -left-10 top-1/2 z-10 h-[125%] w-20 -translate-y-1/2 rounded-full ${theme.glow} blur-xl`} />
                                        <Image
                                            src={CATEGORY_IMAGE[category]}
                                            alt={`${categoryName} services in Bihar`}
                                            fill
                                            sizes="(max-width: 640px) 42vw, (max-width: 1280px) 24vw, 180px"
                                            className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-110"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-r from-black/5 via-transparent to-black/10" />
                                    </div>
                                </Link>
                            );
                        })}
                    </div>

                    <div className="mt-9 flex justify-center">
                        <Link
                            href="/events"
                            className="inline-flex min-h-12 items-center justify-center gap-3 rounded-full bg-gradient-to-r from-violet-700 to-violet-600 px-8 text-sm font-extrabold text-white shadow-lg shadow-violet-200/80 transition duration-300 hover:-translate-y-1 hover:from-violet-800 hover:to-violet-700 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
                        >
                            View All Services <span aria-hidden="true">→</span>
                        </Link>
                    </div>
                </Container>
            </section>

            {/* DISCOVER BIHAR */}
            <section
                className="relative isolate overflow-hidden bg-gradient-to-br from-[#fbf9ff] via-white to-[#f2f7ff] py-16 sm:py-20"
                aria-labelledby="travel-heading"
            >
                <div aria-hidden="true" className="pointer-events-none absolute -left-32 top-20 h-80 w-80 rounded-full bg-violet-200/35 blur-3xl" />
                <div aria-hidden="true" className="pointer-events-none absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-fuchsia-100/50 blur-3xl" />

                <Container>
                    <div className="relative mb-9 overflow-hidden rounded-[2rem] px-1 py-2 sm:mb-10">
                        <div className="relative z-10 max-w-3xl">
                            <span className="inline-flex items-center gap-2 rounded-full border border-violet-100 bg-violet-100/80 px-4 py-2 text-xs font-extrabold text-violet-800 shadow-sm">
                                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                                    <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
                                    <circle cx="12" cy="10" r="2.5" />
                                </svg>
                                Explore Bihar
                            </span>
                            <h2 id="travel-heading" className="mt-4 text-4xl font-black tracking-[-0.045em] text-[#17233d] sm:text-5xl">
                                Discover <span className="relative inline-block bg-gradient-to-r from-violet-700 to-fuchsia-600 bg-clip-text text-transparent">
                                    Bihar
                                    <span className="absolute -bottom-1 left-0 h-1 w-full rounded-full bg-violet-300/80" />
                                </span>
                            </h2>
                            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base sm:leading-8">
                                Explore heritage sites, spiritual destinations, natural beauty and vibrant culture across Bihar.
                            </p>
                        </div>

                        {/* Bihar-inspired architectural line art */}
                        <div className="pointer-events-none absolute -right-2 bottom-0 hidden h-40 w-[52%] items-end justify-end opacity-35 lg:flex" aria-hidden="true">
                            <svg viewBox="0 0 620 170" className="h-full w-full text-violet-600" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 145H608M42 137h535M78 137V98h62v39M88 98V79h42v19M98 79V62h22v17M105 62V44h8v18M164 137V111h48v26M172 111V94h32v17M180 94V79h16v15M248 137V91h92v46M260 91V75h68v16M275 75V58h38v17M289 58V39h10v19M370 137V106h54v31M378 106V88h38v18M444 137V83h52v54M453 83V66h34v17M463 66V48h14v18" />
                                <path d="M64 137V111l18-14 18 14v26M216 137V113l16-12 16 12v24M344 137V111l15-12 15 12v26M510 137V108l17-13 17 13v29" />
                                <path d="M130 34q9-12 18 0m-9-8v16M520 43q9-12 18 0m-9-8v16M552 72q8-9 16 0m-8-6v12" />
                                <path d="M20 151q20-6 40 0t40 0 40 0 40 0 40 0 40 0 40 0 40 0 40 0 40 0 40 0 40 0 40 0 40 0 40 0" />
                            </svg>
                        </div>
                    </div>

                    {(() => {
                        const featured = destinations.find((item) => item.district === "Gaya") ?? destinations[0];
                        const others = destinations.filter((item) => item.district !== featured?.district);

                        if (!featured) return null;

                        return (
                            <div className="grid gap-4 lg:grid-cols-[1.08fr_1.32fr]">
                                {/* Featured destination */}
                                <Link
                                    href={`/services/tourism?district=${encodeURIComponent(featured.district)}`}
                                    className="group relative isolate min-h-[430px] overflow-hidden rounded-[1.8rem] bg-slate-900 shadow-[0_22px_55px_rgba(64,40,110,0.18)] ring-1 ring-white/80 sm:min-h-[500px] lg:min-h-[510px]"
                                >
                                    <TourismImage
                                        src={featured.destination!.img}
                                        alt={featured.destination!.alt}
                                        attribution={featured.destination!.imageAttribution}
                                        sizes="(max-width: 1024px) 100vw, 48vw"
                                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#090d1d]/95 via-[#090d1d]/25 to-transparent" />
                                    <span className="absolute left-5 top-5 inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/95 px-4 py-2 text-xs font-extrabold text-violet-800 shadow-lg backdrop-blur">
                                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                            <path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z" />
                                        </svg>
                                        Featured Destination
                                    </span>
                                    <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
                                        <span className="text-xs font-bold uppercase tracking-[0.16em] text-violet-200">
                                            {featured.category}
                                        </span>
                                        <h3 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">
                                            {featured.name}
                                        </h3>
                                        <p className="mt-3 max-w-md text-sm leading-6 text-white/85 sm:text-base">
                                            Discover the heritage, stories and memorable places that make this destination special.
                                        </p>
                                        <span className="mt-5 inline-flex min-h-11 items-center gap-3 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 text-sm font-extrabold text-white shadow-lg shadow-violet-950/25 transition group-hover:gap-4">
                                            Explore {featured.name} <span aria-hidden="true">→</span>
                                        </span>
                                    </div>
                                    {featured.destination!.imageAttribution && (
                                        <TourismPhotoCredit
                                            attribution={featured.destination!.imageAttribution}
                                            className="absolute bottom-2 right-3 max-w-[55%] truncate text-[9px] text-white/75"
                                        />
                                    )}
                                </Link>

                                {/* Supporting destinations */}
                                <div className="grid grid-cols-2 gap-3 sm:grid-cols-6 sm:gap-4">
                                    {others.map(({ district, name, category, destination }, index) => (
                                        <Link
                                            key={district}
                                            href={`/services/tourism?district=${encodeURIComponent(district)}`}
                                            className={`group overflow-hidden rounded-[1.45rem] border border-white bg-white/90 shadow-[0_12px_30px_rgba(64,40,110,0.10)] ring-1 ring-violet-100/80 transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_38px_rgba(64,40,110,0.16)] ${index < 3 ? "sm:col-span-2" : "sm:col-span-3"}`}
                                        >
                                            <div className="relative aspect-[1.65/1] overflow-hidden bg-slate-100">
                                                <TourismImage
                                                    src={destination!.img}
                                                    alt={destination!.alt}
                                                    attribution={destination!.imageAttribution}
                                                    sizes="(max-width: 640px) 48vw, (max-width: 1024px) 30vw, 22vw"
                                                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/35 to-transparent" />
                                            </div>
                                            <div className="flex items-center justify-between gap-2 p-3 sm:px-4 sm:py-3.5">
                                                <div className="min-w-0">
                                                    <span className="block truncate text-[10px] font-bold uppercase tracking-wide text-violet-700 sm:text-[11px]">
                                                        {category}
                                                    </span>
                                                    <h3 className="mt-1 truncate text-base font-black text-[#17233d] sm:text-lg">
                                                        {name}
                                                    </h3>
                                                </div>
                                                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-violet-100 text-lg font-bold text-violet-700 transition group-hover:bg-violet-700 group-hover:text-white">
                                                    →
                                                </span>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        );
                    })()}

                    <div className="mt-8 flex flex-col items-stretch gap-5 rounded-[1.6rem] border border-violet-100 bg-white/70 p-4 shadow-[0_12px_35px_rgba(64,40,110,0.06)] backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:p-5">
                        <div className="grid flex-1 grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-3">
                            {[
                                { icon: "⌂", title: "Spiritual Sites", detail: "Famous religious destinations" },
                                { icon: "▤", title: "Rich Heritage", detail: "Ancient history & monuments" },
                                { icon: "⌁", title: "Natural Beauty", detail: "Hills, forests & serene spots" },
                                { icon: "✿", title: "Vibrant Culture", detail: "Art, crafts & local traditions" },
                            ].map((item) => (
                                <div key={item.title} className="flex min-w-0 items-center gap-3">
                                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-100 text-xl font-bold text-violet-700" aria-hidden="true">
                                        {item.icon}
                                    </span>
                                    <span className="min-w-0">
                                        <span className="block text-sm font-extrabold text-[#17233d]">{item.title}</span>
                                        <span className="mt-0.5 block text-[11px] leading-4 text-slate-500">{item.detail}</span>
                                    </span>
                                </div>
                            ))}
                        </div>
                        <Link
                            href="/travel-tourism"
                            className="inline-flex min-h-12 shrink-0 items-center justify-center gap-3 rounded-full bg-gradient-to-r from-violet-700 to-fuchsia-600 px-7 text-sm font-extrabold text-white shadow-lg shadow-violet-200 transition hover:-translate-y-0.5 hover:shadow-xl"
                        >
                            View All Destinations <span aria-hidden="true">→</span>
                        </Link>
                    </div>
                </Container>
            </section>

            {/* PREMIUM TRAVEL PACK + FAABCAB */}
            <section
                className="relative isolate overflow-hidden bg-[radial-gradient(ellipse_at_top_left,_#fff7f0_0%,_#faf6ff_48%,_#f4f2ff_100%)] py-16 sm:py-20"
                aria-labelledby="curated-travel-heading"
            >
                <div aria-hidden="true" className="pointer-events-none absolute -left-28 top-20 h-80 w-80 rounded-full bg-orange-200/30 blur-3xl" />
                <div aria-hidden="true" className="pointer-events-none absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-violet-300/35 blur-3xl" />

                <Container>
                    {/* Section heading */}
                    <div className="relative mb-10 text-center sm:mb-12">
                        <span className="inline-flex items-center gap-2 rounded-full border border-violet-100 bg-white/85 px-4 py-2 text-xs font-extrabold text-[#34205f] shadow-sm backdrop-blur">
                            <span className="grid h-6 w-6 place-items-center rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-500 text-white">
                                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                    <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
                                    <circle cx="12" cy="10" r="2.5" />
                                </svg>
                            </span>
                            Explore · Travel · Experience Bihar
                        </span>
                        <h2 id="curated-travel-heading" className="mt-4 text-3xl font-black tracking-[-0.045em] text-[#17233d] sm:text-4xl lg:text-5xl">
                            Curated Travel Experiences in{" "}
                            <span className="bg-gradient-to-r from-violet-700 via-fuchsia-600 to-violet-600 bg-clip-text text-transparent">
                                Bihar
                            </span>
                        </h2>
                        <p className="mx-auto mt-3 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base sm:leading-7">
                            Handpicked travel packs and reliable transport to make your Bihar journey easy, comfortable, and memorable.
                        </p>
                        <div className="mx-auto mt-5 h-1 w-28 rounded-full bg-gradient-to-r from-violet-600 via-fuchsia-500 to-orange-400" />

                        {/* Subtle Bihar-inspired line art */}
                        <div aria-hidden="true" className="pointer-events-none absolute -left-2 top-0 hidden h-28 w-48 opacity-25 lg:block">
                            <svg viewBox="0 0 190 110" className="h-full w-full text-orange-500" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M8 91h174M35 91V56h38v35M42 56V43h24v13M49 43V29h10v14M82 91V65h38v26M89 65V52h24v13M97 52V39h8v13M128 91V48h27v43M134 48V34h15v14" />
                                <path d="M20 91V72l9-8 9 8v19M158 91V70l10-8 10 8v21M18 99q16-5 32 0t32 0 32 0 32 0 32 0" />
                            </svg>
                        </div>
                        <div aria-hidden="true" className="pointer-events-none absolute -right-2 top-0 hidden h-28 w-48 scale-x-[-1] opacity-25 lg:block">
                            <svg viewBox="0 0 190 110" className="h-full w-full text-violet-600" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M8 91h174M35 91V56h38v35M42 56V43h24v13M49 43V29h10v14M82 91V65h38v26M89 65V52h24v13M97 52V39h8v13M128 91V48h27v43M134 48V34h15v14" />
                                <path d="M20 91V72l9-8 9 8v19M158 91V70l10-8 10 8v21M18 99q16-5 32 0t32 0 32 0 32 0 32 0" />
                            </svg>
                        </div>
                    </div>

                    <div className="grid items-stretch gap-5 xl:grid-cols-[1.02fr_1fr] xl:gap-6">
                        {/* Travel Pack Combo */}
                        <article className="group overflow-hidden rounded-[2rem] border border-orange-100/90 bg-[#fff8f0] shadow-[0_18px_50px_rgba(124,75,36,0.12)] ring-1 ring-white/80 transition duration-300 hover:-translate-y-1 hover:shadow-[0_25px_60px_rgba(124,75,36,0.17)]">
                            <div className="grid h-full sm:grid-cols-[0.92fr_1.08fr]">
                                <div className="grid min-h-[300px] grid-cols-2 grid-rows-2 gap-1.5 bg-orange-100/80 p-1.5 sm:min-h-[420px]">
                                    {TRAVEL_PACK_IMAGES.map((image, index) => (
                                        <div
                                            key={image.src}
                                            className={`relative min-h-0 overflow-hidden rounded-[1.15rem] ${index === 0 ? "row-span-2" : ""}`}
                                        >
                                            <TourismImage
                                                src={image.src}
                                                alt={image.alt}
                                                attribution={image.attribution}
                                                sizes="(max-width: 640px) 48vw, (max-width: 1280px) 22vw, 250px"
                                                className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                                            />
                                            {image.attribution && (
                                                <TourismPhotoCredit
                                                    attribution={image.attribution}
                                                    className="absolute bottom-1 left-1 z-10 max-w-[calc(100%-0.5rem)] truncate rounded bg-black/70 px-1.5 py-0.5 text-[8px] leading-3 text-white"
                                                />
                                            )}
                                        </div>
                                    ))}
                                </div>

                                <div className="relative flex flex-col justify-center p-6 sm:p-7 lg:p-8">
                                    <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full bg-orange-200/35 blur-2xl" />
                                    <div className="relative">
                                        <span className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-100 to-orange-200/70 px-3.5 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-orange-800">
                                            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                                <path d="M5 7h14v14H5zM9 7V4h6v3M5 11h14M12 11v10" />
                                            </svg>
                                            Bihar · Curated Journey
                                        </span>
                                        <h3 className="mt-4 text-3xl font-black leading-[1.05] tracking-[-0.04em] text-[#17233d] sm:text-[2.35rem]">
                                            Travel Pack
                                            <span className="block">Combo</span>
                                        </h3>
                                        <div className="mt-3 h-1 w-24 rounded-full bg-gradient-to-r from-orange-400 to-amber-300" />
                                        <p className="mt-4 max-w-md text-sm leading-6 text-slate-600">
                                            Explore travel and service combinations for your Bihar journey. Contact the team to discuss your requirements.
                                        </p>

                                        <ul className="mt-5 space-y-3 text-sm font-bold text-[#263653]">
                                            {[
                                                "Explore travel options",
                                                "Discover local destinations",
                                                "Ask about available services",
                                            ].map((benefit) => (
                                                <li key={benefit} className="flex items-center gap-3">
                                                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-orange-200 text-xs font-black text-orange-800">
                                                        ✓
                                                    </span>
                                                    {benefit}
                                                </li>
                                            ))}
                                        </ul>

                                        <Link
                                            href="/combo-packs"
                                            className="mt-6 inline-flex min-h-12 w-fit items-center justify-center gap-3 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 px-6 text-sm font-extrabold text-white shadow-lg shadow-orange-200/70 transition duration-300 hover:-translate-y-0.5 hover:from-orange-600 hover:to-red-600 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
                                        >
                                            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                                <path d="M5 7h14v14H5zM9 7V4h6v3M5 11h14M12 11v10" />
                                            </svg>
                                            Explore Travel Packs <span aria-hidden="true">→</span>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </article>

                        {/* FaabCab transport feature */}
                        <article className="group relative isolate min-h-[430px] overflow-hidden rounded-[2rem] bg-[#21134d] text-white shadow-[0_20px_55px_rgba(50,25,100,0.22)] ring-1 ring-white/70 transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_65px_rgba(50,25,100,0.28)]">
                            <Image
                                src="/faabcab-vehicle.jpg"
                                alt="FaabCab transport vehicle"
                                fill
                                priority={false}
                                sizes="(max-width: 1280px) 100vw, 50vw"
                                className="object-cover object-center transition-transform duration-700 group-hover:scale-[1.035]"
                            />
                            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(31,17,72,0.98)_0%,rgba(39,22,83,0.94)_42%,rgba(39,22,83,0.58)_67%,rgba(20,18,45,0.10)_100%)]" />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#1d1245]/45 via-transparent to-white/5" />

                            <div className="relative z-10 flex min-h-[430px] max-w-[590px] flex-col justify-center p-6 sm:p-8 lg:p-9">
                                <span className="inline-flex w-fit items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-orange-300 sm:text-xs">
                                    <span className="grid h-8 w-8 place-items-center rounded-full bg-white/10 text-violet-200 ring-1 ring-white/15">
                                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                            <path d="M5 16l1.5-6 2-4h7l2 4 1.5 6M4 16h16v3H4zM7 19v2m10-2v2M7 13h10" />
                                            <circle cx="7.5" cy="16" r="1" fill="currentColor" />
                                            <circle cx="16.5" cy="16" r="1" fill="currentColor" />
                                        </svg>
                                    </span>
                                    Transport Partner
                                </span>

                                <h3 className="mt-4 text-4xl font-black tracking-[-0.045em] sm:text-5xl">
                                    FaabCab
                                </h3>
                                <div className="mt-3 h-1 w-28 rounded-full bg-gradient-to-r from-orange-300 via-fuchsia-400 to-violet-400" />
                                <p className="mt-4 max-w-md text-sm leading-6 text-white/85 sm:text-base sm:leading-7">
                                    Explore transport options for your journeys across Bihar. Submit an enquiry to discuss your route and requirements.
                                </p>

                                <ul className="mt-5 grid max-w-[440px] grid-cols-2 gap-2 text-xs font-bold text-white/95 sm:text-sm">
                                    {[
                                        { label: "Inter-city travel", icon: "↗" },
                                        { label: "Airport travel enquiries", icon: "✈" },
                                        { label: "Railway pickup enquiries", icon: "▤" },
                                        { label: "Local travel enquiries", icon: "⌖" },
                                    ].map((service) => (
                                        <li key={service.label} className="flex min-h-[54px] items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.09] px-3 py-2.5 shadow-sm backdrop-blur-sm transition group-hover:bg-white/[0.13]">
                                            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-violet-400/20 text-base text-fuchsia-200">
                                                {service.icon}
                                            </span>
                                            <span className="leading-4">{service.label}</span>
                                        </li>
                                    ))}
                                </ul>

                                <Link
                                    href="/travel-tourism/faabcab"
                                    className="mt-6 inline-flex min-h-12 w-fit items-center justify-center gap-3 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 text-sm font-extrabold text-white shadow-lg shadow-violet-950/30 transition duration-300 hover:-translate-y-0.5 hover:from-violet-500 hover:to-fuchsia-500 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#21134d]"
                                >
                                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                        <path d="M5 16l1.5-6 2-4h7l2 4 1.5 6M4 16h16v3H4zM7 19v2m10-2v2" />
                                        <circle cx="7.5" cy="16" r="1" fill="currentColor" />
                                        <circle cx="16.5" cy="16" r="1" fill="currentColor" />
                                    </svg>
                                    Explore FaabCab <span aria-hidden="true">→</span>
                                </Link>
                            </div>
                        </article>
                    </div>

                    {/* Premium benefits strip */}
                    <div className="mt-7 overflow-hidden rounded-[1.7rem] border border-violet-100/90 bg-white/65 shadow-[0_14px_38px_rgba(91,55,150,0.08)] backdrop-blur-xl">
                        <div className="grid grid-cols-1 divide-y divide-violet-100 sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x lg:divide-y-0">
                            {TRUST_BENEFITS.map((benefit, index) => (
                                <div key={benefit.title} className="flex min-h-[104px] items-center gap-3.5 px-5 py-5 sm:px-6">
                                    <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-gradient-to-br from-violet-100 to-fuchsia-100 text-violet-700 ring-1 ring-violet-100">
                                        {index === 0 && (
                                            <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                                <path d="m12 3 8 3v5c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6l8-3Z" />
                                                <path d="m9 12 2 2 4-4" />
                                            </svg>
                                        )}
                                        {index === 1 && (
                                            <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                                <path d="M16 11a4 4 0 1 0-8 0M3 20c.5-3.5 3.2-5.5 7-5.5h4c3.8 0 6.5 2 7 5.5" />
                                                <path d="m16 7 2 2 4-4" />
                                            </svg>
                                        )}
                                        {index === 2 && (
                                            <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                                <rect x="3" y="5" width="18" height="16" rx="2" />
                                                <path d="M7 3v4m10-4v4M3 10h18M8 14h3m-3 3h3m3-3h2" />
                                            </svg>
                                        )}
                                        {index === 3 && (
                                            <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                                <path d="M4 13v-2a8 8 0 0 1 16 0v2M4 13h3v6H5a2 2 0 0 1-2-2v-2a2 2 0 0 1 1-2Zm16 0h-3v6h2a2 2 0 0 0 2-2v-2a2 2 0 0 0-1-2ZM17 19c-.8 1.3-2.3 2-5 2" />
                                            </svg>
                                        )}
                                    </span>
                                    <span className="min-w-0">
                                        <span className="block text-sm font-black text-[#17233d] sm:text-base">
                                            {benefit.title}
                                        </span>
                                        <span className="mt-1 block text-xs leading-5 text-slate-600 sm:text-sm">
                                            {benefit.description}
                                        </span>
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </Container>
            </section>

        </main>
    );
}
