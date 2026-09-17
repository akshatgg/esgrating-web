"use client";

import { useRef } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import { useDialog } from "@/components/ui/useDialog";
import BlogContent from "@/components/blog/BlogContent";
import { formatPostDate, isApiImage } from "@/components/blog/format";

/** Full-screen preview of the unsaved editor state, laid out like the public
 * post page (app/(site)/blogs/[slug]/page.tsx). The byline isn't shown: the
 * API adds it to the published post. */
export default function BlogPreview({
  open,
  onClose,
  title,
  category,
  coverImageUrl,
  content,
  readTimeMinutes,
  publishedAt,
  tags,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  category: string | null;
  coverImageUrl: string | null;
  content: Record<string, unknown> | null;
  readTimeMinutes: number | null;
  publishedAt: string | null;
  tags: string[];
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  useDialog({ open, panelRef, onClose });
  if (!open) return null;

  const meta = [
    formatPostDate(publishedAt ?? new Date().toISOString()),
    readTimeMinutes ? `${readTimeMinutes} min read` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-label="Post preview"
      tabIndex={-1}
      className="fixed inset-0 z-[60] overflow-y-auto bg-white focus:outline-none"
    >
      <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-line bg-white/95 px-4 py-3 backdrop-blur sm:px-6">
        <p className="text-sm text-muted">
          <span className="font-semibold text-ink">Preview</span> — how the post will look on /blogs
        </p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close preview"
          className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-slate-100 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      <article>
        <div className="relative h-[260px] w-full overflow-hidden bg-navy md:h-[380px]">
          {coverImageUrl ? (
            <Image
              src={coverImageUrl}
              alt=""
              fill
              unoptimized={isApiImage(coverImageUrl)}
              sizes="100vw"
              className="object-cover"
            />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-navy/85 via-navy/50 to-navy/30" aria-hidden="true" />
          <div className="container-site relative flex h-full flex-col items-start justify-end gap-3 pb-8 text-white">
            {category ? (
              <span className="rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold tracking-[0.1em] uppercase">
                {category}
              </span>
            ) : null}
            <h1 className="max-w-3xl font-display text-2xl font-semibold md:text-4xl">
              {title || "Untitled post"}
            </h1>
            <p className="text-sm text-white/80">{meta}</p>
          </div>
        </div>
        <div className="container-site py-12 md:py-16">
          <div className="mx-auto max-w-3xl">
            <BlogContent content={content} />
            {tags.length > 0 ? (
              <ul className="mt-10 flex flex-wrap gap-2 border-t border-line pt-6">
                {tags.map((tag) => (
                  <li key={tag} className="rounded-full bg-bg-soft px-3 py-1 text-xs font-medium text-label">
                    {tag}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      </article>
    </div>
  );
}
