import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/Container";
import {
    CATEGORY_IMAGE,
    CATEGORY_TAGLINE,
    SERVICE_CATEGORIES,
} from "@/lib/constants";

const CATEGORY_ICON: Record<string, string> = {
    Catering: "🍽️",
    Photography: "📸",
    DJ: "🎧",
    "Mehendi & Makeup": "💄",
    Restaurant: "🏨",
};

export const metadata = {
    title: "Events & Services",
    description:
        "Plan your event with trusted services, venues and local partners across Bihar.",
};

export default function EventsPage() {
    return (
        <main className="flex-1 bg-white">
            <section className="border-b border-zinc-200 bg-[#f7f8f5] py-14 sm:py-20">
                <Container>
                    <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-800">
                        Evigo Events · Bihar
                    </p>
                    <h1 className="mt-3 max-w-3xl text-4xl font-black leading-tight text-zinc-950 sm:text-5xl">
                        Make room for a celebration worth remembering.
                    </h1>
                    <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-600">
                        Plan your event with trusted services, venues and local partners.
                        Explore providers and book directly through Evigo.
                    </p>
                </Container>
            </section>

            <section className="py-12 sm:py-16">
                <Container>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <p className="text-sm font-bold text-emerald-800">01 / SERVICES</p>
                            <h2 className="mt-2 text-2xl font-black text-zinc-950 sm:text-3xl">
                                Event services
                            </h2>
                        </div>
                        <Link
                            href="/explore"
                            className="text-sm font-bold text-emerald-800 hover:text-emerald-950"
                        >
                            Explore all providers <span aria-hidden="true">→</span>
                        </Link>
                    </div>

                    <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                        {SERVICE_CATEGORIES.map((category) => (
                            <Link
                                key={category}
                                href={
                                    category === "Restaurant"
                                        ? "/hotels"
                                        : `/explore?category=${encodeURIComponent(category)}`
                                }
                                className="group overflow-hidden rounded-lg border border-zinc-200 bg-white transition hover:-translate-y-1 hover:border-emerald-700/50 hover:shadow-lg"
                            >
                                <div className="relative aspect-[4/3] bg-zinc-100">
                                    <Image
                                        src={CATEGORY_IMAGE[category]}
                                        alt={category}
                                        fill
                                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 20vw"
                                        className="object-cover transition duration-500 group-hover:scale-105"
                                    />
                                    <span className="absolute left-3 top-3 grid h-10 w-10 place-items-center rounded-full bg-white text-xl shadow">
                                        {CATEGORY_ICON[category]}
                                    </span>
                                </div>
                                <div className="p-4">
                                    <h3 className="font-black text-zinc-950">{category}</h3>
                                    <p className="mt-1 min-h-10 text-sm leading-5 text-zinc-600">
                                        {CATEGORY_TAGLINE[category]}
                                    </p>
                                    <span className="mt-3 inline-flex text-sm font-bold text-emerald-800">
                                        {category === "Restaurant" ? "Browse hotels" : "Explore"}
                                        <span className="ml-1" aria-hidden="true">→</span>
                                    </span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </Container>
            </section>

            <section className="border-y border-zinc-200 bg-[#f7f8f5] py-12 sm:py-16">
                <Container>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <p className="text-sm font-bold text-emerald-800">02 / VENUES</p>
                            <h2 className="mt-2 text-2xl font-black text-zinc-950 sm:text-3xl">
                                Trusted hotels &amp; venues
                            </h2>
                            <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-600">
                                Browse currently approved, verified, bookable venue providers. Listings do not confirm date-specific availability.
                            </p>
                        </div>
                        <Link
                            href="/hotels"
                            className="text-sm font-bold text-emerald-800 hover:text-emerald-950"
                        >
                            View all hotels <span aria-hidden="true">→</span>
                        </Link>
                    </div>

                    <div className="mt-6 rounded-xl border border-zinc-200 bg-white p-6 sm:p-8">
                        <h3 className="text-xl font-black text-zinc-950">Browse current venue listings</h3>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600">
                            The directory shows provider records that are approved, verified, and accepting booking requests. Availability is confirmed by the provider after a request is submitted.
                        </p>
                        <Link
                            href="/hotels"
                            className="mt-5 inline-flex rounded-lg bg-emerald-800 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-900"
                        >
                            View hotels &amp; venues <span className="ml-2" aria-hidden="true">→</span>
                        </Link>
                    </div>
                </Container>
            </section>
        </main>
    );
}