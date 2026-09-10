import type { NextConfig } from "next";

const API_URL = process.env.API_URL ?? "http://localhost:8000";

const blogSlugs = [
  "esg-ratings-future-proof-your-business-today",
  "esg-ratings-future-proof-your-business-today-2",
  "esg-rating-sebi-licensed-brsr",
  "how-social-initiatives-drive-employee-retention-and-customer-loyalty",
];

const nextConfig: NextConfig = {
  output: "standalone",
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
      ...blogSlugs.map((s) => ({ source: `/${s}`, destination: `/blogs/${s}`, permanent: true })),
    ];
  },
  experimental: { proxyTimeout: 120_000 },
};

export default nextConfig;
