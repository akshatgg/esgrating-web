import type { ReactNode } from "react";
import Link from "next/link";
import clsx from "clsx";
import { FOCUS_RING } from "./styles";

export type Crumb = { label: string; href?: string };

/** Admin page header: breadcrumb, 24px/600 title, a muted one-liner and
 * right-aligned actions. The last crumb is the current page. */
export default function PageHeader({
  title,
  description,
  crumbs,
  actions,
  badge,
}: {
  title: string;
  /** A status badge beside the title. */
  badge?: ReactNode;
  description?: ReactNode;
  crumbs?: Crumb[];
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {crumbs && crumbs.length > 0 ? (
          <nav aria-label="Breadcrumb" className="mb-1.5">
            <ol className="flex flex-wrap items-center gap-1.5 text-[13px] text-muted">
              {crumbs.map((crumb, i) => (
                <li key={crumb.label} className="flex items-center gap-1.5">
                  {i > 0 ? (
                    <span aria-hidden="true" className="text-slate-300">
                      /
                    </span>
                  ) : null}
                  {crumb.href ? (
                    <Link
                      href={crumb.href}
                      className={clsx("rounded hover:text-ink motion-safe:transition-colors", FOCUS_RING)}
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span aria-current="page" className="text-ink/80">
                      {crumb.label}
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        ) : null}
        {badge ? (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h1 className="text-2xl font-semibold tracking-tight text-ink">{title}</h1>
            {badge}
          </div>
        ) : (
          <h1 className="text-2xl font-semibold tracking-tight text-ink">{title}</h1>
        )}
        {description ? <p className="mt-1 text-sm text-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
