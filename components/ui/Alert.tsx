import type { ReactNode } from "react";
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";
import clsx from "clsx";

export type AlertVariant = "success" | "error" | "info";

const VARIANT_CLASSES: Record<AlertVariant, string> = {
  success: "border-grade-a/30 bg-grade-a/10 text-grade-a",
  error: "border-grade-d/30 bg-grade-d/10 text-grade-d",
  info: "border-calc-blue/30 bg-calc-blue/10 text-calc-blue",
};

const VARIANT_ICON: Record<AlertVariant, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: AlertTriangle,
  info: Info,
};

type AlertProps = {
  variant?: AlertVariant;
  children: ReactNode;
  className?: string;
  /** Shows a "Dismiss" button at the right edge. */
  onDismiss?: () => void;
};

export default function Alert({ variant = "info", children, className, onDismiss }: AlertProps) {
  const Icon = VARIANT_ICON[variant];
  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={clsx(
        "flex items-start gap-2 rounded-xl border px-4 py-3 text-sm",
        VARIANT_CLASSES[variant],
        className,
      )}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <span className={onDismiss ? "min-w-0 flex-1" : undefined}>{children}</span>
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          title="Dismiss"
          className="-my-1 -mr-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg hover:bg-current/10 focus-visible:ring-2 focus-visible:ring-current focus-visible:outline-none motion-safe:transition-colors"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}
