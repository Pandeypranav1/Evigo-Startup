
import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/Container";
import {
    CATEGORY_IMAGE,
    CATEGORY_TAGLINE,
    SERVICE_CATEGORIES,
} from "@/lib/constants";

const CATEGORY_ICON: Record<string, string> = {
    Catering: "✦",
    Photography: "◎",
    DJ: "♫",
    "Mehendi & Makeup": "✿",
    Restaurant: "♨",
};

export const metadata = {
    title: "Events & Services | Evigo",
    description:
        "Plan memorable events in Bihar with Evigo. Explore catering, photography, entertainment, makeup and venue services.",
};

export default function EventsPage() {
    return (
        <main className="flex-1 overflow-hidden bg-[#fcfaff] text-[#17213d]">

            {/* HERO SECTION */}
            <section className="relative overflow-hidden bg-gradient-to-br from-[#f4edff] via-[#fffaff] to-[#fff1ed]">
                <div className="pointer-events-none absolute -left-32 top-16 h-80 w-80 rounded-full bg-violet-300/20 blur-3xl" />
                <div className="pointer-events-none absolute right-0 top-0 h-96 w-96 rounded-full bg-fuchsia-200/30 blur-3xl" />

                <Container className="relative grid items-center gap-12 py-14 sm:py-20 lg:min-h-[470px] lg:grid-cols-[0.95fr_1.05fr] lg:gap-10 lg:py-16">

                    {/* Hero Content */}
                    <div className="relative z-10">
                        <span className="inline-flex items-center gap-2 rounded-full border border-violet-100 bg-white/80 px-4 py-2 text-xs font-extrabold tracking-wide text-violet-800 shadow-sm">
                            <span className="h-2 w-2 rounded-full bg-violet-500" />
                            EVIGO EVENTS &amp; SERVICES
                        </span>

                        <h1 className="mt-6 max-w-2xl text-4xl font-black leading-[1.08] tracking-tight text-[#151d37] sm:text-5xl lg:text-[3.65rem]">
                            Plan Memorable
                            <span className="block bg-gradient-to-r from-violet-700 via-purple-600 to-fuchsia-600 bg-clip-text text-transparent">
                                Events &amp; Experiences
                            </span>
                            in Bihar
                        </h1>

                        <p className="mt-5 max-w-xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
                            Discover trusted event services, professional vendors,
                            and beautiful venues — all in one place.
                        </p>

                        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                            <Link
                                href="#services"
                                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-gradient-to-r from-violet-700 to-fuchsia-600 px-6 text-sm font-bold text-white shadow-lg shadow-violet-200 transition hover:-translate-y-1 hover:shadow-xl"
                            >
                                Explore Services <span className="ml-2">→</span>
                            </Link>

                            <Link
                                href="/explore"
                                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-violet-100 bg-white/90 px-6 text-sm font-bold text-violet-800 shadow-sm transition hover:-translate-y-1 hover:border-violet-300"
                            >
                                <span className="mr-2">▶</span>
                                Explore Providers
                            </Link>
                        </div>

                        {/* Trust Indicators */}
                        <div className="mt-8 flex flex-wrap gap-3">
                            {[
                                ["✓", "Verified Providers"],
                                ["✦", "Easy Booking"],
                                ["◎", "Dedicated Support"],
                            ].map(([icon, label]) => (
                                <div
                                    key={label}
                                    className="inline-flex items-center gap-2 rounded-full border border-white bg-white/65 px-3 py-2 text-xs font-bold text-slate-700 shadow-sm"
                                >
                                    <span className="text-base font-black text-violet-600">
                                        {icon}
                                    </span>
                                    {label}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Hero Image Collage */}
                    <div className="relative mx-auto w-full max-w-[620px]">
                        <div className="absolute -inset-5 rounded-[40px] bg-gradient-to-br from-violet-300/30 to-orange-200/30 blur-2xl" />

                        <div className="relative grid grid-cols-[1.25fr_0.75fr] gap-3 sm:gap-4">
                            <div className="relative min-h-[260px] overflow-hidden rounded-[28px] border-4 border-white shadow-xl sm:min-h-[330px]">
                                <Image
                                    src={CATEGORY_IMAGE["Photography"]}
                                    alt="Professional event photography in Bihar"
                                    fill
                                    priority
                                    sizes="(max-width: 768px) 65vw, 40vw"
                                    className="object-cover transition duration-700 hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" />
                                <div className="absolute bottom-5 left-5 text-white">
                                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/80">
                                        Celebrate beautifully
                                    </p>
                                    <p className="mt-1 text-xl font-black sm:text-2xl">
                                        Moments that matter
                                    </p>
                                </div>
                            </div>

                            <div className="grid gap-3 sm:gap-4">
                                <div className="relative min-h-[125px] overflow-hidden rounded-[24px] border-4 border-white shadow-lg sm:min-h-[155px]">
                                    <Image
                                        src={CATEGORY_IMAGE["Catering"]}
                                        alt="Event catering and celebration arrangements"
                                        fill
                                        sizes="(max-width: 768px) 35vw, 22vw"
                                        className="object-cover transition duration-700 hover:scale-105"
                                    />
                                </div>

                                <div className="relative min-h-[125px] overflow-hidden rounded-[24px] border-4 border-white shadow-lg sm:min-h-[155px]">
                                    <Image
                                        src={CATEGORY_IMAGE["DJ"]}
                                        alt="DJ and live entertainment"
                                        fill
                                        sizes="(max-width: 768px) 35vw, 22vw"
                                        className="object-cover transition duration-700 hover:scale-105"
                                    />
                                </div>
                            </div>

                            <div className="absolute -bottom-5 right-3 flex items-center gap-3 rounded-2xl border border-white bg-white/95 px-4 py-3 shadow-xl sm:right-8">
                                <span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-100 text-xl text-violet-700">
                                    ✦
                                </span>
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-violet-600">
                                        Your celebration partner
                                    </p>
                                    <p className="text-sm font-black text-[#17213d]">
                                        Explore Bihar with Evigo
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </Container>
            </section>

            {/* SERVICES SECTION */}
            <section
                id="services"
                className="relative bg-white py-16 sm:py-20"
            >
                <Container>
                    <div className="mx-auto max-w-2xl text-center">
                        <span className="inline-flex items-center gap-2 rounded-full bg-violet-50 px-4 py-2 text-xs font-extrabold uppercase tracking-wider text-violet-700">
                            ✦ Our Services
                        </span>

                        <h2 className="mt-4 text-3xl font-black tracking-tight text-[#17213d] sm:text-4xl">
                            Event Services for{" "}
                            <span className="bg-gradient-to-r from-violet-700 to-fuchsia-600 bg-clip-text text-transparent">
                                Every Celebration
                            </span>
                        </h2>

                        <p className="mt-3 text-sm leading-6 text-slate-500 sm:text-base">
                            From catering to photography, find all the essential
                            services for your special events.
                        </p>
                    </div>

                    <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
                        {SERVICE_CATEGORIES.map((category, index) => (
                            <Link
                                key={category}
                                href={
                                    category === "Restaurant"
                                        ? "/hotels"
                                        : `/explore?category=${encodeURIComponent(category)}`
                                }
                                className="group overflow-hidden rounded-[22px] border border-violet-100/80 bg-white shadow-[0_8px_30px_rgba(69,36,115,0.06)] transition duration-300 hover:-translate-y-2 hover:border-violet-200 hover:shadow-[0_18px_40px_rgba(69,36,115,0.13)]"
                            >
                                <div className="relative aspect-[1.55/1] overflow-hidden bg-violet-50">
                                    <Image
                                        src={CATEGORY_IMAGE[category]}
                                        alt={`${category} services in Bihar`}
                                        fill
                                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 20vw"
                                        className="object-cover transition duration-700 group-hover:scale-110"
                                    />

                                    <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent opacity-70" />

                                    <span className="absolute -bottom-5 left-5 grid h-12 w-12 place-items-center rounded-2xl border-4 border-white bg-gradient-to-br from-violet-100 to-fuchsia-100 text-2xl font-bold text-violet-700 shadow-md">
                                        {CATEGORY_ICON[category] || "✦"}
                                    </span>
                                </div>

                                <div className="flex min-h-[175px] flex-col p-5 pt-8">
                                    <h3 className="text-lg font-black tracking-tight text-[#17213d] transition group-hover:text-violet-700">
                                        {category}
                                    </h3>

                                    <p className="mt-2 text-sm leading-6 text-slate-500">
                                        {CATEGORY_TAGLINE[category]}
                                    </p>

                                    <span className="mt-auto inline-flex items-center pt-5 text-sm font-extrabold text-violet-700">
                                        {category === "Restaurant"
                                            ? "Browse Restaurants"
                                            : `Explore ${category}`}
                                        <span className="ml-2 transition-transform group-hover:translate-x-1">
                                            →
                                        </span>
                                    </span>
                                </div>
                            </Link>
                        ))}
                    </div>

                    <div className="mt-9 text-center">
                        <Link
                            href="/explore"
                            className="inline-flex min-h-12 items-center justify-center rounded-full bg-gradient-to-r from-violet-700 to-fuchsia-600 px-8 text-sm font-bold text-white shadow-lg shadow-violet-200 transition hover:-translate-y-1 hover:shadow-xl"
                        >
                            View All Services <span className="ml-2">→</span>
                        </Link>
                    </div>
                </Container>
            </section>

            {/* HOTELS & VENUES SECTION */}
            <section
                id="venues"
                className="relative overflow-hidden bg-gradient-to-br from-[#f5efff] via-[#fffaff] to-[#fff2e9] py-12 sm:py-16"
            >
                <div className="pointer-events-none absolute -right-24 top-0 h-72 w-72 rounded-full bg-violet-200/30 blur-3xl" />

                <Container>
                    <div className="relative grid overflow-hidden rounded-[28px] border border-white bg-white/80 shadow-[0_16px_50px_rgba(69,36,115,0.09)] backdrop-blur-sm lg:grid-cols-[0.8fr_1.2fr]">

                        {/* Venue Image */}
                        <div className="relative min-h-[220px] sm:min-h-[270px]">
                            <Image
                                src={CATEGORY_IMAGE["Restaurant"]}
                                alt="Hotel and event venue dining space"
                                fill
                                sizes="(max-width: 1024px) 100vw, 40vw"
                                className="object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-black/10" />
                        </div>

                        {/* Venue Content */}
                        <div className="flex flex-col justify-center p-7 sm:p-10 lg:p-12">
                            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-violet-100 px-4 py-2 text-xs font-extrabold uppercase tracking-wider text-violet-800">
                                ✦ Hotels &amp; Venues
                            </span>

                            <h2 className="mt-5 text-2xl font-black leading-tight tracking-tight text-[#17213d] sm:text-3xl">
                                Find the Perfect Venue for Your Event
                            </h2>

                            <p className="mt-3 max-w-xl text-sm leading-7 text-slate-600 sm:text-base">
                                Browse approved and verified hotels, banquet halls,
                                and event venues across Bihar for weddings, parties,
                                corporate events and more.
                            </p>

                            <div className="mt-7">
                                <Link
                                    href="/hotels"
                                    className="inline-flex min-h-12 items-center justify-center rounded-xl bg-gradient-to-r from-violet-700 to-fuchsia-600 px-6 text-sm font-bold text-white shadow-lg shadow-violet-200 transition hover:-translate-y-1 hover:shadow-xl"
                                >
                                    View Hotels &amp; Venues
                                    <span className="ml-2">→</span>
                                </Link>
                            </div>
                        </div>
                    </div>
                </Container>
            </section>
        </main>
    );
}
