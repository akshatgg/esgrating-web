import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { NextConfig } from "next";

const API_URL = process.env.API_URL ?? "http://localhost:8000";
const IS_DEV = process.env.NODE_ENV !== "production";

// Read at build time so the client bundle gets the version string only, not
// the whole package.json.
const APP_VERSION = (
  JSON.parse(readFileSync(join(process.cwd(), "package.json"), "utf8")) as { version: string }
).version;

const blogSlugs = [
  "esg-ratings-future-proof-your-business-today",
  "esg-ratings-future-proof-your-business-today-2",
  "esg-rating-sebi-licensed-brsr",
  "how-social-initiatives-drive-employee-retention-and-customer-loyalty",
];

// PDFs the WordPress site served from its uploads folder; they now live in
// public/docs/.
const legacyPdfs = ["Code-of-Conduct", "ESG-Ratings-Methodology", "Privacy-Confidentiality"];

// Everything is same-origin: next/font self-hosts the fonts, the API goes
// through /api, and html2pdf renders through data:/blob: URLs. In dev,
// Turbopack's HMR needs eval and a websocket.
const CSP = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${IS_DEV ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  `connect-src 'self'${IS_DEV ? " ws: wss:" : ""}`,
  "media-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const SECURITY_HEADERS = [
  { key: "Content-Security-Policy", value: CSP },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  env: { NEXT_PUBLIC_APP_VERSION: APP_VERSION },
  images: { formats: ["image/avif", "image/webp"] },
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
  // A dev convenience: in production nginx/Cloudflare should route /api/*
  // straight to the FastAPI service (see README).
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${API_URL}/api/:path*` }];
  },
  async redirects() {
    return [
      { source: "/digital-agency", destination: "/", permanent: true },
      { source: "/contact-03", destination: "/contact", permanent: true },
      { source: "/job-openings", destination: "/careers/automation-developer", permanent: true },
      { source: "/job/:id", destination: "/careers/automation-developer", permanent: true },
      { source: "/dashboard/:path*", destination: "/admin", permanent: false },
      { source: "/bfsi-calculator/admin/:path*", destination: "/admin/bfsi", permanent: false },
      // The ESG Rating List (and its CSV import) moved under ESG Submissions;
      // any incoming query string is carried over.
      { source: "/admin/ratings", destination: "/admin/esg?source=rating", permanent: false },
      { source: "/admin/ratings/import", destination: "/admin/esg/import", permanent: false },
      ...legacyPdfs.map((name) => ({
        source: `/wp-content/uploads/2025/10/${name}.pdf`,
        destination: `/docs/${name}.pdf`,
        permanent: true,
      })),
      ...blogSlugs.map((s) => ({ source: `/${s}`, destination: `/blogs/${s}`, permanent: true })),
    ];
  },
  experimental: {
    proxyTimeout: 120_000,
    // Dev only, but it has to be here: in dev the /api rewrite above proxies uploads
    // through Next, which truncates a request body at 10MB and then never completes it --
    // a 10.1MB report left the New Assessment button spinning with nothing in the API log.
    // The form accepts 20MB, so this sits above it with room for multipart overhead.
    // Production never hits this: Caddy sends /api/* straight to FastAPI (deploy/Caddyfile).
    proxyClientMaxBodySize: "30mb",
  },
};

export default nextConfig;
