"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import clsx from "clsx";
import BlogPostCard from "@/components/blog/BlogPostCard";
import type { BlogPost } from "@/lib/blog-types";

const PILL =
  "rounded-full px-4 py-1.5 text-sm font-medium whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand motion-safe:transition-colors";

/** Category pills and search over the published posts, all client-side (the
 * API returns every published post; this is a small blog). With no filter the
 * first featured post leads, full width. */
export default function BlogList({ posts }: { posts: BlogPost[] }) {
  const [category, setCategory] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const categories = useMemo(
    () =>
      Array.from(new Set(posts.map((p) => p.category).filter((c): c is string => !!c))).sort(),
    [posts],
  );

  const q = query.trim().toLowerCase();
  const filtering = category !== null || q !== "";
  const filtered = posts.filter((p) => {
    if (category && p.category !== category) return false;
    if (!q) return true;
    return [p.title, p.excerpt ?? "", p.category ?? "", ...(p.tags ?? [])]
      .join(" ")
      .toLowerCase()
      .includes(q);
  });
  const featured = filtering ? undefined : filtered.find((p) => p.is_featured);
  const rest = featured ? filtered.filter((p) => p.id !== featured.id) : filtered;

  function clear() {
    setCategory(null);
    setQuery("");
  }

  if (posts.length === 0) {
    return (
      <div className="rounded-2xl border border-line bg-white px-6 py-16 text-center">
        <p className="font-display text-lg font-semibold text-navy">No posts yet</p>
        <p className="mt-1 text-sm text-muted">Check back soon for ESG insights and updates.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        {categories.length > 0 ? (
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
            {[null, ...categories].map((c) => (
              <button
                key={c ?? "all"}
                type="button"
                aria-pressed={category === c}
                onClick={() => setCategory(c)}
                className={clsx(
                  PILL,
                  category === c
                    ? "bg-calc-navy text-white"
                    : "border border-line bg-white text-ink hover:border-calc-blue",
                )}
              >
                {c ?? "All"}
              </button>
            ))}
          </div>
        ) : (
          <span />
        )}

        <div className="relative w-full md:max-w-xs">
          <Search
            className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-muted"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search posts"
            aria-label="Search posts"
            className="h-11 w-full rounded-full border border-field bg-white pr-10 pl-10 text-sm text-ink placeholder:text-muted focus:border-calc-blue focus:ring-2 focus:ring-calc-blue/20 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full p-1 text-muted hover:text-ink"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          ) : null}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-line bg-white px-6 py-16 text-center" aria-live="polite">
          <p className="font-display text-lg font-semibold text-navy">No matching posts</p>
          <p className="mt-1 text-sm text-muted">Try a different search or category.</p>
          <button
            type="button"
            onClick={clear}
            className="mt-4 text-sm font-medium text-calc-blue hover:underline"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <>
          {featured ? <BlogPostCard post={featured} featured /> : null}
          {featured && rest.length > 0 ? (
            <div className="flex items-center gap-4" aria-hidden="true">
              <span className="h-px flex-1 bg-line" />
              <span className="text-[11px] font-semibold tracking-[0.12em] text-muted uppercase">
                Latest articles
              </span>
              <span className="h-px flex-1 bg-line" />
            </div>
          ) : null}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((post) => (
              <BlogPostCard key={post.id} post={post} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
