/**
 * Perimeter HTTP Security Headers & Content Security Policy (CSP) configuration.
 * Hardens browser perimeter against Clickjacking (CWE-1021 / CWE-693), MIME sniffing,
 * Protocol downgrades, Cross-Site Scripting (XSS), and Cross-Origin information leakage.
 */

export const CSP_HEADER = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval';
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  img-src 'self' data: blob: https://image.tmdb.org https://*.anilist.co https://s4.anilist.co https://*.supabase.co https://images.unsplash.com https://picsum.photos https://avatars.githubusercontent.com https://lh3.googleusercontent.com https://*.gravatar.com https://secure.gravatar.com https://*.animenewsnetwork.com https://cdn.animenewsnetwork.com;
  font-src 'self' data: https://fonts.gstatic.com;
  connect-src 'self' https://*.supabase.co wss://*.supabase.co;
  media-src 'self' https: data: blob:;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  block-all-mixed-content;
`.replace(/\s{2,}/g, " ").trim();

export const SECURITY_HEADERS = [
  {
    key: "Content-Security-Policy",
    value: CSP_HEADER,
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=(), payment=(), usb=()",
  },
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  {
    key: "Cross-Origin-Opener-Policy",
    value: "same-origin",
  },
  {
    key: "Cross-Origin-Resource-Policy",
    value: "same-origin",
  },
] as const;

/**
 * Applies perimeter security headers (CSP, HSTS, X-Frame-Options, etc.) to a NextResponse.
 */
export function applySecurityHeaders<T extends { headers: Headers }>(res: T): T {
  for (const header of SECURITY_HEADERS) {
    res.headers.set(header.key, header.value);
  }
  return res;
}
