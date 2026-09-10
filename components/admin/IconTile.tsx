import type { LucideIcon } from "lucide-react";
import clsx from "clsx";

export type Tone = "brand" | "teal" | "green" | "amber" | "violet" | "red" | "slate";

const TONES: Record<Tone, string> = {
  brand: "bg-brand/8 text-brand",
  teal: "bg-teal-500/10 text-teal-600",
  green: "bg-emerald-500/10 text-emerald-600",
  amber: "bg-amber-500/12 text-amber-600",
  violet: "bg-violet-500/10 text-violet-600",
  red: "bg-red-500/10 text-red-600",
  slate: "bg-slate-500/10 text-slate-600",
};

/** Tinted rounded square holding an icon — stat cards, list rows, empty states. */
export default function IconTile({
  icon: Icon,
  tone = "brand",
  size = "md",
  className,
}: {
  icon: LucideIcon;
  tone?: Tone;
  size?: "sm" | "md";
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={clsx(
        "grid shrink-0 place-items-center rounded-xl",
        size === "sm" ? "h-9 w-9" : "h-10 w-10",
        TONES[tone],
        className,
      )}
    >
      <Icon className={size === "sm" ? "h-[18px] w-[18px]" : "h-5 w-5"} strokeWidth={1.75} />
    </span>
  );
}
