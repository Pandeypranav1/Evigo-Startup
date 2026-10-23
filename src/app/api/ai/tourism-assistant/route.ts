import { NextRequest, NextResponse } from "next/server";
import { TOURISM_PLACES, EVENT_VENUES } from "@/lib/constants";
import { createClient, getAuthenticatedUser } from "@/lib/server";
import { consumeRequestLimit } from "@/lib/request-limit";
import {
  formatProviderSearchReply,
  parseProviderSearchIntent,
  searchApprovedProviders,
  toAssistantProviderListing,
} from "@/lib/provider-search";

// Scoped Context Generator for Evigo Tourism with rich historical & practical details
function buildSystemContext() {
  const placesText = TOURISM_PLACES.map(
    (p, i) =>
      `${i + 1}. **${p.name}** (${p.category}) - ${p.district} District\n   - Overview: ${p.overview}\n   - Historical background: ${p.historicalBackground}\n   - Significance: ${p.significance}\n   - Location: ${p.location}\n   - How to reach: ${p.howToReach}\n   - Timings: ${p.timings || "Not published in the reviewed official sources"}\n   - Entry fee: ${p.entryFee || "Not published in the reviewed official sources"}\n   - Sources: ${p.historySources.map((source) => `${source.label} (${source.url})`).join("; ")}${Number.isFinite(p.lat) && Number.isFinite(p.lng) ? `\n   - Unverified map coordinates (do not use for directions): ${p.lat}, ${p.lng}` : ""}`
  ).join("\n\n");

  const hotelsText = EVENT_VENUES.map(
    (h) => `- **${h.name}** (${h.location}): ${h.googleRating == null ? "No rating is listed." : `Recorded rating: ${h.googleRating}★`}, Features: ${h.safetyFeatures.join(", ")}`
  ).join("\n");

  return `You are Evigo's travel information assistant for Bihar.
Your role is to help travellers with source-attributed information about tourist destinations, pilgrimage sites, and heritage trails across Bihar districts (starting with Jamui).

PUBLISHED DESTINATION NOTES WITH SOURCE LINKS:
${placesText}

UNVERIFIED HOTEL INFORMATION — DO NOT CLAIM PARTNERSHIP OR AVAILABILITY:
${hotelsText}

INSTRUCTIONS FOR IN-DEPTH ANSWERS:
1. For a specific place, use the structured overview, history, significance, travel fields, and source links above.
2. Do not add dates, dynasties, events, travel times, facilities, fees, opening hours, or ecological facts that are not in the supplied records.
3. Clearly attribute religious belief, local tradition, and disputed source accounts; do not present them as proven fact.
4. If a field is unavailable, say the reviewed official sources do not publish it.
5. Format with clean Markdown headers and short, readable sections.`;
}

function generateHeuristicResponse(userMessage: string): string {
  const query = userMessage.toLowerCase();

  const aliases: Record<string, string[]> = {
    "simultala-hill-station": ["simultala", "tapobhumi"],
    "kshatriya-kund-gram": ["kshatriya kund", "kund gram", "kundgram", "mahavira birth"],
    "lachhuar-jain-mandir": ["lachhuar", "lachuar", "jain mandir"],
    "kali-mandir-malaypur": ["kali mandir", "malaypur", "kali mata"],
    "minto-tower-gidhaur": ["minto", "gidhaur", "clock tower"],
    "giddheshwar-mandir": ["giddheshwar", "gidheshwar"],
    "patneshwar-mandir": ["patneshwar", "patneswar"],
    "nagi-dam-bhimbandh": ["nagi", "bhimbandh"],
  };
  const matchingPlace = TOURISM_PLACES.find((place) =>
    (aliases[place.id] || []).some((alias) => query.includes(alias))
  );

  if (matchingPlace) {
    const sourceLines = matchingPlace.historySources
      .map((source) => `- [${source.label}](${source.url})`)
      .join("\n");
    return `### ${matchingPlace.name}\n\n#### About\n${matchingPlace.overview}\n\n#### History / Background\n${matchingPlace.historicalBackground}\n\n#### Significance\n${matchingPlace.significance}\n\n#### Travel Information\n- **Location:** ${matchingPlace.location}\n- **How to reach:** ${matchingPlace.howToReach}\n- **Timings:** ${matchingPlace.timings || "Not published in the reviewed official sources."}\n- **Entry fee:** ${matchingPlace.entryFee || "Not published in the reviewed official sources."}\n\n#### Sources\n${sourceLines}`;
  }

  // 1. Simultala Hill Station
  return "I can help with the published destination information and approved provider listings. Ask for a specific place or service. Prices, opening times, reservations and transport availability must be confirmed with the provider. [Browse providers](/explore) or [contact Evigo](/contact).";
}

export async function POST(req: NextRequest) {
  try {
    const { user } = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: "Sign in to use the travel assistant." }, { status: 401 });
    if (!await consumeRequestLimit("assistant", user.id, 30, 86400)) {
      return NextResponse.json({ error: "Daily query limit reached. Please try again tomorrow." }, { status: 429 });
    }
    const remaining = undefined;
    const body = await req.json();
    const { message, messages } = body;
    const userQuery = typeof message === "string"
      ? message
      : Array.isArray(messages) && typeof messages[messages.length - 1]?.content === "string"
        ? messages[messages.length - 1].content
        : "";

    if (!userQuery.trim() || userQuery.length > 2000) {
      return NextResponse.json({ error: "Use a message between 1 and 2,000 characters" }, { status: 400 });
    }

    const rawProviderSearch = body.providerSearch;
    const requestedProviderFilters = rawProviderSearch && typeof rawProviderSearch === "object"
      ? {
          ...(typeof rawProviderSearch.category === "string" ? { category: rawProviderSearch.category } : {}),
          ...(typeof rawProviderSearch.city === "string" ? { city: rawProviderSearch.city } : {}),
          ...(typeof rawProviderSearch.budget === "number" ? { budget: rawProviderSearch.budget } : {}),
          ...(typeof rawProviderSearch.limit === "number" ? { limit: rawProviderSearch.limit } : {}),
        }
      : undefined;
    if (
      requestedProviderFilters?.budget !== undefined &&
      (!Number.isFinite(requestedProviderFilters.budget) || requestedProviderFilters.budget < 0)
    ) {
      return NextResponse.json({ error: "Provider search budget must be a non-negative number." }, { status: 400 });
    }
    const providerFilters = parseProviderSearchIntent(userQuery, requestedProviderFilters);
    if (providerFilters) {
      try {
        const supabase = await createClient();
        const providers = await searchApprovedProviders(supabase, providerFilters);
        return NextResponse.json({
          reply: formatProviderSearchReply(providers, providerFilters),
          providers: providers.map(toAssistantProviderListing),
          remaining,
        });
      } catch (error) {
        console.error("[POST /api/ai/tourism-assistant] provider search failed:", error);
        return NextResponse.json(
          {
            error: "Provider search is temporarily unavailable because the listings could not be read. Please contact Evigo support through the Contact Us page.",
            code: "PROVIDER_SEARCH_UNAVAILABLE",
          },
          { status: 503 }
        );
      }
    }

    // Check if external API key is provided (Claude / Anthropic)
    const anthropicKey = process.env.ANTHROPIC_API_KEY;

    if (anthropicKey) {
      try {
        const response = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          signal: AbortSignal.timeout(12000),
          headers: {
            "Content-Type": "application/json",
            "x-api-key": anthropicKey,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: "claude-3-haiku-20240307",
            max_tokens: 800,
            system: buildSystemContext(),
            messages: [{ role: "user", content: userQuery }],
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const replyText = data.content?.[0]?.text || generateHeuristicResponse(userQuery);
          return NextResponse.json({ reply: replyText, remaining });
        }
      } catch {
        // Fallback gracefully
      }
    }

    // Default fast, rich, deeply informative contextual responder
    const reply = generateHeuristicResponse(userQuery);
    return NextResponse.json({ reply, remaining });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error generating recommendation" },
      { status: 500 }
    );
  }
}
