import clsx from "clsx";
import { CARD } from "./styles";

/** One shimmer block of a loading skeleton. */
export function Bone({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={clsx("block rounded-md bg-slate-200/70 motion-safe:animate-pulse", className)}
    />
  );
}

/** Table-shaped loading placeholder for admin lists. */
export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className={clsx(CARD, "px-4 py-3")} aria-busy="true">
      <span role="status" className="sr-only">
        Loading…
      </span>
      <Bone className="my-2 h-3 w-1/3" />
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-4 border-t border-line py-4">
          <Bone className="h-3 w-8" />
          <Bone className="h-3 flex-1" />
          <Bone className="hidden h-3 w-24 sm:block" />
          <Bone className="h-5 w-10" />
        </div>
      ))}
    </div>
  );
}
