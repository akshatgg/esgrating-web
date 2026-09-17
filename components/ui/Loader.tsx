import { Loader2 } from "lucide-react";
import clsx from "clsx";

type LoaderProps = {
  /** Shown under the spinner and announced to screen readers. */
  label?: string;
  className?: string;
};

/** Centered spinner with a label, for anything that is loading. */
export default function Loader({ label = "Loading…", className }: LoaderProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={clsx("flex flex-col items-center justify-center gap-3 text-sm text-muted", className)}
    >
      <Loader2 className="h-8 w-8 text-calc-blue motion-safe:animate-spin" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
