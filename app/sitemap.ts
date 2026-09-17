import type { MetadataRoute } from "next";
import { getPublishedPosts } from "@/lib/server-blog-api";

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

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: new Date(),
  }));

  const posts = await getPublishedPosts();
  const postEntries: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${SITE_URL}/blogs/${post.slug}`,
    lastModified: new Date(post.updated_at ?? post.published_at ?? post.created_at),
  }));

  return [...staticEntries, ...postEntries];
}
