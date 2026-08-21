import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pino", "pino-pretty"],
  allowedDevOrigins: [
    "localhost",
    "127.0.0.1",
    "10.210.172.208",
    "10.128.44.208",
    "10.167.9.208",
    "192.168.1.2",
    "192.168.1.4",
    "192.168.1.5",
    "192.168.1.6",
    "192.168.1.7",
  ],
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "images.unsplash.com" },
      // Avatars are user-supplied HTTPS image URLs. Consider an upload allow-list when storage is added.
      { protocol: "https", hostname: "**" },
    ],
  },
};

export default nextConfig;
