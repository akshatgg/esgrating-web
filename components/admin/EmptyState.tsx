import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import clsx from "clsx";
import IconTile, { type Tone } from "./IconTile";

/** Icon + title + one line of direction, for empty lists and cards. */
export default function EmptyState({
  icon,
  tone = "slate",
  title,
  description,
  action,
  compact = false,
}: {
  icon: LucideIcon;
  tone?: Tone;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  compact?: boolean;
}) {
  return (
    <div
      className={clsx(
        "flex flex-col items-center justify-center text-center",
        compact ? "px-5 py-8" : "px-6 py-14",
      )}
    >
      <IconTile icon={icon} tone={tone} className="mb-3" />
      <p className="text-sm font-semibold text-ink">{title}</p>
      {description ? <p className="mt-1 max-w-xs text-sm text-muted">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
