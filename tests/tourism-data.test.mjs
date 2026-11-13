import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { describe, it } from "node:test";
import { resolve } from "node:path";
import { COMBO_PACK_IMAGES, resolveComboPackImage } from "../src/lib/combo-images.ts";
import {
  BIHAR_DESTINATIONS,
  CURATED_EXPERIENCES,
  EVENT_VENUES,
  HOTEL_PARTNERS,
  TRUSTED_PARTNERS,
  TOURISM_DESTINATION_IMAGES,
  TOURISM_DISTRICTS,
  TOURISM_IMAGE_ASSETS,
  TOURISM_PLACES,
  BIHAR_CITIES,
  haversineKm,
  resolveBiharCity,
  CATEGORY_TAGLINE,
  CATEGORY_IMAGE,
} from "../src/lib/constants.ts";

describe("verified partners and tourism data", () => {
  it("publishes the 5 genuine verified hotel and venue partners", () => {
    assert.equal(EVENT_VENUES.length, 5);
    assert.equal(HOTEL_PARTNERS.length, 5);
    assert.equal(TRUSTED_PARTNERS.length, 5);

    const expectedNames = [
      "Hotel Usha Nand Palace",
      "GenX Brij",
      "Hotel JP Grand",
      "Hotel Nirmala Inn",
      "Shagun Vatika",
    ];

    for (const name of expectedNames) {
      assert.ok(
        EVENT_VENUES.some((v) => v.name === name),
        `EVENT_VENUES contains ${name}`
      );
      assert.ok(
        HOTEL_PARTNERS.some((h) => h.name === name),
        `HOTEL_PARTNERS contains ${name}`
      );
      assert.ok(
        TRUSTED_PARTNERS.some((p) => p.name === name),
        `TRUSTED_PARTNERS contains ${name}`
      );
    }
  });

  it("ensures every verified partner has images, address, and city", () => {
    for (const venue of EVENT_VENUES) {
      assert.ok(venue.id, `Venue ${venue.name} has id`);
      assert.ok(venue.images.length > 0, `Venue ${venue.name} has images`);
      assert.ok(venue.address, `Venue ${venue.name} has address`);
      assert.ok(venue.city, `Venue ${venue.name} has city`);
      assert.ok(venue.services.length > 0, `Venue ${venue.name} has services`);
    }

    for (const hotel of HOTEL_PARTNERS) {
      assert.ok(hotel.id, `Hotel ${hotel.name} has id`);
      assert.ok(hotel.photos.length > 0, `Hotel ${hotel.name} has photos`);
      assert.ok(hotel.address, `Hotel ${hotel.name} has address`);
      assert.ok(hotel.city, `Hotel ${hotel.name} has city`);
      assert.ok(hotel.lat && hotel.lng, `Hotel ${hotel.name} has coordinates`);
    }
  });

  it("supports all 8 tourism districts and 21 places across Bihar", () => {
    assert.equal(TOURISM_DISTRICTS.length, 8);
    const expectedDistricts = [
      "Jamui",
      "Patna",
      "Gaya",
      "Rajgir",
      "Nalanda",
      "Sitamarhi",
      "Vaishali",
      "Madhubani",
    ];

    for (const districtId of expectedDistricts) {
      assert.ok(
        TOURISM_DISTRICTS.some((d) => d.id === districtId),
        `TOURISM_DISTRICTS contains ${districtId}`
      );
    }

    assert.equal(TOURISM_PLACES.length, 21);
    assert.equal(
      TOURISM_PLACES.filter((place) => place.image && place.imageAttribution).length,
      10,
      "10 existing tourist-place records have verified photos"
    );
    for (const place of TOURISM_PLACES) {
      assert.ok(place.id, "place has id");
      assert.ok(place.name, "place has name");
      assert.ok(place.district, "place has district");
      assert.ok(place.overview, `place ${place.name} has overview`);
      if (place.image) {
        assert.ok(place.imageAttribution, `place ${place.name} image is attributed`);
        assert.ok(place.imageAlt, `place ${place.name} image has descriptive alt text`);
        assert.ok(
          existsSync(resolve(process.cwd(), "public", place.image.slice(1))),
          `place ${place.name} image exists`
        );
      } else {
        assert.equal(place.imageAttribution, undefined, `place ${place.name} has no orphan attribution`);
      }
    }
  });

  it("maps verified local image assets to their source and license metadata", () => {
    for (const [id, image] of Object.entries(TOURISM_IMAGE_ASSETS)) {
      assert.ok(image.alt, `${id} has descriptive alt text`);
      assert.ok(image.attribution.name, `${id} has a creator`);
      assert.ok(image.attribution.source.startsWith("https://"), `${id} has a source URL`);
      assert.ok(image.attribution.licenseUrl.startsWith("https://"), `${id} has a license URL`);
      assert.ok(
        existsSync(resolve(process.cwd(), "public", image.src.slice(1))),
        `${id} local image exists`
      );
    }

    const districtImagePaths = Object.values(TOURISM_DESTINATION_IMAGES)
      .map((image) => image.src)
      .filter(Boolean);
    assert.equal(districtImagePaths.length, 7, "7 of 8 supported districts have verified photos");
    assert.equal(
      new Set(districtImagePaths).size,
      districtImagePaths.length,
      "districts with verified photos do not reuse the same image"
    );

    for (const destination of BIHAR_DESTINATIONS) {
      assert.ok(destination.alt, `${destination.name} has alt text`);
      if (destination.imageAttribution) {
        assert.ok(destination.img, `${destination.name} has a verified image`);
        assert.ok(destination.imageAttribution.source, `${destination.name} image has source metadata`);
      } else {
        assert.equal(destination.img, "", `${destination.name} without a verified image uses no image path`);
      }
    }

    for (const experience of CURATED_EXPERIENCES) {
      assert.ok(experience.imageAttribution, `${experience.title} image is attributed`);
      assert.ok(
        existsSync(resolve(process.cwd(), "public", experience.image.slice(1))),
        `${experience.title} image exists`
      );
    }
  });

  it("resolves combo photos by stable package slug and leaves custom imagery unavailable", () => {
    assert.equal(Object.keys(COMBO_PACK_IMAGES).length, 7);
    for (const slug of Object.keys(COMBO_PACK_IMAGES)) {
      const resolved = resolveComboPackImage(slug, TOURISM_IMAGE_ASSETS);
      assert.ok(resolved?.alt, `${slug} has descriptive alt text`);
      assert.ok(
        existsSync(resolve(process.cwd(), "public", resolved.src.slice(1))),
        `${slug} local image exists`
      );
    }

    assert.equal(
      resolveComboPackImage("custom-weekend-getaway-package", TOURISM_IMAGE_ASSETS),
      undefined,
      "custom package does not claim a fixed destination photo"
    );
    assert.equal(resolveComboPackImage("unknown-package", TOURISM_IMAGE_ASSETS), undefined);
  });

  it("provides reliable city resolution and distance calculation", () => {
    const jamui = resolveBiharCity("Jamui");
    assert.ok(jamui);
    assert.equal(jamui?.name, "Jamui");

    const patna = resolveBiharCity("patna city");
    assert.ok(patna);
    assert.equal(patna?.name, "Patna");

    const dist = haversineKm(jamui.lat, jamui.lng, patna.lat, patna.lng);
    assert.ok(dist > 100 && dist < 200, "Distance between Jamui and Patna is ~140km");
  });

  it("defines all service category taglines and images", () => {
    const categories = [
      "Catering",
      "Photography",
      "DJ",
      "Mehendi & Makeup",
      "Restaurant",
      "Transport",
    ];

    for (const cat of categories) {
      assert.ok(CATEGORY_TAGLINE[cat], `CATEGORY_TAGLINE for ${cat}`);
      assert.ok(CATEGORY_IMAGE[cat], `CATEGORY_IMAGE for ${cat}`);
    }
  });
});
