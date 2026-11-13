"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { PageContainer } from "@/components/PageContainer";

function isActiveNavPath(pathname: string, href: string) {
  return (
    pathname === href ||
    (href === "/combo-packs" && pathname.startsWith("/combo-packs")) ||
    (href === "/events" && pathname.startsWith("/events")) ||
    (href === "/travel-tourism" &&
      (pathname.startsWith("/travel-tourism") ||
        pathname.startsWith("/services/tourism"))) ||
    (href === "/hotels" && pathname.startsWith("/hotels"))
  );
}

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const active = isActiveNavPath(pathname, href);

  return (
    <Link
      href={href}
      className={`relative whitespace-nowrap py-2 text-[13px] font-semibold transition-colors duration-200 ${active
        ? "text-[#ff8a00]"
        : "text-slate-200 hover:text-white"
        }`}
    >
      {children}
      <span
        className={`absolute bottom-0 left-0 h-0.5 rounded-full bg-[#ff8a00] transition-all ${active ? "w-full" : "w-0"
          }`}
      />
    </Link>
  );
}

function SearchBar() {
  return (
    <Link
      href="/explore"
      aria-label="Search destinations and services"
      className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/10 bg-white/5 text-slate-200 transition hover:border-cyan-300/50 hover:bg-white/10 hover:text-white"
    >
      <svg
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <circle cx="11" cy="11" r="7" strokeWidth="1.8" />
        <path strokeLinecap="round" strokeWidth="1.8" d="m16 16 4 4" />
      </svg>
    </Link>
  );
}

function AvatarDropdown({
  user,
  role,
  onSignOut,
}: {
  user: any;
  role: string | null;
  onSignOut: () => void;
}) {
  const [open, setOpen] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  const dashboardPath =
    role === "provider" ? "/provider/dashboard" : "/dashboard";

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (
        dropRef.current &&
        !dropRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const initial = user?.email
    ? user.email.charAt(0).toUpperCase()
    : "U";

  return (
    <div className="relative" ref={dropRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-label="Open profile menu"
        className="flex items-center gap-2 rounded-full border border-white/15 bg-white/10 py-1 pl-1 pr-3 transition hover:border-cyan-300/50 hover:bg-white/15"
      >
        {user?.profileImage ? (
          <img
            src={user.profileImage}
            alt="Profile"
            className="h-9 w-9 rounded-full object-cover"
          />
        ) : (
          <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-violet-600 to-cyan-500 text-sm font-bold text-white">
            {initial}
          </span>
        )}

        <span className="hidden max-w-[110px] truncate text-xs font-semibold text-white sm:block">
          {user?.email?.split("@")[0] || "My Account"}
        </span>

        <svg
          className={`h-4 w-4 text-slate-300 transition-transform ${open ? "rotate-180" : ""
            }`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
        >
          <path
            d="m7 10 5 5 5-5"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-[90] mt-3 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
          <div className="border-b border-slate-100 px-3 py-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
              {role === "provider" ? "Service Partner" : "Client Account"}
            </p>
            <p className="mt-1 truncate text-sm font-semibold text-slate-800">
              {user?.email}
            </p>
          </div>

          <Link
            href={`${dashboardPath}#profile`}
            onClick={() => setOpen(false)}
            className="block rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-700"
          >
            My Profile
          </Link>

          <Link
            href={`${dashboardPath}#bookings`}
            onClick={() => setOpen(false)}
            className="block rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-700"
          >
            My Bookings
          </Link>

          <Link
            href={dashboardPath}
            onClick={() => setOpen(false)}
            className="block rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-700"
          >
            Dashboard
          </Link>

          <button
            onClick={() => {
              setOpen(false);
              onSignOut();
            }}
            className="mt-1 w-full rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-red-600 hover:bg-red-50"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
}

export function Header() {
  const { user, role, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      setMenuOpen(false);
      router.push("/");
    } catch (error) {
      console.error("Unable to sign out", error);
      window.alert("Logout could not be completed. Please try again.");
    }
  };

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const mobileLinks = [
    { label: "Home", href: "/" },
    { label: "Explore Services", href: "/explore" },
    { label: "Combo Packs", href: "/combo-packs" },
    { label: "Events & Services", href: "/events" },
    { label: "Travel & Tourism", href: "/travel-tourism" },
    { label: "Hotels & Venues", href: "/hotels" },
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
  ];

  return (
    <>
      <header className="sticky top-0 z-[70] w-full border-b border-white/10 bg-[#192337] shadow-[0_4px_18px_rgba(8,15,30,0.18)]">
        <PageContainer className="flex min-h-[72px] items-center justify-between gap-4 py-2">
          {/* Evigo brand */}
          <Link
            href="/"
            className="group flex shrink-0 items-center gap-2"
            aria-label="Evigo Home"
          >
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500 text-xl font-black text-white shadow-md shadow-violet-900/30 transition-transform group-hover:scale-105">
              E
            </span>
            <span className="text-2xl font-black tracking-tight text-white">
              Evigo
            </span>
          </Link>

          {/* Desktop navigation */}
          <nav className="hidden min-w-0 flex-1 items-center justify-center gap-2 xl:flex 2xl:gap-4">
            <NavLink href="/">Home</NavLink>
            <NavLink href="/combo-packs">Combo Packs</NavLink>
            <NavLink href="/events">Events &amp; Services</NavLink>
            <NavLink href="/travel-tourism">
              Travel &amp; Tourism
            </NavLink>
            <NavLink href="/hotels">Hotels &amp; Venues</NavLink>
            <NavLink href="/about">About</NavLink>
            <NavLink href="/contact">Contact</NavLink>
          </nav>

          {/* Desktop actions */}
          <div className="hidden shrink-0 items-center gap-2 xl:flex 2xl:gap-3">
            <SearchBar />
            {!user ? (
              <>
                <Link
                  href="/login"
                  className="rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-bold text-white transition hover:border-white/30 hover:bg-white/15"
                >
                  Login
                </Link>
                <Link
                  href="/explore"
                  className="whitespace-nowrap rounded-xl bg-[#ff6b00] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#ed5e00] 2xl:px-5"
                >
                  Book a Service
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/explore"
                  className="whitespace-nowrap rounded-xl bg-[#ff6b00] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#ed5e00] 2xl:px-5"
                >
                  Book a Service
                </Link>
                <AvatarDropdown
                  user={user}
                  role={role}
                  onSignOut={handleSignOut}
                />
              </>
            )}
          </div>

          {/* Mobile search and menu */}
          <div className="ml-auto flex shrink-0 items-center gap-2 xl:hidden">
            <Link
              href="/explore"
              aria-label="Search services"
              className="grid h-10 w-10 place-items-center rounded-full text-slate-200 transition hover:bg-white/10 hover:text-white"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <circle cx="11" cy="11" r="7" strokeWidth="1.8" />
                <path
                  d="m16 16 4 4"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </Link>

            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle navigation menu"
              aria-expanded={menuOpen}
              aria-controls="evigo-mobile-menu"
              className="flex h-10 w-10 shrink-0 flex-col items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/10 text-white transition hover:bg-white/15"
            >
              <span
                className={`h-0.5 w-5 rounded-full bg-current transition ${menuOpen ? "translate-y-2 rotate-45" : ""}`}
              />
              <span
                className={`h-0.5 w-5 rounded-full bg-current transition ${menuOpen ? "opacity-0" : ""}`}
              />
              <span
                className={`h-0.5 w-5 rounded-full bg-current transition ${menuOpen ? "-translate-y-2 -rotate-45" : ""}`}
              />
            </button>
          </div>
        </PageContainer>
      </header>

      {/* Mobile overlay */}
      <div
        onClick={() => setMenuOpen(false)}
        className={`fixed inset-0 z-[75] bg-slate-900/40 backdrop-blur-sm transition-opacity xl:hidden ${menuOpen
          ? "pointer-events-auto opacity-100"
          : "pointer-events-none opacity-0"
          }`}
      />

      {/* Mobile navigation panel */}
      <aside
        id="evigo-mobile-menu"
        className={`fixed right-0 top-0 z-[80] flex h-dvh w-[min(360px,90vw)] flex-col border-l border-slate-200 bg-white shadow-2xl transition-transform duration-300 xl:hidden ${menuOpen ? "translate-x-0" : "translate-x-full"
          }`}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-5">
          <Link href="/" className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500 font-black text-white">
              E
            </span>
            <span className="text-xl font-black text-slate-900">
              Evigo
            </span>
          </Link>

          <button
            onClick={() => setMenuOpen(false)}
            aria-label="Close navigation"
            className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-xl text-slate-600 hover:bg-slate-200"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          {user && (
            <div className="mb-5 flex items-center gap-3 rounded-2xl border border-indigo-100 bg-indigo-50 p-3">
              {user.profileImage ? (
                <img
                  src={user.profileImage}
                  alt="Profile"
                  className="h-11 w-11 rounded-full object-cover"
                />
              ) : (
                <span className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-violet-600 to-cyan-500 font-bold text-white">
                  {user.email
                    ? user.email.charAt(0).toUpperCase()
                    : "U"}
                </span>
              )}
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                  {role === "provider" ? "Service Partner" : "Client"}
                </p>
                <p className="truncate text-sm font-semibold text-slate-800">
                  {user.email}
                </p>
              </div>
            </div>
          )}

          <nav className="space-y-1">
            {mobileLinks.map((item) => {
              const active = isActiveNavPath(pathname, item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center justify-between rounded-xl px-4 py-3.5 text-sm font-semibold transition ${active
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-700 hover:bg-slate-50"
                    }`}
                >
                  {item.label}
                  <span className="text-slate-400">→</span>
                </Link>
              );
            })}

            {user && (
              <>
                <Link
                  href={`${role === "provider"
                    ? "/provider/dashboard"
                    : "/dashboard"
                    }#profile`}
                  onClick={() => setMenuOpen(false)}
                  className="block rounded-xl px-4 py-3.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  My Profile
                </Link>

                <Link
                  href={`${role === "provider"
                    ? "/provider/dashboard"
                    : "/dashboard"
                    }#bookings`}
                  onClick={() => setMenuOpen(false)}
                  className="block rounded-xl px-4 py-3.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  My Bookings
                </Link>
              </>
            )}
          </nav>
        </div>

        <div className="space-y-3 border-t border-slate-100 p-5">
          <Link
            href="/explore"
            onClick={() => setMenuOpen(false)}
            className="flex w-full items-center justify-center rounded-xl bg-orange-500 px-5 py-3.5 text-sm font-bold text-white hover:bg-orange-600"
          >
            Book a Service
          </Link>

          {!user ? (
            <Link
              href="/login"
              onClick={() => setMenuOpen(false)}
              className="flex w-full items-center justify-center rounded-xl border border-slate-200 px-5 py-3.5 text-sm font-bold text-slate-800 hover:bg-slate-50"
            >
              Login
            </Link>
          ) : (
            <button
              onClick={handleSignOut}
              className="w-full rounded-xl border border-red-100 bg-red-50 px-5 py-3.5 text-sm font-bold text-red-600 hover:bg-red-100"
            >
              Sign Out
            </button>
          )}

          {!user && (
            <Link
              href="/partner"
              onClick={() => setMenuOpen(false)}
              className="flex w-full items-center justify-center rounded-xl bg-indigo-50 px-5 py-3.5 text-sm font-bold text-indigo-700 hover:bg-indigo-100"
            >
              Become a Partner
            </Link>
          )}
        </div>
      </aside>
    </>
  );
}