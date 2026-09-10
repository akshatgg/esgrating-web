import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import clsx from "clsx";
import IconTile, { type Tone } from "./IconTile";
import { CARD } from "./styles";

export type StatItem = {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon: LucideIcon;
  tone?: Tone;
};

/** Compact row of stats above a list page. */
export default function StatStrip({ items }: { items: StatItem[] }) {
  return (
    <dl
      className={clsx(
        "grid grid-cols-1 gap-3 min-[420px]:grid-cols-2",
        items.length >= 4 ? "xl:grid-cols-4" : "lg:grid-cols-3",
      )}
    >
      {items.map((item) => (
        <div key={item.label} className={clsx(CARD, "flex items-center gap-3 px-4 py-3")}>
          <IconTile icon={item.icon} tone={item.tone} size="sm" />
          <div className="min-w-0">
            <dt className="truncate text-xs text-muted">{item.label}</dt>
            <dd className="text-lg leading-tight font-semibold tabular-nums text-ink">{item.value}</dd>
            {item.hint ? <dd className="truncate text-xs text-muted">{item.hint}</dd> : null}
          </div>
        </div>
      ))}
    </dl>
  );
}
