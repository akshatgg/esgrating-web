import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Download } from "lucide-react";
import clsx from "clsx";
import { buttonClasses } from "@/components/ui/Button";
import { CARD } from "./styles";

export type DetailRow = { label: string; value: ReactNode; icon: LucideIcon };

/** The detail pages' right rail (docs/sdd/web-task-admin-redesign-brief.md
 * "Detail pages"): a titled card of icon + label + value rows, the status
 * badge in its header, and the original upload as a secondary button. */
export default function DetailRail({
  title,
  badge,
  rows,
  fileHref,
  fileCaption,
  className,
}: {
  title: string;
  badge?: ReactNode;
  rows: DetailRow[];
  /** `…/file` endpoint for the original upload. */
  fileHref: string;
  /** Optional label above the download button (BFSI's "Uploaded Report"). */
  fileCaption?: string;
  className?: string;
}) {
  return (
    <aside aria-labelledby="detail-rail-title" className={clsx(CARD, "min-w-0", className)}>
      <header className="flex items-center justify-between gap-3 px-5 pt-4 pb-3">
        <h2 id="detail-rail-title" className="text-[15px] font-semibold text-ink">
          {title}
        </h2>
        {badge}
      </header>
      <dl className="border-t border-line px-5 py-2">
        {rows.map(({ label, value, icon: Icon }) => (
          <div key={label} className="flex items-start gap-3 py-2.5">
            <Icon
              className="mt-0.5 h-4 w-4 shrink-0 text-slate-400"
              strokeWidth={1.9}
              aria-hidden="true"
            />
            <div className="min-w-0 flex-1">
              <dt className="text-xs text-muted">{label}</dt>
              <dd className="text-sm font-medium break-words text-ink">{value || "—"}</dd>
            </div>
          </div>
        ))}
      </dl>
      <div className="border-t border-line px-5 py-4">
        {fileCaption ? <p className="mb-2 text-xs text-muted">{fileCaption}</p> : null}
        <a href={fileHref} className={buttonClasses("adminSecondary", "md", "w-full")}>
          <Download className="h-4 w-4" aria-hidden="true" />
          Download original file
        </a>
      </div>
    </aside>
  );
}
