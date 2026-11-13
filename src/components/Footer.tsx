
"use client";

import Link from "next/link";
import { PageContainer } from "@/components/PageContainer";

const QUICK_LINKS = [
  { label: "Home", href: "/" },
  { label: "Combo Packs", href: "/combo-packs" },
  { label: "Events", href: "/events" },
  { label: "Travel & Tourism", href: "/travel-tourism" },
  { label: "Hotels & Venues", href: "/hotels" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

const SERVICES = [
  "Catering",
  "Photography",
  "DJ",
  "Mehendi & Makeup",
  "Restaurant",
];

const TOURISM_LINKS = [
  { label: "Jamui Tourism", href: "/services/tourism" },
  { label: "Patna", href: "/services/tourism?district=Patna" },
  { label: "Gaya & Bodh Gaya", href: "/services/tourism?district=Gaya" },
  { label: "Rajgir", href: "/services/tourism?district=Rajgir" },
  { label: "Nalanda", href: "/services/tourism?district=Nalanda" },
  { label: "Vaishali", href: "/services/tourism?district=Vaishali" },
  { label: "Madhubani", href: "/services/tourism?district=Madhubani" },
  { label: "Sitamarhi", href: "/services/tourism?district=Sitamarhi" },
];

type IconName = "grid" | "pin" | "calendar" | "mail" | "phone" | "map" | "arrow" | "check";

function FooterIcon({
  name,
  className = "",
}: {
  name: IconName;
  className?: string;
}) {
  const common = {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
    className,
  };

  switch (name) {
    case "grid":
      return (
        <svg {...common}>
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </svg>
      );
    case "pin":
      return (
        <svg {...common}>
          <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z" />
          <circle cx="12" cy="10" r="2.5" />
        </svg>
      );
    case "calendar":
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M16 3v4M8 3v4M3 10h18M8 14h3" />
        </svg>
      );
    case "mail":
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="m3 7 9 6 9-6" />
        </svg>
      );
    case "phone":
      return (
        <svg {...common}>
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.8 19.8 0 0 1 11.2 19a19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.67A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.72 12.8 12.8 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.1 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.8 12.8 0 0 0 2.81.7A2 2 0 0 1 22 16.92Z" />
        </svg>
      );
    case "map":
      return (
        <svg {...common}>
          <path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Z" />
          <path d="M9 3v15M15 6v15" />
        </svg>
      );
    case "arrow":
      return (
        <svg {...common}>
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      );
    case "check":
      return (
        <svg {...common}>
          <path d="m5 12 4 4L19 6" />
        </svg>
      );
  }
}

function FooterHeading({
  icon,
  children,
}: {
  icon: IconName;
  children: React.ReactNode;
}) {
  return (
    <h3 className="mb-5 flex items-center gap-3 text-base font-extrabold text-[#25134b]">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#f3e5ff] to-[#fce7f3] text-[#8528cf]">
        <FooterIcon name={icon} />
      </span>
      {children}
    </h3>
  );
}

function FooterLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <li>
      <Link
        href={href}
        className="group flex items-center gap-2 py-1.5 text-sm text-[#655b79] transition-colors duration-200 hover:translate-x-1 hover:text-[#8128d5]"
      >
        <span className="text-[#a56ad5] transition-transform group-hover:translate-x-0.5">
          ›
        </span>
        {children}
      </Link>
    </li>
  );
}

export function Footer() {
  return (
    <footer className="relative w-full overflow-hidden bg-[#fffaf7]">
      {/* Soft background decoration */}
      <div className="pointer-events-none absolute -left-32 top-10 h-80 w-80 rounded-full bg-[#f1e5ff]/60 blur-[100px]" />
      <div className="pointer-events-none absolute -right-32 top-20 h-80 w-80 rounded-full bg-[#ffe9db]/70 blur-[100px]" />

      <PageContainer className="relative pb-0 pt-12 sm:pt-16">
        {/* Main footer panel */}
        <div className="relative overflow-hidden rounded-t-[30px] border border-[#eee2f6] bg-white/85 px-6 py-9 shadow-[0_12px_50px_rgba(82,43,125,0.07)] sm:px-9 sm:py-11 lg:px-10">
          <div className="relative z-10 grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.15fr_0.9fr_1fr_1.05fr_1.3fr] lg:gap-8">

            {/* Brand */}
            <div className="lg:border-r lg:border-[#eee4f5] lg:pr-7">
              <Link href="/" className="inline-flex items-center gap-2">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#9b35e8] to-[#5d37cf] text-xl font-black text-white shadow-lg shadow-purple-200">
                  E
                </span>
                <span className="text-3xl font-black tracking-tight text-[#28144c]">
                  Evigo
                </span>
              </Link>

              <p className="mt-5 max-w-xs text-sm leading-7 text-[#655b79]">
                Bihar&apos;s trusted event services marketplace. Connecting
                clients with verified providers for weddings, celebrations
                &amp; more.
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                {["Verified Partners", "Trusted Services", "Bihar Focused"].map(
                  (item) => (
                    <span
                      key={item}
                      className="inline-flex items-center gap-2 rounded-full border border-[#eee2f8] bg-[#faf5ff] px-3 py-2 text-xs font-bold text-[#6830a8]"
                    >
                      <FooterIcon name="check" className="h-3.5 w-3.5 text-emerald-600" />
                      {item}
                    </span>
                  )
                )}
              </div>
            </div>

            {/* Quick links */}
            <div>
              <FooterHeading icon="grid">Quick Links</FooterHeading>
              <ul className="space-y-1">
                {QUICK_LINKS.map((link) => (
                  <FooterLink key={link.label} href={link.href}>
                    {link.label}
                  </FooterLink>
                ))}
              </ul>
            </div>

            {/* Tourism */}
            <div>
              <FooterHeading icon="pin">Tourism</FooterHeading>
              <ul className="space-y-1">
                {TOURISM_LINKS.map((link) => (
                  <FooterLink key={link.label} href={link.href}>
                    {link.label}
                  </FooterLink>
                ))}
              </ul>
            </div>

            {/* Event services */}
            <div>
              <FooterHeading icon="calendar">Event Services</FooterHeading>
              <ul className="space-y-1">
                {SERVICES.map((service) => (
                  <FooterLink
                    key={service}
                    href={
                      service === "Restaurant"
                        ? "/hotels"
                        : `/explore?category=${encodeURIComponent(service)}`
                    }
                  >
                    {service}
                  </FooterLink>
                ))}
              </ul>
            </div>

            {/* Contact card */}
            <div className="rounded-[24px] border border-[#eadcf7] bg-gradient-to-br from-[#fbf6ff] via-white to-[#fff1e8] p-5 shadow-[0_10px_30px_rgba(111,54,157,0.08)] sm:col-span-2 lg:col-span-1">
              <h3 className="mb-5 text-xl font-black text-[#28144c]">
                Get in Touch
              </h3>

              <div className="space-y-4">
                <a
                  href="mailto:support.evigo@gmail.com"
                  className="flex items-center gap-3 text-sm text-[#514462] transition-colors hover:text-[#8128d5]"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#9638ce] shadow-sm">
                    <FooterIcon name="mail" />
                  </span>
                  <span className="min-w-0 break-all">
                    support.evigo@gmail.com
                  </span>
                </a>

                <a
                  href="tel:+917808807340"
                  className="flex items-center gap-3 text-sm text-[#514462] transition-colors hover:text-[#8128d5]"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#9638ce] shadow-sm">
                    <FooterIcon name="phone" />
                  </span>
                  7808807340
                </a>

                <div className="flex items-center gap-3 text-sm text-[#514462]">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#9638ce] shadow-sm">
                    <FooterIcon name="map" />
                  </span>
                  Samastipur, Bihar, India
                </div>
              </div>

              <Link
                href="/contact"
                className="mt-6 flex min-h-12 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#7626d6] via-[#a52bc4] to-[#f18a35] px-4 text-sm font-bold text-white shadow-lg shadow-purple-200 transition hover:-translate-y-0.5 hover:shadow-xl"
              >
                Contact Us Now
                <FooterIcon name="arrow" className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Decorative Bihar-inspired skyline */}
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-20 overflow-hidden opacity-[0.12]">
            <svg
              viewBox="0 0 1200 100"
              preserveAspectRatio="none"
              className="h-full w-full text-[#7936b7]"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M0 85H1200" />
              <path d="M80 85V55L105 35L130 55V85M95 85V62H115V85" />
              <path d="M160 85V45H220V85M175 45V30H205V45M185 30V15H195V30" />
              <path d="M260 85V60L290 35L320 60V85M275 85V65H305V85" />
              <path d="M400 85V42H465V85M420 42V25H445V42M432 25V8H438V25" />
              <path d="M520 85V60L550 38L580 60V85" />
              <path d="M700 85V50H760V85M715 50V30H745V50" />
              <path d="M820 85V58L850 30L880 58V85" />
              <path d="M950 85V40H1010V85M965 40V20H995V40M980 20V5H985V20" />
              <path d="M1080 85V58L1110 32L1140 58V85" />
              <path d="M0 94Q100 75 200 94T400 94T600 94T800 94T1000 94T1200 94" />
            </svg>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col items-center justify-between gap-4 border-t border-[#e9ddf1] py-6 text-center sm:flex-row sm:text-left">
          <p className="text-xs text-[#746b82] sm:text-sm">
            © {new Date().getFullYear()} Evigo. All rights reserved.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-5">
            <Link
              href="/privacy-policy"
              className="text-xs font-medium text-[#746b82] transition hover:text-[#8128d5] sm:text-sm"
            >
              Privacy Policy
            </Link>
            <span className="hidden h-4 w-px bg-[#ded1e9] sm:block" />
            <Link
              href="/terms-and-conditions"
              className="text-xs font-medium text-[#746b82] transition hover:text-[#8128d5] sm:text-sm"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </PageContainer>

      {/* Bottom gradient accent */}
      <div className="h-2 w-full bg-gradient-to-r from-[#7928d6] via-[#b23cc4] to-[#f18a35]" />
    </footer>
  );
}
