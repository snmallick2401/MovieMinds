import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pino", "pino-pretty"],
  allowedDevOrigins: ["localhost", "127.0.0.1", "192.168.1.2", "10.128.44.208", "192.168.1.4"],
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
