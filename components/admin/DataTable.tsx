import type { ReactNode } from "react";
import clsx from "clsx";
import { CARD } from "./styles";

export type Column<T> = {
  key: keyof T & string;
  header: string;
  render?: (row: T) => ReactNode;
  className?: string;
  /** Overrides `key` as the React key for this column, for the (rare) case
   * where two columns render different things off the same field — e.g. a
   * submission's "Score" and "Grade" columns both come from `final`. */
  id?: string;
  /** Console tables: pin this column to the right edge while the table
   * scrolls sideways — for row actions on wide tables. */
  sticky?: boolean;
  /** Console tables: let a long header wrap onto two lines instead of
   * widening the column. */
  wrapHeader?: boolean;
};

type DataTableProps<T> = {
  columns: Column<T>[];
  rows: T[];
  empty: ReactNode;
  rowKey?: (row: T, index: number) => string | number;
  /** "classic" is the original look; "console" is the superadmin console
   * table: white rounded-xl card, sticky 11px uppercase header, 52px rows. */
  appearance?: "classic" | "console";
  /** Console tables: "compact" trims cell padding for 10+ column lists. */
  density?: "default" | "compact";
};

/** Opaque backgrounds for a pinned column, so scrolled cells don't show
 * through; the inset shadow is its left hairline. #fafbfd is slate-50/70
 * over white, the row hover colour. */
const STICKY_TH = "sticky right-0 z-[2] bg-slate-50 shadow-[inset_1px_0_0_#e3e9f2]";
const STICKY_TD =
  "sticky right-0 bg-white shadow-[inset_1px_0_0_#e3e9f2] group-hover:bg-[#fafbfd] motion-safe:transition-colors";

function cell<T>(row: T, column: Column<T>): ReactNode {
  if (column.render) return column.render(row);
  const value = row[column.key];
  return value === null || value === undefined ? "" : String(value);
}

/** A table from `md` up, stacked label/value cards below — shared by the
 * admin submissions, ratings and messages lists. */
export default function DataTable<T>({
  columns,
  rows,
  empty,
  rowKey,
  appearance = "classic",
  density = "default",
}: DataTableProps<T>) {
  const console = appearance === "console";
  const cellX = density === "compact" ? "px-3" : "px-4";

  if (rows.length === 0) {
    return console ? (
      <div className={CARD}>{empty}</div>
    ) : (
      <div className="rounded-2xl border border-line bg-white px-6 py-12 text-center text-sm text-muted">
        {empty}
      </div>
    );
  }

  if (console) {
    return (
      <>
        <div
          className={clsx(
            CARD,
            "hidden overflow-x-auto rounded-xl md:block",
          )}
        >
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 z-[1]">
              <tr className="bg-slate-50/90">
                {columns.map((column) => (
                  <th
                    key={column.id ?? column.key}
                    scope="col"
                    className={clsx(
                      "h-10 border-b border-line text-[11px] font-semibold tracking-[0.06em] text-muted uppercase",
                      column.wrapHeader ? "py-1 leading-tight" : "whitespace-nowrap",
                      cellX,
                      column.sticky && STICKY_TH,
                      column.className,
                    )}
                  >
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr
                  key={rowKey ? rowKey(row, i) : i}
                  className="group h-[52px] border-b border-line last:border-0 hover:bg-slate-50/70 motion-safe:transition-colors"
                >
                  {columns.map((column) => (
                    <td
                      key={column.id ?? column.key}
                      className={clsx(
                        "py-2 text-ink tabular-nums",
                        cellX,
                        column.sticky && STICKY_TD,
                        column.className,
                      )}
                    >
                      {cell(row, column)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <ul className="flex flex-col gap-3 md:hidden">
          {rows.map((row, i) => (
            <li key={rowKey ? rowKey(row, i) : i} className={clsx(CARD, "rounded-xl px-4 py-2")}>
              <dl>
                {columns.map((column) => (
                  <div
                    key={column.id ?? column.key}
                    className="flex items-start justify-between gap-4 border-b border-line py-2 text-sm last:border-0"
                  >
                    <dt className="shrink-0 text-xs font-medium tracking-wide text-muted uppercase">
                      {column.header}
                    </dt>
                    <dd className="min-w-0 text-right break-words text-ink">{cell(row, column)}</dd>
                  </div>
                ))}
              </dl>
            </li>
          ))}
        </ul>
      </>
    );
  }

  return (
    <>
      <div className="hidden overflow-x-auto rounded-2xl border border-line bg-white md:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-line bg-bg-soft text-xs font-semibold uppercase tracking-wide text-muted">
              {columns.map((column) => (
                <th
                  key={column.id ?? column.key}
                  scope="col"
                  className={clsx("px-4 py-3", column.className)}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={rowKey ? rowKey(row, i) : i}
                className="border-b border-line last:border-0 hover:bg-bg-soft"
              >
                {columns.map((column) => (
                  <td key={column.id ?? column.key} className={clsx("px-4 py-3 text-ink", column.className)}>
                    {cell(row, column)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 md:hidden">
        {rows.map((row, i) => (
          <div
            key={rowKey ? rowKey(row, i) : i}
            className="rounded-xl border border-line bg-white p-4 shadow-sm"
          >
            {columns.map((column) => (
              <div
                key={column.id ?? column.key}
                className="flex items-start justify-between gap-3 border-b border-line py-2 text-sm last:border-0"
              >
                <span className="shrink-0 font-medium text-muted">{column.header}</span>
                <span className="text-right text-ink">{cell(row, column)}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  );
}
