import type { MetadataRoute } from "next";
export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/about", "/contact", "/explore", "/services", "/services/tourism", "/travel-tourism", "/hotels", "/combo-packs", "/terms-and-conditions", "/privacy-policy"]
    .map((path) => ({ url: `https://evigostartup.vercel.app${path}` }));
}
