"use client";

import Pagination from "@/components/ui/Pagination";

const NUM = new Intl.NumberFormat("en-IN");

/** "Showing 1–50 of N" plus page controls, under an admin list. */
export default function ListFooter({
  page,
  pageSize,
  total,
  pages,
  onPageChange,
}: {
  page: number;
  pageSize: number;
  total: number;
  pages: number;
  onPageChange: (page: number) => void;
}) {
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  return (
    <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
      <p className="text-sm text-muted tabular-nums">
        Showing {NUM.format(from)}–{NUM.format(to)} of {NUM.format(total)}
      </p>
      <Pagination page={page} totalPages={pages} onChange={onPageChange} />
    </div>
  );
}
