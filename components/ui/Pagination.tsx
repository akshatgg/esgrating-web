"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import clsx from "clsx";

type PaginationProps = {
  page: number; // 1-based
  totalPages: number;
  onChange: (page: number) => void;
  className?: string;
};

/** Numbered pagination with prev/next. Collapses to a window around the
 * current page (plus first/last) so it never overflows on mobile. */
export default function Pagination({ page, totalPages, onChange, className }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = pageWindow(page, totalPages);

  return (
    <nav aria-label="Pagination" className={clsx("flex items-center justify-center gap-1", className)}>
      <button
        type="button"
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={page === 1}
        aria-label="Previous page"
        className="flex h-9 w-9 items-center justify-center rounded-full text-ink hover:bg-bg-soft disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
      </button>

      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`ellipsis-${i}`} className="px-2 text-muted">
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            aria-current={p === page ? "page" : undefined}
            className={clsx(
              "flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium",
              p === page ? "bg-calc-blue text-white" : "text-ink hover:bg-bg-soft",
            )}
          >
            {p}
          </button>
        ),
      )}

      <button
        type="button"
        onClick={() => onChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        aria-label="Next page"
        className="flex h-9 w-9 items-center justify-center rounded-full text-ink hover:bg-bg-soft disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </button>
    </nav>
  );
}

function pageWindow(page: number, totalPages: number): (number | "…")[] {
  const delta = 1;
  const range: (number | "…")[] = [];
  const start = Math.max(2, page - delta);
  const end = Math.min(totalPages - 1, page + delta);

  range.push(1);
  if (start > 2) range.push("…");
  for (let i = start; i <= end; i++) range.push(i);
  if (end < totalPages - 1) range.push("…");
  if (totalPages > 1) range.push(totalPages);

  return range;
}
