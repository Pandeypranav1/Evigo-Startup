"use client";

import { ComboPack, COMBO_CATEGORY_METADATA } from "@/lib/combo";
import { ComboPackImage } from "@/components/ComboPackImage";

interface ComboPackCardProps {
  pack: ComboPack;
  onSelect: (pack: ComboPack) => void;
}

export function ComboPackCard({ pack, onSelect }: ComboPackCardProps) {
  const meta = COMBO_CATEGORY_METADATA[pack.category] || {
    label: pack.category,
    icon: "🎁",
    gradient: "from-violet-500 to-indigo-600",
  };

  return (
    <div className="group relative flex flex-col rounded-3xl border border-violet-100 bg-white p-5 shadow-[0_10px_30px_rgba(139,92,246,0.06)] transition-all duration-300 hover:-translate-y-1.5 hover:border-violet-300 hover:shadow-[0_20px_45px_rgba(139,92,246,0.14)]">
      {/* Image Banner */}
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl bg-slate-100">
        <ComboPackImage
          slug={pack.slug}
          name={pack.name}
          fallbackIcon={meta.icon}
          fallbackLabel={pack.category === "Custom Combo" ? "Photo depends on your itinerary" : undefined}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />

        {/* Gradient shadow overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

        {/* Top Badges */}
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/90 px-3 py-1 text-xs font-bold text-violet-900 shadow-sm backdrop-blur-md">
            <span>{meta.icon}</span>
            <span>{pack.category}</span>
          </span>
        </div>

        <div className="absolute bottom-3 right-3">
          <span className="inline-flex items-center gap-1 rounded-xl border border-white/20 bg-black/60 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-md">
            ⏱️ {pack.duration}
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div className="mt-4 flex flex-1 flex-col">
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-violet-600">
          <span>📍</span>
          <span>{pack.city}</span>
        </div>

        <h3 className="mt-1 text-lg sm:text-xl font-black text-slate-900 transition-colors group-hover:text-violet-700">
          {pack.name}
        </h3>

        <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-600">
          {pack.description}
        </p>

        {/* Included Services List */}
        <div className="mt-4">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Included in this Package:
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {pack.items && pack.items.length > 0 ? (
              pack.items.map((item, idx) => (
                <span
                  key={item.id || idx}
                  className="inline-flex items-center gap-1 rounded-lg border border-violet-100 bg-violet-50/70 px-2.5 py-1 text-[11px] font-semibold text-violet-900"
                >
                  <span className="text-violet-600 font-bold">✓</span>
                  <span>{item.service_type}</span>
                  {item.quantity > 1 && (
                    <span className="rounded bg-violet-200/70 px-1 text-[9px] font-bold text-violet-800">
                      x{item.quantity}
                    </span>
                  )}
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-500">Verified multi-service bundle</span>
            )}
          </div>
        </div>

        {/* Footer: Quote Info & Action */}
        <div className="mt-auto pt-5">
          <div className="flex items-center justify-between border-t border-slate-100 pt-4">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Package Pricing
              </div>
              <div className="text-xs font-bold text-violet-700 mt-0.5">
                Vendor Quote on Request
              </div>
            </div>

            <button
              onClick={() => onSelect(pack)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-violet-500/20 transition-all duration-200 hover:scale-[1.02] hover:shadow-violet-500/30 active:scale-95"
            >
              <span>Request Quote</span>
              <span>&rarr;</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
