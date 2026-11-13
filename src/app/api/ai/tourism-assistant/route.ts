import { NextRequest, NextResponse } from "next/server";
import {
  getVerifiedTourismCoordinates,
  TOURISM_PLACES,
} from "@/lib/constants";
import { createClient } from "@/lib/server";
import {
  formatProviderSearchReply,
  parseProviderSearchIntent,
  searchApprovedProviders,
  toAssistantProviderListing,
} from "@/lib/provider-search";

// In-memory sliding window rate limiter (resets on server restart or 24h)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const MAX_REQUESTS_PER_DAY = 30;
const WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours

function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + WINDOW_MS });
    return { allowed: true, remaining: MAX_REQUESTS_PER_DAY - 1 };
  }

  if (entry.count >= MAX_REQUESTS_PER_DAY) {
    return { allowed: false, remaining: 0 };
  }

  entry.count += 1;
  return { allowed: true, remaining: MAX_REQUESTS_PER_DAY - entry.count };
}

// Scoped Context Generator for Evigo Tourism with rich historical & practical details
function buildSystemContext() {
  const placesText = TOURISM_PLACES.map(
    (p, i) =>
      `${i + 1}. **${p.name}** (${p.category}) - ${p.district} District\n   - Overview: ${p.overview}\n   - Historical background: ${p.historicalBackground}\n   - Significance: ${p.significance}\n   - Location: ${p.location}\n   - How to reach: ${p.howToReach}\n   - Timings: ${p.timings || "Not published in the reviewed official sources"}\n   - Entry fee: ${p.entryFee || "Not published in the reviewed official sources"}\n   - Sources: ${p.historySources.length ? p.historySources.map((source) => `${source.label} (${source.url})`).join("; ") : "No primary source verified"}\n   - Verified coordinates: ${JSON.stringify(getVerifiedTourismCoordinates(p)) || "Not verified; use a name-based map search"}`
  ).join("\n\n");

  return `You are Evigo's Official AI Travel & Heritage Assistant for Bihar.
Your role is to help travellers with source-attributed information about tourist destinations, pilgrimage sites, and heritage trails across Bihar districts (starting with Jamui). Not all entries or visitor details have been independently verified.

SOURCE-BACKED TOURISM DESTINATIONS:
${placesText}

INSTRUCTIONS FOR IN-DEPTH ANSWERS:
1. For a specific place, use only its supplied fields and linked sources. Do not claim that an entry is verified unless its source supports the claim.
2. Do not add dates, dynasties, events, travel times, facilities, fees, opening hours, or ecological facts that are not in the supplied records.
3. Clearly attribute religious belief, local tradition, and disputed source accounts; do not present them as proven fact.
4. If a field is unavailable, say it was not verified in the reviewed sources. If no source is listed, say no primary source was verified.
5. Format with clean Markdown headers and short, readable sections.`;
}

function generateHeuristicResponse(userMessage: string): { reply: string; sourceBacked: boolean } {
  const query = userMessage.toLowerCase();

  const aliases: Record<string, string[]> = {
    "simultala-hill-station": ["simultala", "tapobhumi"],
    "kshatriya-kund-gram": ["kshatriya kund", "kund gram", "kundgram", "mahavira birth"],
    "lachhuar-jain-mandir": ["lachhuar", "lachuar", "jain mandir"],
    "kali-mandir-malaypur": ["kali mandir", "malaypur", "kali mata"],
    "minto-tower-gidhaur": ["minto", "gidhaur", "clock tower"],
    "giddheshwar-temple": ["giddheshwar", "gidheshwar"],
    "patneshwar-mandir": ["patneshwar", "patneswar"],
    "nagi-dam-bhimbandh": ["bhimbandh"],
    "mahabodhi-temple": ["bodh gaya", "mahabodhi"],
    "vishwa-shanti-stupa": ["rajgir peace pagoda", "vishwa shanti stupa rajgir"],
    "nalanda-ruins": ["nalanda", "nalanda mahavihara"],
    "ashokan-pillar-vaishali": ["ashokan pillar", "kolhua"],
    "madhubani-art-village": ["mithila painting", "madhubani painting"],
    "gandhi-ghat-patna": ["gandhi ghat"],
    "punaura-dham": ["punaura"],
    "golghar-patna": ["golghar", "gol ghar"],
    "patna-museum": ["patna museum"],
    "vaishali-stupa": ["vaishali peace pagoda", "world peace pagoda vaishali"],
    "rajgir-hot-springs": ["brahmakund", "rajgir hot spring"],
  };
  const matchingPlace = TOURISM_PLACES.find((place) =>
    query.includes(place.name.toLowerCase()) ||
    (aliases[place.id] || []).some((alias) => query.includes(alias))
  );

  if (matchingPlace) {
    const sourceLines = matchingPlace.historySources.length
      ? matchingPlace.historySources.map((source) => `- [${source.label}](${source.url})`).join("\n")
      : "No primary source or specific visitor venue has been verified for this entry.";
    return {
      reply: `### ${matchingPlace.name}\n\n#### About\n${matchingPlace.overview}\n\n#### History / Background\n${matchingPlace.historicalBackground}\n\n#### Significance\n${matchingPlace.significance}\n\n#### Travel Information\n- **Location:** ${matchingPlace.location}\n- **How to reach:** ${matchingPlace.howToReach}\n- **Timings:** ${matchingPlace.timings || "Not published in the reviewed official sources."}\n- **Entry fee:** ${matchingPlace.entryFee || "Not published in the reviewed official sources."}\n\n#### Sources\n${sourceLines}`,
      sourceBacked: true,
    };
  }

  // Itineraries
  if (query.includes("2 day") || query.includes("two day") || query.includes("weekend") || query.includes("itinerary") || query.includes("plan")) {
    return {
      reply: `### Trip planning\n\nThe reviewed official sources do not provide a verified timed itinerary or travel durations. Use the place details and source links above, and confirm local transport and opening arrangements before setting a schedule.`,
      sourceBacked: true,
    };
  }

  if (query.includes("hotel") || query.includes("stay") || query.includes("restaurant") || query.includes("food")) {
    return {
      reply: "The tourism records do not contain a source-verified hotel or restaurant recommendation. Check the [Hotels & Venues page](/hotels) for current provider listings, and confirm the provider's details and availability before booking.",
      sourceBacked: true,
    };
  }

  const placeNames = TOURISM_PLACES.map((place) => `- ${place.name}`).join("\n");
  return {
    reply: `I can provide source-backed information for the places in Evigo's tourism records:\n${placeNames}\n\nAsk about a specific place to see its recorded details and source links. I cannot verify current opening times, travel durations, or a date-specific itinerary from these records.`,
    sourceBacked: false,
  };
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";
    const { allowed, remaining } = checkRateLimit(ip);

    if (!allowed) {
      return NextResponse.json(
        {
          error: "Daily query limit reached (30 queries/day). Please try again tomorrow or contact our travel desk directly.",
        },
        { status: 429 }
      );
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
    }
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ error: "Request body must be a JSON object." }, { status: 400 });
    }
    const requestBody = body as Record<string, unknown>;
    const messages = requestBody.messages;
    const lastMessage = Array.isArray(messages) ? messages[messages.length - 1] : null;
    const candidateMessage =
      typeof requestBody.message === "string"
        ? requestBody.message
        : lastMessage && typeof lastMessage === "object" && "content" in lastMessage
          ? lastMessage.content
          : "";
    const userQuery = typeof candidateMessage === "string" ? candidateMessage.trim() : "";

    if (!userQuery) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const rawProviderSearch = requestBody.providerSearch;
    const providerSearchObject =
      rawProviderSearch && typeof rawProviderSearch === "object" && !Array.isArray(rawProviderSearch)
        ? rawProviderSearch as Record<string, unknown>
        : null;
    const requestedProviderFilters = providerSearchObject
      ? {
          ...(typeof providerSearchObject.category === "string" ? { category: providerSearchObject.category } : {}),
          ...(typeof providerSearchObject.city === "string" ? { city: providerSearchObject.city } : {}),
          ...(typeof providerSearchObject.budget === "number" ? { budget: providerSearchObject.budget } : {}),
          ...(typeof providerSearchObject.limit === "number" ? { limit: providerSearchObject.limit } : {}),
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
        const { providers } = await searchApprovedProviders(supabase, providerFilters);
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

    const heuristicResponse = generateHeuristicResponse(userQuery);
    if (heuristicResponse.sourceBacked) {
      return NextResponse.json({ reply: heuristicResponse.reply, remaining });
    }

    // Check if external API key is provided (Claude / Anthropic)
    const anthropicKey = process.env.ANTHROPIC_API_KEY;

    if (anthropicKey) {
      try {
        const response = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
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
          const replyText =
            typeof data.content?.[0]?.text === "string" && data.content[0].text.trim()
              ? data.content[0].text
            : heuristicResponse.reply;
          return NextResponse.json({ reply: replyText, remaining });
        }
        console.error("[POST /api/ai/tourism-assistant] External assistant returned:", response.status);
      } catch (error) {
        console.error("[POST /api/ai/tourism-assistant] External assistant request failed:", error);
      }
    }

    // Default fast, rich, deeply informative contextual responder
    return NextResponse.json({ reply: heuristicResponse.reply, remaining });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error generating recommendation" },
      { status: 500 }
    );
  }
}
