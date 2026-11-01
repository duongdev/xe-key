import path from "node:path";
import type { NextConfig } from "next";

const TURNSTILE = "https://challenges.cloudflare.com";
const dev = process.env.NODE_ENV !== "production";

// Prerendered pages cannot carry a per-request nonce, so Next's inline scripts need 'unsafe-inline'.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' ${TURNSTILE}${dev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  `connect-src 'self' ${TURNSTILE}`,
  `frame-src ${TURNSTILE}`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const config: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: path.join(import.meta.dirname, "../.."),
  transpilePackages: ["@xekey/car"],
  poweredByHeader: false,
  // Public build-time values, inlined so dynamic routes use the same origin as the prerendered pages.
  env: {
    SITE_URL: process.env.SITE_URL ?? "",
    CONTACT_EMAIL: process.env.CONTACT_EMAIL ?? "",
  },
  // Two root layouts (VI and EN, ADR 0008) need a global 404.
  experimental: { globalNotFound: true },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
      {
        // File names are not hashed: cache a week, not forever.
        source: "/tour/:file*",
        headers: [{ key: "Cache-Control", value: "public, max-age=604800" }],
      },
    ];
  },
};

export default config;
