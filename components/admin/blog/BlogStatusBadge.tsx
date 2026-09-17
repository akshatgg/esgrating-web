import clsx from "clsx";
import type { BlogStatus } from "@/lib/blog-types";

/** "Published" / "Draft" pill, styled like the submission StatusBadge. */
export default function BlogStatusBadge({ status }: { status: BlogStatus }) {
  const published = status === "PUBLISHED";
  return (
    <span
      className={clsx(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset",
        published ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-slate-100 text-slate-700 ring-slate-200",
      )}
    >
      <span
        className={clsx("h-1.5 w-1.5 rounded-full", published ? "bg-emerald-500" : "bg-slate-400")}
        aria-hidden="true"
      />
      {published ? "Published" : "Draft"}
    </span>
  );
}
