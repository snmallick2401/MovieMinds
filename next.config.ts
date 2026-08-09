import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "images.unsplash.com" },
      // Avatars are user-supplied HTTPS image URLs. Consider an upload allow-list when storage is added.
      { protocol: "https", hostname: "**" },
    ],
  },
};

export default nextConfig;
