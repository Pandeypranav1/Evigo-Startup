import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "upload.wikimedia.org",
      },
      {
        protocol: "https",
        hostname: "thumb.wikimedia.org",
      },
      // Leaflet default marker icons are served from unpkg CDN
      {
        protocol: "https",
        hostname: "unpkg.com",
      },
      // OpenStreetMap tile server (used by Leaflet for map background)
      {
        protocol: "https",
        hostname: "*.tile.openstreetmap.org",
      },
      // Supabase storage for provider image uploads
      {
        protocol: "https",
        hostname: "gkunzumvfaqbyneugywj.supabase.co",
      },
    ],
  },
};

export default nextConfig;
