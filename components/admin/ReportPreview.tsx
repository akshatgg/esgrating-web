import type { ReactNode } from "react";
import clsx from "clsx";
import { CARD } from "./styles";

/** The card a finished report sits in on the detail pages. The report keeps
 * its fixed sheet width and scrolls sideways inside its own wrapper when the
 * column is narrower. */
export default function ReportPreview({
  caption,
  children,
}: {
  caption?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby="report-preview-title" className={clsx(CARD, "min-w-0 overflow-hidden")}>
      <header className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 px-5 pt-4 pb-3">
        <h2 id="report-preview-title" className="text-[15px] font-semibold text-ink">
          Report preview
        </h2>
        {caption ? <p className="text-[13px] text-muted">{caption}</p> : null}
      </header>
      <div className="border-t border-line bg-slate-50/80">{children}</div>
    </section>
  );
}
