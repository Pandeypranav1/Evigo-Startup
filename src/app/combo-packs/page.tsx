"use client";

import { useEffect, useState, useMemo } from "react";
import { Container } from "@/components/Container";
import { TourismImage, TourismPhotoCredit } from "@/components/TourismImage";
import { ComboPack } from "@/lib/combo";
import { ComboPackCard } from "@/components/ComboPackCard";
import { ComboBookingModal } from "@/components/ComboBookingModal";
import { TOURISM_IMAGE_ASSETS } from "@/lib/constants";

// 7 approved categories matching the reference
const COMBO_PAGE_CATEGORIES = [
  { id: "All", label: "All Packages", icon: "🎁" },
  { id: "Stay Package", label: "Stay Package", icon: "🏨" },
  { id: "Trip Combo", label: "Trip Combo", icon: "🚗" },
  { id: "Event Combo", label: "Event Combo", icon: "🎪" },
  { id: "Airport/Railway + Stay", label: "Airport/Railway + Stay", icon: "🚊" },
  { id: "Tourism Package", label: "Tourism Package", icon: "🏛️" },
  { id: "Custom Combo", label: "Custom Combo", icon: "✨" },
];

export default function ComboPacksPage() {
  const [comboPacks, setComboPacks] = useState<ComboPack[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedPack, setSelectedPack] = useState<ComboPack | null>(null);

  const loadComboPacks = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/combo-packs");
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.comboPacks)) {
        setComboPacks(data.comboPacks);
      } else {
        throw new Error(data.error || "Failed to load combo packages");
      }
    } catch (err: any) {
      console.error("[ComboPacksPage] Error:", err);
      setError(err?.message || "Failed to fetch combo packages");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComboPacks();
  }, []);

  const filteredPacks = useMemo(() => {
    return comboPacks.filter((pack) => {
      // Category matching
      let matchCategory = true;
      if (selectedCategory === "All") {
        matchCategory = true;
      } else if (selectedCategory === "Stay Package") {
        matchCategory = pack.category === "Stay Package" || pack.category === "Travel + Stay";
      } else {
        matchCategory = pack.category === selectedCategory;
      }

      // Search matching
      const query = searchQuery.trim().toLowerCase();
      const matchSearch =
        !query ||
        pack.name.toLowerCase().includes(query) ||
        pack.description.toLowerCase().includes(query) ||
        pack.city.toLowerCase().includes(query);

      return matchCategory && matchSearch;
    });
  }, [comboPacks, selectedCategory, searchQuery]);

  // Featured 3 packs for top highlight
  const featuredPacks = useMemo(() => {
    const bodhGaya = comboPacks.find((p) => p.slug === "bodh-gaya-spiritual-tour");
    const nalanda = comboPacks.find((p) => p.slug === "nalanda-rajgir-heritage-combo");
    const wedding = comboPacks.find((p) => p.slug === "grand-wedding-reception-combo");

    const fallbackList = [bodhGaya, nalanda, wedding].filter(Boolean) as ComboPack[];
    if (fallbackList.length === 3) return fallbackList;
    return comboPacks.slice(0, 3);
  }, [comboPacks]);

  // Handle open custom combo modal
  const handleOpenCustomCombo = () => {
    const customTemplate = comboPacks.find((p) => p.category === "Custom Combo") || {
      id: "custom-combo-builder",
      name: "Custom Tailored Experience Combo",
      slug: "custom-tailored-experience",
      description: "Build a personalized Bihar package combining local transport, handpicked hotel rooms, event services, or guided tours tailored to your group.",
      category: "Custom Combo" as any,
      image_url: "",
      base_price: 0,
      discount: 0,
      final_price: 0,
      city: "Bihar (Custom Locations)",
      duration: "Flexible (1-7 Days)",
      is_active: true,
      items: [
        { id: "c1", combo_pack_id: "custom-builder", service_type: "Transport / Cab", quantity: 1, is_required: true },
        { id: "c2", combo_pack_id: "custom-builder", service_type: "Hotel / Resort Stay", quantity: 1, is_required: false },
        { id: "c3", combo_pack_id: "custom-builder", service_type: "Local Guide / Event Service", quantity: 1, is_required: false },
      ],
    };
    setSelectedPack(customTemplate);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f9f8ff] via-[#f4f0ff] to-white text-slate-800">
      {/* ─── Hero Section ────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-12 pb-16 md:pt-16 md:pb-24 border-b border-violet-100/80 bg-gradient-to-b from-violet-50/70 via-purple-50/40 to-white">
        {/* Soft background glow accents */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-violet-200/40 blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 -right-32 w-96 h-96 rounded-full bg-indigo-200/30 blur-3xl pointer-events-none" />

        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left Column: Heading, Trust Indicators, CTAs */}
            <div className="lg:col-span-7 space-y-6">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white/90 px-4 py-1.5 shadow-xs backdrop-blur-md">
                <span className="flex h-2 w-2 rounded-full bg-violet-600 animate-pulse" />
                <span className="text-xs font-black uppercase tracking-wider text-violet-900">
                  Combo Packs
                </span>
              </div>

              {/* Main Heading */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 leading-[1.1]">
                Curated Travel &amp; <br />
                <span className="bg-gradient-to-r from-violet-700 via-indigo-600 to-purple-700 bg-clip-text text-transparent">
                  Service Combo Packs
                </span>
              </h1>

              {/* Description */}
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl">
                All-in-one packages for travel, stay, events, and tourism across Bihar.
                Choose from ready-made plans or create a custom package for your needs.
              </p>

              {/* Trust Indicators */}
              <div className="flex flex-wrap items-center gap-y-2 gap-x-6 pt-1 text-xs font-bold text-slate-700">
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-xs font-black">
                    ✓
                  </span>
                  <span>Verified Partners</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-violet-100 text-violet-700 text-xs font-black">
                    ✓
                  </span>
                  <span>Flexible Options</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-xs font-black">
                    ✓
                  </span>
                  <span>Dedicated Support</span>
                </div>
              </div>

              {/* CTAs */}
              <div className="flex flex-wrap items-center gap-3 pt-3">
                <a
                  href="#packages"
                  className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-violet-500/25 transition-all hover:scale-105 hover:shadow-violet-500/35 active:scale-95"
                >
                  Explore Packages &darr;
                </a>
                <button
                  onClick={handleOpenCustomCombo}
                  className="inline-flex items-center justify-center rounded-xl border border-violet-200 bg-white px-6 py-3.5 text-sm font-bold text-violet-900 shadow-sm transition-all hover:bg-violet-50 hover:border-violet-300 active:scale-95"
                >
                  Create Custom Combo &rarr;
                </button>
              </div>
            </div>

            {/* Right Column: Bihar Heritage Photograph */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                {/* Decorative Frame */}
                <div className="relative aspect-[4/3] sm:aspect-[16/11] rounded-3xl overflow-hidden shadow-[0_25px_60px_rgba(139,92,246,0.18)] border-4 border-white bg-slate-100">
                  <TourismImage
                    src={TOURISM_IMAGE_ASSETS["mahabodhi-temple"].src}
                    alt={TOURISM_IMAGE_ASSETS["mahabodhi-temple"].alt}
                    attribution={TOURISM_IMAGE_ASSETS["mahabodhi-temple"].attribution}
                    loading="eager"
                    sizes="(max-width: 1024px) 100vw, 45vw"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent" />
                  <TourismPhotoCredit
                    attribution={TOURISM_IMAGE_ASSETS["mahabodhi-temple"].attribution}
                    className="absolute left-4 top-4 z-10 rounded bg-slate-900/65 px-2 py-1 text-[10px] leading-4 text-white/90"
                  />

                  {/* Overlay Badge */}
                  <div className="absolute bottom-4 left-4 right-4 rounded-2xl bg-white/95 backdrop-blur-md p-3.5 shadow-lg border border-violet-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-violet-900">
                          Bodh Gaya, Rajgir, Nalanda &amp; Jamui
                        </div>
                        <div className="text-[11px] font-semibold text-slate-500">
                          Curated travel bundles with verified hotels &amp; cabs
                        </div>
                      </div>
                      <span className="rounded-xl bg-violet-100 px-2.5 py-1 text-xs font-black text-violet-700">
                        100% Verified
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ─── Category Navigation Bar ───────────────────────────────── */}
      <section className="py-8 bg-white border-b border-slate-100 sticky top-20 z-30 shadow-xs">
        <Container>
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            {/* Category Cards / Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none flex-1">
              {COMBO_PAGE_CATEGORIES.map((cat) => {
                const isActive = selectedCategory === cat.id;
                const count =
                  cat.id === "All"
                    ? comboPacks.length
                    : cat.id === "Stay Package"
                    ? comboPacks.filter((p) => p.category === "Stay Package" || p.category === "Travel + Stay").length
                    : comboPacks.filter((p) => p.category === cat.id).length;

                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setSelectedCategory(cat.id);
                      if (cat.id === "Custom Combo") {
                        const el = document.getElementById("custom-combo");
                        if (el) el.scrollIntoView({ behavior: "smooth" });
                      }
                    }}
                    className={`shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all border ${
                      isActive
                        ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white border-transparent shadow-md shadow-violet-500/25 scale-[1.02]"
                        : "bg-slate-50 text-slate-700 border-slate-200/80 hover:bg-violet-50/60 hover:text-violet-900 hover:border-violet-200"
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.label}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                        isActive ? "bg-white/20 text-white" : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Search Box */}
            <div className="w-full md:w-72 shrink-0">
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
                  🔍
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search package, city, or service..."
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 pl-9 pr-8 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-violet-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-100"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-700"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ─── Featured & Filtered Packages ──────────────────────────── */}
      <section id="packages" className="py-12 md:py-16">
        <Container>
          {/* Section Header */}
          <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-violet-700">
                {selectedCategory === "All" ? "Featured & Ready-Made Combos" : selectedCategory}
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                {selectedCategory === "All"
                  ? "Explore Handcrafted Packages"
                  : `${selectedCategory} Collections`}
              </h2>
            </div>
            <div className="text-xs font-semibold text-slate-500">
              Showing {filteredPacks.length} verified {filteredPacks.length === 1 ? "package" : "packages"}
            </div>
          </div>

          {/* Loading Skeletons */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((idx) => (
                <div
                  key={idx}
                  className="rounded-3xl border border-violet-100 bg-white p-5 h-96 animate-pulse flex flex-col justify-between shadow-xs"
                >
                  <div className="aspect-[16/10] rounded-2xl bg-slate-100" />
                  <div className="space-y-3 mt-4">
                    <div className="h-4 w-3/4 rounded bg-slate-200" />
                    <div className="h-3 w-full rounded bg-slate-100" />
                    <div className="h-3 w-2/3 rounded bg-slate-100" />
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                    <div className="h-6 w-24 rounded bg-slate-200" />
                    <div className="h-9 w-28 rounded-2xl bg-slate-200" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            /* Error State */
            <div className="rounded-3xl border border-red-200 bg-red-50/50 p-10 text-center max-w-lg mx-auto">
              <div className="text-4xl mb-2">⚠️</div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">
                Unable to Load Packages
              </h3>
              <p className="text-xs text-slate-600 mb-5">{error}</p>
              <button
                onClick={loadComboPacks}
                className="rounded-xl bg-violet-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-violet-700 transition-colors"
              >
                Retry
              </button>
            </div>
          ) : filteredPacks.length > 0 ? (
            /* Package Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPacks.map((pack) => (
                <ComboPackCard
                  key={pack.id}
                  pack={pack}
                  onSelect={(p) => setSelectedPack(p)}
                />
              ))}
            </div>
          ) : (
            /* No Results State */
            <div className="text-center py-16 px-4 max-w-md mx-auto">
              <div className="text-5xl mb-4">🔍</div>
              <h3 className="text-xl font-black text-slate-900">
                No matching packages found
              </h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                We couldn&apos;t find any combo packs matching your search criteria. Try adjusting your filters or request a custom combo below.
              </p>
              <div className="mt-5 flex items-center justify-center gap-3">
                <button
                  onClick={() => {
                    setSelectedCategory("All");
                    setSearchQuery("");
                  }}
                  className="rounded-xl bg-violet-50 border border-violet-200 px-4 py-2 text-xs font-bold text-violet-800 hover:bg-violet-100 transition-colors"
                >
                  Reset All Filters
                </button>
                <button
                  onClick={handleOpenCustomCombo}
                  className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:brightness-105 transition-all"
                >
                  Create Custom Combo
                </button>
              </div>
            </div>
          )}
        </Container>
      </section>

      {/* ─── Build Your Own Combo Section ───────────────────────────── */}
      <section id="custom-combo" className="py-14 md:py-20 bg-gradient-to-b from-white via-violet-50/50 to-purple-50/40 border-t border-violet-100">
        <Container>
          <div className="relative rounded-3xl border border-violet-200/80 bg-white p-8 sm:p-12 lg:p-14 shadow-[0_20px_50px_rgba(139,92,246,0.08)] overflow-hidden">
            {/* Subtle corner blur */}
            <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-violet-100/50 blur-3xl pointer-events-none" />

            <div className="relative z-10 max-w-3xl mx-auto text-center space-y-4">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-100 px-3.5 py-1 text-xs font-black text-violet-800">
                <span>✨</span> Custom Experience
              </span>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900">
                Build Your Own Combo
              </h2>

              <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-xl mx-auto">
                Tailor your perfect Bihar experience by combining transport, stay, events, and tourism services suited to your exact schedule and group size.
              </p>
            </div>

            {/* 4 Feature Benefit Blocks */}
            <div className="relative z-10 mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded-2xl border border-violet-100 bg-violet-50/40 p-5 space-y-2">
                <div className="text-2xl">🗺️</div>
                <div className="text-sm font-bold text-slate-900">
                  Pick Destinations &amp; Dates
                </div>
                <div className="text-xs text-slate-500 leading-relaxed">
                  Choose your departure point, travel dates, and any destinations across Bihar.
                </div>
              </div>

              <div className="rounded-2xl border border-violet-100 bg-violet-50/40 p-5 space-y-2">
                <div className="text-2xl">🏨</div>
                <div className="text-sm font-bold text-slate-900">
                  Select Stays &amp; Transport
                </div>
                <div className="text-xs text-slate-500 leading-relaxed">
                  Pair verified partner hotel rooms with dedicated FaabCab local or outstation cabs.
                </div>
              </div>

              <div className="rounded-2xl border border-violet-100 bg-violet-50/40 p-5 space-y-2">
                <div className="text-2xl">🎉</div>
                <div className="text-sm font-bold text-slate-900">
                  Add Event &amp; Tour Services
                </div>
                <div className="text-xs text-slate-500 leading-relaxed">
                  Include catering, professional photography, banquet halls, or local guides.
                </div>
              </div>

              <div className="rounded-2xl border border-violet-100 bg-violet-50/40 p-5 space-y-2">
                <div className="text-2xl">⚡</div>
                <div className="text-sm font-bold text-slate-900">
                  Transparent Custom Quote
                </div>
                <div className="text-xs text-slate-500 leading-relaxed">
                  Receive a personalized quote directly from approved providers with zero markups.
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <div className="relative z-10 mt-10 text-center">
              <button
                onClick={handleOpenCustomCombo}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 px-8 py-4 text-sm font-bold text-white shadow-xl shadow-violet-500/25 transition-all hover:scale-105 hover:shadow-violet-500/35 active:scale-95"
              >
                <span>Create Custom Package</span>
                <span>&rarr;</span>
              </button>
            </div>
          </div>
        </Container>
      </section>

      {/* ─── Booking / Request Quote Modal ──────────────────────────── */}
      {selectedPack && (
        <ComboBookingModal
          pack={selectedPack}
          onClose={() => setSelectedPack(null)}
          onBookingSuccess={() => {
            loadComboPacks();
          }}
        />
      )}
    </div>
  );
}
