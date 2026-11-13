import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";
const turnstile = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);
const s3Origin = process.env.S3_PUBLIC_URL ? new URL(process.env.S3_PUBLIC_URL).origin : "";

// Next's inline bootstrap scripts need 'unsafe-inline' without per-request
// nonces (which would make every page dynamic). The rest still narrows what
// an injected script could do: no plugins, no framing, no foreign forms.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}${turnstile ? " https://challenges.cloudflare.com" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob:${s3Origin ? ` ${s3Origin}` : ""}`,
  "font-src 'self'",
  `connect-src 'self'${turnstile ? " https://challenges.cloudflare.com" : ""}`,
  `frame-src ${turnstile ? "https://challenges.cloudflare.com" : "'none'"}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
  ...(isDev ? [] : [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }]),
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    // Uploads go through Server Actions: 8 MB PDFs plus multipart overhead.
    serverActions: { bodySizeLimit: "9mb" },
  },
  images: {
    remotePatterns: s3Origin ? [new URL(`${s3Origin}/**`)] : [],
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      { source: "/admin/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }, { key: "Cache-Control", value: "no-store" }] },
    ];
  },
};

export default nextConfig;
