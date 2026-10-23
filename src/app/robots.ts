import type { MetadataRoute } from "next";
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/admin/", "/dashboard", "/provider/", "/login/", "/partner$", "/partner/"] }, sitemap: "https://evigostartup.vercel.app/sitemap.xml" };
}
