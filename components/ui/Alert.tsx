import type { ReactNode } from "react";
import { CheckCircle2, AlertTriangle, Info } from "lucide-react";
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
};

export default function Alert({ variant = "info", children, className }: AlertProps) {
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
      <span>{children}</span>
    </div>
  );
}
