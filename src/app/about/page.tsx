"use client";

import { Container } from "@/components/Container";
import { ScrollReveal } from "@/components/ScrollReveal";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/Button";

const WHAT_WE_DO = [
  {
    number: "01",
    title: "Event Services",
    description: "Plan and book events with trusted professionals.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-7 w-7">
        <rect x="3.5" y="5" width="17" height="16" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
        <path d="M7.5 3v4M16.5 3v4M4 9.5h16M8 13h2m4 0h2M8 16.5h2m4 0h2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
    tone: "violet",
  },
  {
    number: "02",
    title: "Travel & Tourism",
    description: "Discover Bihar's heritage, culture, and destinations.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-7 w-7">
        <path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="12" cy="10" r="2.3" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    ),
    tone: "orange",
  },
  {
    number: "03",
    title: "Hotels & Venues",
    description: "Find suitable stays and venues for every occasion.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-7 w-7">
        <path d="M3 19V9.5A2.5 2.5 0 0 1 5.5 7h13A2.5 2.5 0 0 1 21 9.5V19M3 15h18M6 11h4v4H6zm8 0h4v4h-4zM5 19v2m14-2v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    tone: "violet",
  },
  {
    number: "04",
    title: "Local Empowerment",
    description: "Create more opportunities for local talent and women professionals.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-7 w-7">
        <path d="M16 20v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 18.5V20m6-8a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm6-6.5a3 3 0 0 1 0 5.8m4 8.7v-1.5a3.5 3.5 0 0 0-2.5-3.35" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
    tone: "pink",
  },
];

export default function AboutPage() {
  return (
    <main className="flex-1 overflow-hidden bg-[#fffdfb] text-[#17213b]">
      {/* HERO */}
      <section className="relative isolate">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-32 top-20 h-72 w-72 rounded-full bg-violet-100/70 blur-3xl"
        />
        <Container className="relative grid items-center gap-9 py-12 sm:py-16 lg:min-h-[470px] lg:grid-cols-[0.88fr_1.12fr] lg:gap-10 lg:py-14">
          <ScrollReveal animation="fade-right">
            <div className="max-w-xl">
              <span className="inline-flex items-center gap-2 rounded-full bg-violet-100 px-4 py-2 text-xs font-bold text-violet-800">
                <span className="h-2 w-2 rounded-full bg-orange-500" />
                About Evigo
              </span>

              <h1 className="mt-6 font-serif text-4xl font-bold leading-[1.08] tracking-tight text-[#17213b] sm:text-5xl xl:text-[3.65rem]">
                Connecting People,
                <br />
                Events and{" "}
                <span className="relative inline-block text-orange-500">
                  Bihar
                  <span className="absolute -bottom-1 left-0 h-[3px] w-full rounded-full bg-orange-400" />
                </span>
              </h1>

              <p className="mt-6 max-w-lg border-l-[3px] border-orange-400 pl-5 text-base leading-7 text-slate-600 sm:text-lg">
                Evigo is a digital platform that makes it easy to discover,
                book and manage events, travel and local services across Bihar
                — with trusted partners and a transparent process.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="#mission">
                  <Button className="bg-violet-700 text-white shadow-md shadow-violet-200 hover:bg-violet-800">
                    Our Mission <span className="ml-2" aria-hidden="true">→</span>
                  </Button>
                </Link>
                <Link href="/explore">
                  <Button className="border border-violet-300 bg-white text-violet-700 hover:bg-violet-50">
                    Explore Evigo <span className="ml-2" aria-hidden="true">↗</span>
                  </Button>
                </Link>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal animation="fade-left" delay={150}>
            <div className="relative mx-auto w-full max-w-2xl lg:ml-auto">
              <div
                aria-hidden="true"
                className="absolute -right-3 top-5 h-[88%] w-[94%] rounded-[2rem] bg-violet-200/80 sm:-right-5 sm:top-7"
              />
              <div className="relative h-[260px] overflow-hidden rounded-[1.8rem] border-[5px] border-white shadow-xl shadow-slate-200/80 sm:h-[340px] lg:h-[365px]">
                <Image
                  src="/evigo-hero.png"
                  alt="Ancient Nalanda archaeological ruins in Bihar"
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 55vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#101a31]/35 via-transparent to-transparent" />
                <div className="absolute bottom-5 left-5 rounded-full border border-white/40 bg-white/90 px-4 py-2 text-xs font-bold text-[#17213b] shadow-sm backdrop-blur">
                  The spirit of Bihar
                </div>
              </div>
            </div>
          </ScrollReveal>
        </Container>
      </section>

      {/* WHAT WE DO — horizontal highlights, not cards */}
      <section className="relative py-8 sm:py-10">
        <Container>
          <ScrollReveal animation="fade-up">
            <div className="mb-8 flex items-center justify-center gap-4">
              <span className="h-px w-12 bg-violet-300 sm:w-20" />
              <h2 className="font-serif text-3xl font-bold tracking-tight text-[#17213b] sm:text-4xl">
                What <span className="text-violet-700">We Do</span>
              </h2>
              <span className="h-px w-12 bg-violet-300 sm:w-20" />
            </div>
          </ScrollReveal>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-0">
            {WHAT_WE_DO.map((item, index) => (
              <ScrollReveal key={item.number} animation="fade-up" delay={index * 90}>
                <div
                  className={`flex h-full items-start gap-4 px-2 lg:px-5 ${index !== 0 ? "lg:border-l lg:border-violet-200" : ""
                    }`}
                >
                  <div
                    className={`grid h-14 w-14 shrink-0 place-items-center rounded-full ${item.tone === "orange"
                        ? "bg-orange-100 text-orange-600"
                        : item.tone === "pink"
                          ? "bg-pink-100 text-pink-600"
                          : "bg-violet-100 text-violet-700"
                      }`}
                  >
                    {item.icon}
                  </div>
                  <div className="pt-1">
                    <p className="text-[10px] font-bold tracking-[0.16em] text-slate-400">
                      {item.number}
                    </p>
                    <h3 className="mt-1 text-base font-extrabold text-[#17213b]">
                      {item.title}
                    </h3>
                    <p className="mt-1.5 text-sm leading-5 text-slate-600">
                      {item.description}
                    </p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </Container>
      </section>

      {/* MISSION BANNER */}
      <section id="mission" className="px-4 pb-12 pt-10 sm:px-6 sm:pb-16">
        <Container>
          <ScrollReveal animation="fade-up">
            <div className="relative isolate overflow-hidden rounded-[1.75rem] bg-gradient-to-r from-[#32135f] via-[#482078] to-[#612b88] px-6 py-9 text-white shadow-lg shadow-violet-200/70 sm:px-10 sm:py-11 lg:px-12">
              <div
                aria-hidden="true"
                className="absolute -right-16 -top-24 -z-10 h-64 w-64 rounded-full bg-fuchsia-400/15 blur-3xl"
              />
              <div
                aria-hidden="true"
                className="absolute -bottom-20 left-0 -z-10 h-48 w-72 rounded-full bg-orange-300/10 blur-3xl"
              />

              <div className="grid items-center gap-8 md:grid-cols-[0.95fr_1.05fr] md:gap-10">
                {/* Simple Bihar-inspired line illustration */}
                <div className="relative flex min-h-[150px] items-end justify-center border-b border-white/20 pb-2 md:min-h-[175px] md:border-b-0 md:border-r md:pb-0 md:pr-8">
                  <svg
                    viewBox="0 0 520 180"
                    role="img"
                    aria-label="Decorative illustration inspired by Bihar heritage"
                    className="h-auto w-full max-w-[470px] text-violet-200/80"
                    fill="none"
                  >
                    <path d="M12 151H505" stroke="currentColor" strokeWidth="1.5" opacity=".6" />
                    <path d="M35 150c18-20 34-20 52 0m-32-1v-22m-8 22v-14m16 14v-18m-25 18h34" stroke="currentColor" strokeWidth="1.5" opacity=".7" />
                    <path d="M135 150V88h12V66h9V45h8V27h8v18h8v21h9v22h12v62M128 88h80M139 66h62M151 45h39M160 27h23M163 12h17v15h-17z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                    <path d="M148 150v-38h56v38m-47-27h9m12 0h9m-30 14h9m12 0h9" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M270 150c18-42 46-42 64 0m-64 0h64m-49-19h34m-25-12h16" stroke="currentColor" strokeWidth="1.6" opacity=".8" />
                    <path d="M350 150c20-27 42-27 62 0m-62 0h62m-52-10h42m-31-10h20" stroke="currentColor" strokeWidth="1.6" opacity=".8" />
                    <path d="M420 150V95m0 0c-19-17-31-8-29 5 12 2 22 0 29-5Zm0 15c18-17 31-8 29 5-12 2-22 0-29-5Z" stroke="currentColor" strokeWidth="1.5" opacity=".65" />
                  </svg>
                </div>

                <div className="max-w-xl">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-200">
                    Our purpose
                  </p>
                  <h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
                    Our <span className="text-orange-400">Mission</span>
                  </h2>
                  <p className="mt-4 max-w-lg text-sm leading-6 text-violet-100 sm:text-base sm:leading-7">
                    To build a trusted, inclusive and technology-driven service
                    platform that creates more opportunities for people across
                    Bihar.
                  </p>
                  <Link
                    href="/partner"
                    className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-white transition hover:text-orange-300"
                  >
                    Be a part of Evigo <span aria-hidden="true">→</span>
                  </Link>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </Container>
      </section>
    </main>
  );
}
