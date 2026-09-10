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

/** Detail-page loading placeholder: header, main card and the details rail. */
export function DetailSkeleton() {
  return (
    <div className="flex flex-col gap-5" aria-busy="true">
      <span role="status" className="sr-only">
        Loading…
      </span>
      <div>
        <Bone className="h-3 w-48" />
        <Bone className="mt-3 h-6 w-64 max-w-full" />
      </div>
      <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className={clsx(CARD, "p-5 xl:col-start-2 xl:row-start-1")}>
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="flex gap-3 py-2.5">
              <Bone className="h-4 w-4" />
              <div className="flex-1">
                <Bone className="h-2.5 w-16" />
                <Bone className="mt-2 h-3 w-3/4" />
              </div>
            </div>
          ))}
        </div>
        <div className={clsx(CARD, "flex flex-col gap-3 p-6 xl:col-start-1 xl:row-start-1")}>
          <Bone className="h-10 w-10 rounded-xl" />
          <Bone className="h-4 w-1/3" />
          <Bone className="h-3 w-2/3" />
          <Bone className="h-3 w-1/2" />
        </div>
      </div>
    </div>
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
