import assert from "node:assert/strict";
import { after, describe, it } from "node:test";
import { isAuthorizedAdmin } from "../src/lib/admin.ts";
import {
  formatProviderSearchReply,
  getProviderMaximumPrice,
  getProviderStartingPrice,
  parseProviderSearchIntent,
  searchApprovedProviders,
} from "../src/lib/provider-search.ts";
import {
  buildProviderReviewUpdate,
  isProviderAccountRole,
  NEW_PROVIDER_REGISTRATION_STATE,
} from "../src/lib/provider-workflow.ts";

const previousAllowlist = process.env.ADMIN_PROVIDER_EMAILS;
process.env.ADMIN_PROVIDER_EMAILS = "reviewer@evigo.in";
after(() => {
  if (previousAllowlist === undefined) delete process.env.ADMIN_PROVIDER_EMAILS;
  else process.env.ADMIN_PROVIDER_EMAILS = previousAllowlist;
});

const listings = [
  {
    id: "approved-provider",
    registration_status: "approved",
    business_name: "Jamui Catering",
    owner_name: "Provider Owner",
    category: "Catering",
    city: "Jamui",
    phone: "9876543210",
    experience_years: 8,
    service_areas: ["Jamui", "Jhajha"],
    description: "Catering service",
    price_range: "₹4,000 - ₹4,800",
    rating: 4.6,
    image_url: null,
    is_verified: true,
    is_bookable: true,
  },
  {
    id: "pending-provider",
    registration_status: "pending",
    business_name: "Pending Catering",
    owner_name: null,
    category: "Catering",
    city: "Jamui",
    phone: null,
    experience_years: null,
    service_areas: [],
    description: null,
    price_range: "₹2,000",
    rating: null,
    image_url: null,
    is_verified: false,
    is_bookable: false,
  },
  {
    id: "too-expensive",
    registration_status: "approved",
    business_name: "Higher Budget Catering",
    owner_name: null,
    category: "Catering",
    city: "Jamui",
    phone: null,
    experience_years: null,
    service_areas: [],
    description: null,
    price_range: "₹12,000",
    rating: null,
    image_url: null,
    is_verified: true,
    is_bookable: true,
  },
];

function fakeSupabaseClient(rows, error = null) {
  return {
    from() {
      return {
        filters: [],
        select() { return this; },
        eq(column, value) { this.filters.push(["eq", column, value]); return this; },
        ilike(column, value) { this.filters.push(["ilike", column, value]); return this; },
        contains(column, value) { this.filters.push(["contains", column, value]); return this; },
        order() { return this; },
        limit() { return this; },
        then(resolve) {
          if (error) return Promise.resolve(resolve({ data: null, error }));
          const selected = rows.filter((provider) => this.filters.every(([operator, column, expected]) => {
            const actual = provider[column];
            if (operator === "eq") return actual === expected;
            if (operator === "ilike") {
              const pattern = String(expected).replace(/^%|%$/g, "").toLowerCase();
              return String(actual ?? "").toLowerCase().includes(pattern);
            }
            return Array.isArray(actual) && expected.every((item) => actual.includes(item));
          }));
          return Promise.resolve(resolve({ data: selected, error: null }));
        },
      };
    },
  };
}

describe("provider auth and approval workflow", () => {
  it("does not authorize a missing or arbitrary admin identity", () => {
    assert.equal(isAuthorizedAdmin(null), false);
    assert.equal(isAuthorizedAdmin({ email: "attacker@example.com", app_metadata: {} }), false);
  });

  it("authorizes only a verified admin allowlist email or trusted app metadata role", () => {
    assert.equal(isAuthorizedAdmin({ email: "reviewer@evigo.in", app_metadata: {} }), true);
    assert.equal(isAuthorizedAdmin({ email: "admin@example.com", app_metadata: { role: "admin" } }), true);
  });

  it("requires the provider role and leaves all new applications pending", () => {
    assert.equal(isProviderAccountRole("provider"), true);
    assert.equal(isProviderAccountRole("client"), false);
    assert.deepEqual(NEW_PROVIDER_REGISTRATION_STATE, {
      registration_status: "pending",
      is_verified: false,
      is_bookable: false,
    });
  });

  it("sets approval and rejection fields consistently", () => {
    assert.deepEqual(buildProviderReviewUpdate("approve"), {
      registration_status: "approved",
      is_verified: true,
      is_bookable: true,
    });
    assert.deepEqual(buildProviderReviewUpdate("reject", "Incomplete profile"), {
      registration_status: "rejected",
      is_verified: false,
      is_bookable: false,
      admin_note: "Incomplete profile",
    });
  });
});

describe("RLS-scoped provider search", () => {
  it("extracts category, city, and rupee budget from an assistant query", () => {
    assert.deepEqual(
      parseProviderSearchIntent("Find caterers in Jamui under ₹5k"),
      { category: "Catering", city: "Jamui", budget: 5000, limit: 20 }
    );
  });

  it("returns only approved, verified, bookable listings within category, area, and budget", async () => {
    const result = await searchApprovedProviders(fakeSupabaseClient(listings), {
      category: "Catering",
      city: "Jhajha",
      budget: 5000,
    });
    assert.deepEqual(result.map((provider) => provider.id), ["approved-provider"]);
  });

  it("returns an explicit no-results response without inventing providers", () => {
    const reply = formatProviderSearchReply([], { category: "Photography", city: "Jamui" });
    assert.match(reply, /couldn't find any approved, verified, bookable provider listings/i);
    assert.match(reply, /Contact Us page/);
    assert.doesNotMatch(reply, /₹\d|★/);
  });

  it("surfaces RLS or database permission errors instead of disguising them as no results", async () => {
    await assert.rejects(
      searchApprovedProviders(fakeSupabaseClient([], new Error("permission denied"))),
      /permission denied/
    );
  });

  it("uses the listed price range and does not infer a price when it is absent", () => {
    assert.equal(getProviderStartingPrice("₹4,000 - ₹4,800"), 4000);
    assert.equal(getProviderMaximumPrice("₹4,000 - ₹4,800"), 4800);
    assert.equal(getProviderStartingPrice(null), null);
  });
});
