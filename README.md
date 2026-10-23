# Evigo — Bihar's Event & Tourism Marketplace

[![Next.js](https://img.shields.io/badge/Next.js-16.4-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38bdf8?logo=tailwindcss)](https://tailwindcss.com)
[![Supabase](https://img.shields.io/badge/Supabase-Auth-3ECF8E?logo=supabase)](https://supabase.com)

---

## Current deployment status

The non-payment readiness audit and setup/rollback instructions are in [PRODUCTION_READINESS.md](PRODUCTION_READINESS.md). Supabase Auth and PostgreSQL are authoritative for accounts, providers and bookings. MongoDB models and Firebase dependencies are legacy; no current API imports them. Static hotel entries are unverified information, not live inventory. Requests require a signed-in account and an eligible database provider. Local jobs are not implemented. Do not use the historical feature checklist below as proof of live verification.

## 🌏 Project Overview

**Evigo** is Bihar's trusted marketplace for event services, tourism, and hotel partnerships. It connects clients — planning weddings, corporate events, or leisure trips — with verified local vendors (caterers, photographers, DJs, mehendi artists) and hotel partners across the state.

The platform serves two distinct audiences:

- **Clients** browsing and booking event professionals or hotel partners for celebrations in Bihar
- **Providers** (vendors / hotels) onboarding to list their services and receive bookings through a dedicated provider dashboard

The current launch focus is **Jamui district**: historical hotel information entries awaiting partner verification (Usha Nand Palace, GenX Brij, Hotel JP Grand, Hotel Nirmala Inn) and 8 curated tourism destinations (Simultala Hill Station, Kshatriya Kund Gram, Nagi Dam, etc.).

---

## 🛠 Tech Stack

> Pulled from `package.json`, `next.config.ts`, and `.env.local.example` — not inferred.

| Layer | Technology |
|---|---|
| **Framework** | [Next.js 16.4.2](https://nextjs.org) (App Router, Server Components, API Routes) |
| **Language** | TypeScript 5.x |
| **Styling** | Tailwind CSS v4 (via `@tailwindcss/postcss`) + Vanilla CSS in `globals.css` |
| **UI Primitives** | Radix UI, shadcn, class-variance-authority, tailwind-merge |
| **Auth** | Supabase Auth (`@supabase/ssr`, `@supabase/supabase-js`) |
| **Database (Primary)** | Supabase (PostgreSQL) for auth + user data |
| **Database (Legacy)** | MongoDB via Mongoose (providers & bookings — being migrated) |
| **Maps** | [Leaflet 1.9.4](https://leafletjs.com) + OpenStreetMap tiles (free, no API key) |
| **AI Assistant** | Evigo heuristic knowledge base (built-in) + optional Claude 3 Haiku (Anthropic API) |
| **Analytics** | `@vercel/speed-insights` |
| **Deployment** | [Vercel](https://vercel.com) (assumed from next.config structure) |
| **Images** | `next/image` with local `/public` directory; Unsplash for remote images |
| **Hotel Images** | Stored locally in `/public/partners/events/{hotel_slug}/` |
| **Tourism Images** | Stored locally in `/public/tourism/jamui/` |

---

## 🏗 Architecture Overview

### Folder Structure

```
startup/
├── public/
│   ├── partners/events/          # Hotel partner photos (5 per hotel)
│   │   ├── genx_brij/
│   │   ├── jp_grand/
│   │   ├── nirmala_inn/
│   │   └── usha_nand/
│   └── tourism/jamui/            # Jamui district tourism place photos
├── src/
│   ├── app/                      # Next.js App Router pages
│   │   ├── page.tsx              # Homepage (Hero, Services, Tourism, Hotels)
│   │   ├── explore/              # Provider browse & filter page
│   │   ├── hotels/               # Hotel detail page with carousels
│   │   ├── services/             # Services landing + sub-pages
│   │   │   └── tourism/          # Tourism district explorer + AI assistant
│   │   ├── about/
│   │   ├── contact/
│   │   ├── dashboard/            # Client booking dashboard
│   │   ├── partner/              # Provider onboarding form
│   │   ├── login/                # client/ and provider/ auth flows
│   │   └── api/
│   │       ├── ai/tourism-assistant/   # AI Travel Assistant (POST)
│   │       ├── analytics/              # Page view tracking
│   │       ├── auth/                   # Auth helpers
│   │       ├── nearby-hotels/          # Leaflet hotel search
│   │       ├── providers/              # CRUD for Provider listings
│   │       ├── track-visit/            # Analytics
│   │       └── users/                  # User profile management
│   ├── components/
│   │   ├── PageContainer.tsx     # ⚠️ ARCHITECTURE RULE: All sections must use this
│   │   ├── Container.tsx         # Re-export of PageContainer (for backwards compat)
│   │   ├── Header.tsx            # Site-wide navigation + mobile menu
│   │   ├── Footer.tsx            # Footer with contact details
│   │   ├── NearbyHotelsV2.tsx    # Find Hotels Near You (Leaflet + text search)
│   │   ├── TourismMap.tsx        # District tourism map (Leaflet, SSR-disabled)
│   │   ├── LeafletMap.tsx        # Generic Leaflet map wrapper
│   │   ├── BookingModal.tsx      # Service booking flow modal
│   │   ├── VendorCard.tsx        # Provider listing card
│   │   └── WhatsAppButton.tsx    # WhatsApp CTA widget
│   ├── lib/
│   │   └── constants.ts          # All static data: categories, hotel partners,
│   │                             #   tourism places (precise GPS withheld), city resolver
│   ├── models/                   # Mongoose schemas (MongoDB)
│   │   ├── Provider.ts
│   │   ├── Booking.ts
│   │   └── User.ts
│   └── context/                  # React context (auth state)
```

### Key Architectural Rules

> **`<PageContainer>` is mandatory for all page sections.**
> Every section of every page wraps its content in `<PageContainer>` (or `<Container>`, which re-exports it).  
> It enforces: `max-width: 1280px`, `width: 100%`, `margin: 0 auto`, `px-6 md:px-12`.  
> **Never** add `max-w-*` or `px-*` at the outer section level — always use `PageContainer`.

### Frontend — Pages & Key Components

| Route | Purpose |
|---|---|
| `/` | Homepage: Hero, Core Services (5 categories), Travel & Tourism preview, Trusted Partners, Find Hotels Near You |
| `/explore` | Browse/filter verified providers by service type, location, and price |
| `/hotels` | Hotel details page — 5-image carousels, thumbnails, safety features, booking modal |
| `/services` | Services overview — Events, Tourism, Other Services (Coming Soon) |
| `/services/tourism` | District-wise tourism explorer with interactive Leaflet map + AI Itinerary Planner |
| `/partner` | Provider onboarding/registration form |
| `/dashboard` | Client dashboard: bookings, profile |
| `/login/client`, `/login/provider` | Supabase Auth login flows |
| `/about`, `/contact` | Static info pages |

### Backend — API Routes

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/ai/tourism-assistant` | POST | AI Travel Assistant: answers tourism queries using built-in Jamui knowledge base, optional Claude 3 Haiku fallback |
| `/api/providers` | GET, POST, PATCH, DELETE | CRUD for Provider (Mongoose/MongoDB) |
| `/api/nearby-hotels` | GET | Leaflet-based nearby hotel search (lat/lng radius) |
| `/api/users` | GET, POST | User profile read/write |
| `/api/auth/*` | POST | Supabase auth helpers |
| `/api/analytics`, `/api/track-visit` | POST | Page view / analytics tracking |

### Data Models

**MongoDB (Mongoose) — `src/models/`**

```ts
// Provider — registered event service vendors
{ businessName, ownerName, category, startingPrice, city, phone,
  experienceYears, description, imageUrl, isActive, services, pricing, location }

// Booking — client ↔ provider booking record
{ clientId, providerId, status: "pending"|"confirmed"|"completed"|"cancelled" }

// User — basic user profile linked to Firebase/Supabase UID
```

**Static Data — `src/lib/constants.ts`**

```ts
// SERVICE_CATEGORIES — ["Catering", "Photography", "DJ", "Mehendi & Makeup", "Restaurant"]

// EVENT_VENUES (HOTEL_PARTNERS) — historical Jamui hotel entries (unverified) with images, GPS, pricing,
//   safety features, and services

// TOURISM_PLACES — Jamui destination information; precise coordinates withheld,
//   images, category, description, and featured flag

// TOURISM_DISTRICTS — 8 Bihar districts (Jamui active, 7 Coming Soon)

// BIHAR_CITIES + resolveBiharCity() — instant local geocoding without external API
```

### Key Data Flows

**Explore page filter flow:**
1. User selects `Service Type`, `Location`, `Price Band` in filter bar
2. Client-side filters run against providers fetched from `/api/providers` (GET)
3. For "Restaurant" filter, hotel partner cards from `EVENT_VENUES` are injected client-side

**AI Travel Assistant:**
1. User types a query in the AI drawer on `/services/tourism`
2. POST → `/api/ai/tourism-assistant` with the message
3. API requires sign-in and checks a shared database quota (30 queries/day per account)
4. Provider/vendor searches query `public.providers` server-side using the publishable Supabase client, under the caller's existing RLS permissions. Only approved, verified, bookable listings are returned; category, city/service area and listed-price budget filters are supported.
5. Empty provider searches direct users to `/contact`. Listing query/permission failures are returned as errors rather than treated as empty search results.
6. Other tourism queries use Claude 3 Haiku when `ANTHROPIC_API_KEY` is configured, or the built-in responder for known places.

**Directions link (Tourism place cards):**
```ts
// If place has verified lat/lng:
`https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`

// Fallback if coords missing:
`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name + ', ' + place.district + ', Bihar')}`
```
Opens in new tab — no in-page map component is loaded for Directions.

---

## Historical feature checklist (not a readiness assessment)

### Core Services (Event Marketplace)
- [x] **Catering** — browse and book verified caterers in Bihar
- [x] **Photography** — wedding & event photographers
- [x] **DJ** — DJ & sound/lighting services
- [x] **Mehendi & Makeup** — bridal artists & stylists
- [x] **Restaurant / Hotels** — links to hotel partner listings

### Travel & Tourism
- [x] **District-wise explorer** (8 districts listed; Jamui fully active)
- [x] **Jamui tourism places** — destination notes with photos and source links; precise map coordinates are withheld pending verification
- [x] **Interactive Leaflet map** — district overview map (Show/Hide toggle)
- [x] **Category filter chips** — filter by Nature, Pilgrimage, Heritage
- [x] **AI Itinerary Planner** — ask for custom trips (30 queries/day)
- [ ] Patna, Gaya, Rajgir, Vaishali, Bhagalpur, Munger, Darbhanga — Coming Soon

### Hotel Partners
- [x] **Hotel Usha Nand Palace** — 5 photos, services, booking modal
- [x] **GenX Brij** — 5 photos, services, booking modal
- [x] **Hotel JP Grand** — 5 photos, services, booking modal
- [x] **Hotel Nirmala Inn** — 5 photos, services, booking modal
- [x] **Hotel detail page** (`/hotels`) — 5-image carousels, thumbnails, anchor nav
- [x] **Hotel quick-jump pills** in homepage Trusted Partners section
- [ ] Real phone numbers and addresses for all 4 hotels (placeholder data currently)

### Find Hotels Near You
- [x] Leaflet/OpenStreetMap radius search with GPS or city dropdown
- [x] Instant Jamui shortcut button
- [x] Text search fallback via `resolveBiharCity()` (no external geocoding API needed)
- [x] Photo lightbox for hotel results

### Provider Ecosystem
- [x] Provider registration form (`/partner`)
- [x] Provider listing browse & filter (`/explore`)
- [x] Provider CRUD API (MongoDB)
- [x] Client & Provider login flows (Supabase Auth)
- [x] Client booking dashboard

### Site-Wide
- [x] Permanent centralized layout container (`<PageContainer>` — max-width 1280px)
- [x] Responsive design (mobile 375px → desktop 1920px)
- [x] Dark-mode tourism pages, light-mode homepage
- [x] Footer with contact details (email, phone, location)
- [x] `PageTracker` analytics component
- [x] SEO: title tags, meta descriptions on all major pages

---

## ⚙️ Environment Setup

### 1. Install Dependencies
```bash
npm ci
```

### 2. Environment Variables

Create a `.env.local` file in the project root. Required variables:

```env
# ─── Supabase (Auth + DB) ──────────────────────────────────────────────────────
# Get from: https://supabase.com/dashboard → Settings → API
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=          # Server-only — never prefix with NEXT_PUBLIC_
ADMIN_PROVIDER_EMAILS=              # Comma-separated admin allowlist; server-only
# Alternatively configure the trusted Supabase Auth app_metadata.role=admin claim.

# ─── MongoDB (Legacy provider/booking data) ───────────────────────────────────
MONGODB_URI=                        # e.g. mongodb+srv://user:pass@cluster.mongodb.net/evigo

# ─── Firebase (if using Firebase Auth in parallel) ────────────────────────────
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# ─── AI Travel Assistant (optional) ───────────────────────────────────────────
# Without this key, the AI assistant uses the built-in heuristic responder.
ANTHROPIC_API_KEY=                  # Claude 3 Haiku (anthropic.com)

# ─── Google Maps (optional — only for Nearby Hotels server-side search) ────────
GOOGLE_MAPS_API_KEY=                # Server-side only — never use NEXT_PUBLIC_
```

> **Never commit real key values** to source control — only variable names should appear in README or `.env.example`.

### Provider approval and search setup

- Configure `ADMIN_PROVIDER_EMAILS` with comma-separated, trusted admin email addresses, or assign the trusted Supabase Auth `app_metadata.role=admin` claim through a privileged process. The provider review API verifies the Supabase session itself; identity headers are not used for authorization.
- Provider registration requires an authenticated account whose existing `profiles.role` is `provider`. New submissions are always pending, unverified, and unbookable. Approval/rejection is restricted to pending applications.
- AI and public provider searches use the server-side Supabase publishable client, so the existing `public.providers` grants and RLS policies remain in effect. Review the project's current SELECT grant/policies to ensure the intended public or authenticated role can read only eligible provider rows. Do not use the service-role key to make listings visible; RLS-filtered rows may look like an empty result, while a denied table permission is returned as a search error.
- Search filters use the stored category, `city`/`service_areas`, and the stored `price_range`. A budget filter includes a listing only when its full parseable listed price range is within budget. Missing/unparseable prices are excluded from budget-filtered results. Date-specific availability is not inferred.
- No provider rows or verification values are seeded by this code. Do not manually approve the existing FaabCab record as part of setup.

Run `npm run test:provider` for the focused workflow/search tests. To verify real registration and admin approval end-to-end, use a non-production Supabase project with a real provider-auth account and a deliberately submitted pending test application. Check unauthenticated registration (`401`), non-provider registration (`403`), header-only admin access (`401`), non-admin session (`403`), approve/reject state changes, and provider search under the configured RLS policies. Do not create test rows in production.

### 3. Run Locally
```bash
npm run dev
# App available at http://localhost:3000
```

### 4. Build & Type-Check
```bash
npx tsc --noEmit    # TypeScript validation (must pass with 0 errors)
npm run build       # Production bundle
```

---

## ⚠️ Known Limitations & TODOs

### Data Completeness
- [ ] **Hotel real data**: Phone numbers, addresses, and Google ratings for all 4 partner hotels are currently placeholder values — need to be confirmed with partners
- [ ] **Kali Mandir / Patneshwar Mandir GPS**: Approximate coordinates — exact GPS to be confirmed on-site or via Google Maps "right-click → copy coords"
- [ ] **Jamui hotel GPS**: `EVENT_VENUES` records don't have `lat/lng` fields — should be added for map display in `NearbyHotelsV2`

### Tourism Expansion
- [ ] **7 more districts** to populate: Patna, Gaya, Rajgir, Vaishali, Bhagalpur, Munger, Darbhanga
- [ ] **Tourism images** needed for all future districts (`/public/tourism/{district}/`)
- [ ] **Verified local guide contacts** per district (planned for Other Services)

### Technical
- [ ] **MongoDB → Supabase migration**: Currently both MongoDB (Mongoose) and Supabase are in use — Provider/Booking models should be migrated to Supabase tables for a single database layer
- [ ] **Firebase vs Supabase auth**: Both Firebase and Supabase auth packages are in `package.json` — pick one and remove the other to reduce bundle size
- [ ] **`GOOGLE_MAPS_API_KEY`**: The `nearby-hotels` API route may reference this but the project currently uses OpenStreetMap/Leaflet client-side. If scaling up map features, evaluate Google Maps Platform
- [x] **AI Assistant rate limiting**: Shared database counter implemented; requires the non-payment security migration. Live behavior is not yet verified.
- [ ] **`head_page.tsx`** (45 KB) in project root — appears to be a legacy file; should be archived or removed

---

## 📞 Contact

- **Email**: [support.evigo@gmail.com](mailto:support.evigo@gmail.com)
- **Phone**: [7808807340](tel:+917808807340)
- **Location**: Samastipur, Bihar, India
