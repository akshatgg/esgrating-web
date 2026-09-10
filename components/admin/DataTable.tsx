import type { ReactNode } from "react";
import clsx from "clsx";

export type Column<T> = {
  key: keyof T & string;
  header: string;
  render?: (row: T) => ReactNode;
  className?: string;
  /** Overrides `key` as the React key for this column, for the (rare) case
   * where two columns render different things off the same field — e.g. a
   * submission's "Score" and "Grade" columns both come from `final`. */
  id?: string;
};

type DataTableProps<T> = {
  columns: Column<T>[];
  rows: T[];
  empty: ReactNode;
  rowKey?: (row: T, index: number) => string | number;
};

function cell<T>(row: T, column: Column<T>): ReactNode {
  if (column.render) return column.render(row);
  const value = row[column.key];
  return value === null || value === undefined ? "" : String(value);
}

/** A table from `md` up, stacked label/value cards below — shared by the
 * admin submissions, ratings and messages lists. */
export default function DataTable<T>({ columns, rows, empty, rowKey }: DataTableProps<T>) {
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-line bg-white px-6 py-12 text-center text-sm text-muted">
        {empty}
      </div>
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
