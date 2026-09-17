// Server Component reads of the public blog (esgratings-api app/blog/router_public.py).
// Plain fetches, not `serverFetch`: these endpoints need no session, and not
// reading cookies keeps the pages that use them (home, /blogs, the sitemap)
// cacheable. A published change shows up within REVALIDATE_SECONDS.
//
// Never throw: an unreachable API renders an empty blog rather than a 500, and a
// missing post is `null` so the page can call notFound().
import "server-only";
import type { BlogPost } from "./blog-types";

const API_URL = process.env.API_URL ?? "http://localhost:8000";
const REVALIDATE_SECONDS = 60;

async function getJson<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_URL}${path}`, { next: { revalidate: REVALIDATE_SECONDS } });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function getPublishedPosts(): Promise<BlogPost[]> {
  return (await getJson<BlogPost[]>("/api/blog")) ?? [];
}

export function getPublishedPost(slug: string): Promise<BlogPost | null> {
  return getJson<BlogPost>(`/api/blog/${encodeURIComponent(slug)}`);
}

export async function getRelatedPosts(slug: string): Promise<BlogPost[]> {
  return (await getJson<BlogPost[]>(`/api/blog/${encodeURIComponent(slug)}/related`)) ?? [];
}
