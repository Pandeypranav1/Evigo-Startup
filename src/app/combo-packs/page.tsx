
"use client";

import { Container } from "@/components/Container";
import { TourismImage } from "@/components/TourismImage";
import { TOURISM_IMAGE_ASSETS } from "@/lib/constants";

const packageTypes = [
  {
    icon: "⌂",
    title: "Stay Packages",
    description: "Comfortable stays for your Bihar journey.",
    color: "from-violet-100 to-purple-50",
    iconColor: "text-violet-700",
  },
  {
    icon: "✧",
    title: "Travel Combos",
    description: "Explore destinations with ease.",
    color: "from-blue-100 to-cyan-50",
    iconColor: "text-blue-700",
  },
  {
    icon: "▦",
    title: "Event Combos",
    description: "Make every special occasion memorable.",
    color: "from-orange-100 to-amber-50",
    iconColor: "text-orange-700",
  },
  {
    icon: "◇",
    title: "Tour Packages",
    description: "Discover the culture and heritage of Bihar.",
    color: "from-pink-100 to-rose-50",
    iconColor: "text-pink-700",
  },
];

export default function ComboPacksPage() {
  const heritageImage = TOURISM_IMAGE_ASSETS["mahabodhi-temple"];

  return (
    <main className="min-h-screen overflow-hidden bg-[#faf8ff] text-[#17233d]">
      {/* Coming Soon Hero */}
      <section className="relative isolate overflow-hidden bg-gradient-to-br from-[#f0eaff] via-[#fffaff] to-[#fff0e8]">
        {/* Background decorations */}
        <div className="pointer-events-none absolute -left-40 top-10 h-96 w-96 rounded-full bg-violet-300/30 blur-[100px]" />
        <div className="pointer-events-none absolute -right-32 top-20 h-96 w-96 rounded-full bg-orange-200/40 blur-[100px]" />

        <Container>
          <div className="relative grid min-h-[680px] items-center gap-12 py-16 lg:grid-cols-2 lg:gap-10 lg:py-20">
            {/* Left content */}
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 rounded-full border border-violet-200/80 bg-white/80 px-4 py-2 shadow-sm backdrop-blur">
                <span className="text-lg text-violet-700">▱</span>
                <span className="text-xs font-extrabold uppercase tracking-wider text-violet-900">
                  Evigo Combo Packs
                </span>
              </div>

              <h1 className="mt-7 max-w-2xl text-5xl font-black leading-[1.08] tracking-tight text-[#17233d] sm:text-6xl lg:text-[68px]">
                Combo Packages
                <span className="mt-1 block bg-gradient-to-r from-violet-700 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Coming Soon
                </span>
              </h1>

              <p className="mt-7 max-w-xl text-base leading-8 text-slate-600 sm:text-lg">
                We&apos;re bringing together travel, stays, events and
                unforgettable local experiences into thoughtfully curated
                packages across Bihar.
              </p>

              {/* Package categories */}
              <div className="mt-8 grid max-w-[590px] grid-cols-2 gap-3 sm:grid-cols-4">
                {packageTypes.map((item) => (
                  <div
                    key={item.title}
                    className={`rounded-2xl border border-white/90 bg-gradient-to-br ${item.color} p-4 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-md`}
                  >
                    <div
                      className={`text-3xl font-bold ${item.iconColor}`}
                    >
                      {item.icon}
                    </div>
                    <h2 className="mt-3 text-sm font-extrabold text-slate-900">
                      {item.title}
                    </h2>
                    <p className="mt-1 text-[11px] leading-5 text-slate-600">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>

              {/* Partner onboarding message */}
              <div className="mt-8 flex max-w-[590px] items-center gap-4 rounded-2xl border border-violet-100 bg-white/80 p-4 shadow-[0_12px_35px_rgba(109,40,217,0.08)] backdrop-blur-sm sm:p-5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-100 to-violet-100 text-2xl text-violet-800">
                  ♢
                </div>
                <div>
                  <p className="text-sm font-extrabold text-violet-950 sm:text-base">
                    Something exciting is on its way!
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-600 sm:text-sm">
                    We&apos;re onboarding partners across Bihar to bring you
                    quality experiences and great value.
                  </p>
                </div>
              </div>
            </div>

            {/* Right visual */}
            <div className="relative mx-auto w-full max-w-[570px]">
              {/* Decorative glow */}
              <div className="absolute inset-8 rounded-full bg-violet-300/40 blur-[80px]" />

              {/* Main image */}
              <div className="relative mx-auto max-w-[510px]">
                <div className="absolute -inset-3 rotate-[-3deg] rounded-[36px] bg-gradient-to-br from-violet-300/70 via-white to-orange-200/70 blur-[1px]" />

                <div className="relative overflow-hidden rounded-[30px] border-[7px] border-white shadow-[0_30px_80px_rgba(76,29,149,0.2)]">
                  <div className="relative aspect-[4/3]">
                    <TourismImage
                      src={heritageImage.src}
                      alt={heritageImage.alt}
                      attribution={heritageImage.attribution}
                      loading="eager"
                      sizes="(max-width: 1024px) 100vw, 45vw"
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#10172c]/80 via-transparent to-transparent" />

                    <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-7">
                      <span className="inline-flex rounded-full border border-white/30 bg-white/15 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white backdrop-blur-md">
                        Discover Bihar
                      </span>
                      <h2 className="mt-3 text-2xl font-black text-white sm:text-3xl">
                        Your next journey
                        <br />
                        starts here.
                      </h2>
                      <p className="mt-2 text-xs text-white/80 sm:text-sm">
                        Explore more. Experience more.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Floating destination card */}
                <div className="absolute -left-5 top-[25%] hidden rounded-2xl border border-white/80 bg-white/95 p-3 shadow-xl backdrop-blur-md sm:block">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-xl">
                      🏛️
                    </span>
                    <div>
                      <p className="text-xs font-extrabold text-slate-900">
                        Heritage Trails
                      </p>
                      <p className="text-[10px] text-slate-500">
                        Explore Bihar
                      </p>
                    </div>
                  </div>
                </div>

                {/* Floating launch card */}
                <div className="absolute -bottom-6 -right-3 rounded-2xl border border-white/80 bg-white/95 px-5 py-4 shadow-xl backdrop-blur-md sm:-right-7">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 text-xl text-violet-700">
                      ✦
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-violet-600">
                        Launching Soon
                      </p>
                      <p className="text-sm font-extrabold text-slate-900">
                        Made for Bihar
                      </p>
                    </div>
                  </div>
                </div>

                {/* Decorative orbit */}
                <div className="pointer-events-none absolute -right-8 -top-8 hidden h-24 w-24 rounded-full border border-dashed border-violet-400/70 sm:block" />
                <span className="absolute -right-5 top-0 text-3xl text-violet-500">
                  ✦
                </span>
              </div>
            </div>
          </div>
        </Container>

        {/* Bihar-inspired decorative footer silhouette */}
        <div className="pointer-events-none relative h-24 overflow-hidden sm:h-32">
          <svg
            viewBox="0 0 1440 130"
            preserveAspectRatio="none"
            className="absolute bottom-0 h-full w-full"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M0 75 Q100 35 200 75 T400 75 T600 75 T800 75 T1000 75 T1200 75 T1440 65 V130 H0 Z"
              fill="#d9c3ff"
              opacity=".45"
            />
            <path
              d="M0 96 Q120 65 240 96 T480 96 T720 96 T960 96 T1200 96 T1440 86 V130 H0 Z"
              fill="#a78bfa"
              opacity=".45"
            />
            <path
              d="M0 115 Q180 90 360 115 T720 115 T1080 115 T1440 105 V130 H0 Z"
              fill="#7c3aed"
              opacity=".65"
            />
          </svg>
        </div>
      </section>

      {/* Simple launch information */}
      <section className="bg-white py-14 sm:py-16">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <span className="text-xs font-extrabold uppercase tracking-[0.22em] text-violet-600">
              The Evigo Experience
            </span>
            <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
              One platform. More ways to explore Bihar.
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-500 sm:text-base">
              Our combo packages are being prepared. Soon, you&apos;ll be able
              to discover convenient combinations of travel, accommodation,
              tourism and event experiences in one place.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <span className="rounded-full border border-violet-100 bg-violet-50 px-4 py-2 text-xs font-bold text-violet-800">
                Travel & Tourism
              </span>
              <span className="rounded-full border border-orange-100 bg-orange-50 px-4 py-2 text-xs font-bold text-orange-800">
                Hotels & Stays
              </span>
              <span className="rounded-full border border-pink-100 bg-pink-50 px-4 py-2 text-xs font-bold text-pink-800">
                Events & Services
              </span>
              <span className="rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-xs font-bold text-blue-800">
                Local Experiences
              </span>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
