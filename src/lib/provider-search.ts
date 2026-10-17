import type { SupabaseClient } from "@supabase/supabase-js";

export type ProviderSearchFilters = {
  category?: string;
  city?: string;
  budget?: number;
  limit?: number;
};

export type ProviderListing = {
  id: string;
  registration_status: string;
  business_name: string | null;
  owner_name: string | null;
  category: string | null;
  city: string | null;
  phone: string | null;
  experience_years: number | null;
  service_areas: string[] | null;
  description: string | null;
  price_range: string | null;
  rating: number | null;
  image_url: string | null;
  is_verified: boolean;
  is_bookable: boolean;
};

const CATEGORY_ALIASES: Record<string, string[]> = {
  Catering: ["catering", "caterer", "caterers"],
  Photography: ["photography", "photographer", "photographers"],
  DJ: ["dj", "djs"],
  "Mehendi & Makeup": ["mehendi", "mehndi", "makeup", "make-up"],
  Restaurant: ["restaurant", "restaurants", "hotel", "hotels", "banquet"],
  Transport: ["transport", "cab", "cabs", "taxi", "taxis"],
};

function parseBudget(message: string): number | undefined {
  const budgetMatch = message.match(
    /(?:under|below|within|less than|budget(?:\s+of)?)\s*(?:₹|rs\.?\s*)?([\d,]+(?:\.\d+)?)\s*(k)?/i
  ) ?? message.match(/₹\s*([\d,]+(?:\.\d+)?)\s*(k)?/i);

  if (!budgetMatch) return undefined;
  const amount = Number(budgetMatch[1].replace(/,/g, ""));
  const budget = budgetMatch[2] ? amount * 1000 : amount;
  return Number.isFinite(budget) && budget >= 0 ? budget : undefined;
}

function getListedPrices(priceRange: string | null): number[] {
  if (!priceRange) return [];
  return [...priceRange.matchAll(/(\d[\d,]*(?:\.\d+)?)\s*(k)?/gi)]
    .map((match) => Number(match[1].replace(/,/g, "")) * (match[2] ? 1000 : 1))
    .filter((price) => Number.isFinite(price) && price >= 0);
}

function parseCity(message: string): string | undefined {
  const cityMatch = message.match(/\b(?:in|near|around)\s+([a-z][a-z\s-]{1,39})/i);
  if (!cityMatch) return undefined;

  const city = cityMatch[1]
    .split(/\b(?:for|under|below|within|budget|with|and)\b/i)[0]
    .trim()
    .replace(/\s+/g, " ");

  return city || undefined;
}

export function parseProviderSearchIntent(
  message: string,
  requestedFilters?: Partial<ProviderSearchFilters> | null
): ProviderSearchFilters | null {
  const query = message.toLowerCase();
  const supplied = requestedFilters ?? undefined;
  const category = supplied?.category?.trim() ||
    Object.entries(CATEGORY_ALIASES).find(([, aliases]) =>
      aliases.some((alias) => new RegExp(`\\b${alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(query))
    )?.[0];
  const explicitSearch = !!supplied &&
    (!!supplied.category || !!supplied.city || supplied.budget !== undefined);
  const searchRequested = explicitSearch ||
    /\b(provider|providers|vendor|vendors|book|booking|hire|find|search|looking for)\b/i.test(message) ||
    !!category;

  if (!searchRequested) return null;

  return {
    ...(category ? { category } : {}),
    ...(supplied?.city?.trim() || parseCity(message)
      ? { city: supplied?.city?.trim() || parseCity(message) }
      : {}),
    ...(typeof supplied?.budget === "number" && Number.isFinite(supplied.budget)
      ? { budget: supplied.budget }
      : parseBudget(message) !== undefined
        ? { budget: parseBudget(message) }
        : {}),
    limit: Math.min(Math.max(Math.trunc(supplied?.limit ?? 20), 1), 50),
  };
}

export function getProviderStartingPrice(priceRange: string | null): number | null {
  return getListedPrices(priceRange)[0] ?? null;
}

export function getProviderMaximumPrice(priceRange: string | null): number | null {
  const prices = getListedPrices(priceRange);
  return prices.length > 0 ? prices[prices.length - 1] : null;
}

export async function searchApprovedProviders(
  supabase: SupabaseClient,
  filters: ProviderSearchFilters = {}
): Promise<ProviderListing[]> {
  const limit = Math.min(Math.max(Math.trunc(filters.limit ?? 50), 1), 100);
  const buildQuery = () => {
    let query = supabase
      .from("providers")
      .select("id,registration_status,business_name,owner_name,category,city,phone,experience_years,service_areas,description,price_range,rating,image_url,is_verified,is_bookable")
      .eq("registration_status", "approved")
      .eq("is_verified", true)
      .eq("is_bookable", true)
      .order("business_name", { ascending: true })
      .limit(250);

    if (filters.category) query = query.ilike("category", filters.category);
    return query;
  };

  const result = filters.city
    ? await Promise.all([
        buildQuery().ilike("city", `%${filters.city}%`),
        buildQuery().contains("service_areas", [filters.city]),
      ])
    : [await buildQuery()];

  const failedQuery = result.find(({ error }) => error);
  if (failedQuery?.error) throw failedQuery.error;

  const uniqueProviders = new Map<string, ProviderListing>();
  for (const queryResult of result) {
    for (const provider of queryResult.data ?? []) {
      uniqueProviders.set(provider.id, provider as ProviderListing);
    }
  }

  return [...uniqueProviders.values()]
    .filter((provider) => {
      if (filters.budget === undefined) return true;
      const maximumPrice = getProviderMaximumPrice(provider.price_range);
      return maximumPrice !== null && maximumPrice <= filters.budget!;
    })
    .slice(0, limit);
}

export function toPublicProviderListing(provider: ProviderListing) {
  return {
    id: provider.id,
    business_name: provider.business_name,
    owner_name: provider.owner_name,
    category: provider.category,
    city: provider.city,
    phone: provider.phone,
    experience_years: provider.experience_years,
    service_areas: provider.service_areas,
    description: provider.description,
    price_range: provider.price_range,
    rating: provider.rating,
    image_url: provider.image_url,
  };
}

export function toAssistantProviderListing(provider: ProviderListing) {
  return {
    id: provider.id,
    business_name: provider.business_name,
    category: provider.category,
    city: provider.city,
    service_areas: provider.service_areas,
    price_range: provider.price_range,
    rating: provider.rating,
  };
}

export function formatProviderSearchReply(
  providers: ProviderListing[],
  filters: ProviderSearchFilters
): string {
  if (providers.length === 0) {
    return "I couldn't find any approved, verified, bookable provider listings visible to this search matching those filters. You can contact the Evigo team through the [Contact Us page](/contact) for help.";
  }

  const requested = [
    filters.category,
    filters.city ? `in ${filters.city}` : undefined,
    filters.budget !== undefined ? `within the listed price budget of ₹${filters.budget.toLocaleString("en-IN")}` : undefined,
  ].filter(Boolean).join(" ");
  const listings = providers.map((provider) => {
    const details = [
      provider.category,
      provider.city,
      provider.service_areas?.length ? `Service areas: ${provider.service_areas.join(", ")}` : undefined,
      provider.price_range ? `Listed price range: ${provider.price_range}` : undefined,
      provider.rating !== null ? `Recorded rating: ${provider.rating}` : undefined,
    ].filter(Boolean);

    return `- **${provider.business_name || "Provider listing"}**${details.length ? ` — ${details.join(" · ")}` : ""}`;
  }).join("\n");

  return `Here are the real provider listings in Evigo's records${requested ? ` matching ${requested}` : ""}:\n\n${listings}\n\nThe listing data does not confirm date-specific availability. Please contact the provider to confirm details, or use the [Contact Us page](/contact) for help.`;
}
