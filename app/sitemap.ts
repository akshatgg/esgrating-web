import type { MetadataRoute } from "next";
import { POSTS } from "@/content/blog";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://esgratings.co.in";

const STATIC_ROUTES = [
  "",
  "/products",
  "/esg-rating",
  "/blogs",
  "/contact",
  "/faq",
  "/policy",
  "/careers/automation-developer",
  "/esg-rating-calculator",
  "/bfsi-calculator",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: new Date(),
  }));

  const postEntries: MetadataRoute.Sitemap = POSTS.map((post) => ({
    url: `${SITE_URL}/blogs/${post.slug}`,
    lastModified: new Date(post.date),
  }));

  return [...staticEntries, ...postEntries];
}
