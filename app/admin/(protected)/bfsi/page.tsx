"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  FileCheck2,
  FilePlus2,
  Hourglass,
  Landmark,
  Plus,
  ScrollText,
  Search,
  Send,
  Trash2,
  Upload,
} from "lucide-react";
import clsx from "clsx";
import type { BfsiOptions, BfsiSubmission } from "@/lib/types";
import { apiFetch, ApiError } from "@/lib/api";
import { bfsiGrade } from "@/lib/grades";
import { formatUtc, numberFormat, shortId } from "@/lib/format";
import DataTable, { type Column } from "@/components/admin/DataTable";
import PageHeader from "@/components/admin/PageHeader";
import StatStrip from "@/components/admin/StatStrip";
import EmptyState from "@/components/admin/EmptyState";
import ListFooter from "@/components/admin/ListFooter";
import { TableSkeleton } from "@/components/admin/Skeleton";
import { GradeChip, StatusBadge, submissionState } from "@/components/admin/Badge";
import {
  CARD,
  FOCUS_RING,
  ICON_BUTTON,
  ICON_BUTTON_DANGER,
  INPUT,
} from "@/components/admin/styles";
import { useAdminStats } from "@/components/admin/useAdminStats";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Alert from "@/components/ui/Alert";
import AddRecordModal from "./AddRecordModal";

// Port of dashboard/index.php?view=bfsi (bfsi.md §3): 12 columns, 50/page.

const PAGE_SIZE = 50; // esgratings-api app/bfsi/router_admin.py PAGE_SIZE
const NUM = new Intl.NumberFormat("en-IN");

type ListResponse = {
  items: BfsiSubmission[];
  total: number;
  page: number;
  pages: number;
};

/** The dashboard's grade-letter → category fallback map (index.php:807-810). */
const GRADE_CATEGORY: Record<string, string> = {
  "A+": "Outstanding",
  A: "Excellent",
  "B+": "Very Good",
  B: "Good",
  C: "Average",
  D: "Below Average",
};

/** index.php's `$fmt`: 2dp, or an em dash when unset. */
function fmt(v: number | null | undefined): string {
  return typeof v === "number" ? numberFormat(v, 2) : "—";
}

function esgSplit(row: BfsiSubmission): string {
  const has = [row.e_score, row.s_score, row.g_score].some((v) => typeof v === "number");
  return has ? `${fmt(row.e_score)} / ${fmt(row.s_score)} / ${fmt(row.g_score)}` : "—";
}

/** Prefer the score; fall back to the stored grade letter (hand-added or
 * imported rows can carry a grade but no score). */
function category(row: BfsiSubmission): string {
  if (typeof row.overall_score === "number") return bfsiGrade(row.overall_score).label;
  if (row.grade) return GRADE_CATEGORY[row.grade] ?? "—";
  return "—";
}

/** Pure network call — see the ESG list page's matching note. */
function fetchSubmissions(page: number, search: string): Promise<ListResponse> {
  const params = new URLSearchParams({ page: String(page) });
  if (search) params.set("search", search);
  return apiFetch<ListResponse>(`/api/admin/bfsi/submissions?${params}`);
}

function count(n: number): string {
  return `${NUM.format(n)} submission${n === 1 ? "" : "s"}`;
}

export default function BfsiSubmissionsPage() {
  const [items, setItems] = useState<BfsiSubmission[] | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);
  const [options, setOptions] = useState<BfsiOptions | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<BfsiSubmission | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const stats = useAdminStats();

  // Industry labels + the Add New modal's selects.
  useEffect(() => {
    let cancelled = false;
    apiFetch<BfsiOptions>("/api/bfsi/options")
      .then((res) => {
        if (!cancelled) setOptions(res);
      })
      .catch(() => {
        // Non-fatal: the Industry column falls back to the raw key.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Debounce the search box so every keystroke doesn't fire a request.
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    let cancelled = false;
    fetchSubmissions(page, search)
      .then((res) => {
        if (cancelled) return;
        setItems(res.items);
        setTotal(res.total);
        setPage(res.page);
        setPages(res.pages);
        setError(null);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : "Something went wrong.");
      });
    return () => {
      cancelled = true;
    };
  }, [page, search, refreshToken]);

  function reload() {
    setRefreshToken((n) => n + 1);
    stats.refresh();
  }

  function openDelete(row: BfsiSubmission) {
    setDeleteError(null);
    setDeleteTarget(row);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await apiFetch<{ deleted: boolean }>(
        `/api/admin/bfsi/submissions/${deleteTarget._id}`,
        { method: "DELETE" },
      );
      if (res && res.deleted === false) {
        setDeleteError("The submission could not be deleted.");
        return;
      }
      setDeleteTarget(null);
      reload();
    } catch (err) {
      setDeleteError(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      setDeleting(false);
    }
  }

  const bfsi = stats.data?.bfsi;

  const columns: Column<BfsiSubmission>[] = [
    {
      key: "_id",
      header: "ID",
      className: "whitespace-nowrap",
      render: (row) => (
        <code title={row._id} className="font-mono text-xs text-muted">
          …{shortId(row._id)}
        </code>
      ),
    },
    {
      key: "created_at",
      header: "Date",
      className: "whitespace-nowrap text-ink/80",
      // index.php's "Y-m-d H:i:s", with the time on a second, muted line.
      render: (row) => {
        const [date, time] = formatUtc(row.created_at, "Y-m-d H:i:s").split(" ");
        return (
          <>
            {date}
            {time ? <span className="block text-xs text-muted">{time}</span> : null}
          </>
        );
      },
    },
    {
      key: "borrower_name",
      header: "Borrower",
      className: "min-w-[9rem]",
      render: (row) => (
        <Link
          href={`/admin/bfsi/${row._id}`}
          className={clsx(
            "rounded font-medium text-ink hover:text-brand motion-safe:transition-colors",
            FOCUS_RING,
          )}
        >
          {row.borrower_name}
        </Link>
      ),
    },
    {
      key: "industry",
      header: "Industry",
      className: "min-w-[8rem] text-ink/80",
      render: (row) => options?.industries[row.industry]?.label ?? row.industry,
    },
    { key: "loan_type", header: "Loan Type", className: "min-w-[7rem] text-ink/80" },
    {
      key: "loan_amount",
      header: "Amount (₹)",
      className: "whitespace-nowrap",
      render: (row) => `₹${numberFormat(row.loan_amount)}`,
    },
    {
      key: "status",
      header: "Status",
      // PHP parity: the raw stored status ("report_generated"), in its stage colour.
      render: (row) => <StatusBadge state={submissionState(row)} label={row.status ?? "new"} />,
    },
    {
      key: "e_score",
      header: "E / S / G",
      className: "whitespace-nowrap text-ink/80",
      render: esgSplit,
    },
    {
      key: "overall_score",
      header: "Score",
      className: "font-semibold",
      render: (row) => fmt(row.overall_score),
    },
    { key: "grade", header: "Grade", render: (row) => <GradeChip grade={row.grade} /> },
    {
      key: "grade",
      id: "category",
      header: "Category",
      className: "whitespace-nowrap",
      render: category,
    },
    {
      key: "_id",
      id: "action",
      header: "Action",
      className: "text-right",
      sticky: true,
      render: (row) => (
        <div className="flex justify-end gap-1">
          <Link
            href={`/admin/bfsi/${row._id}`}
            aria-label={`Open submission from ${row.borrower_name}`}
            title="Open"
            className={ICON_BUTTON}
          >
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <Link
            href={`/admin/bfsi/${row._id}/one-pager`}
            aria-label={`1-pager for ${row.borrower_name}`}
            title="1-pager"
            className={ICON_BUTTON}
          >
            <ScrollText className="h-4 w-4" aria-hidden="true" />
          </Link>
          <button
            type="button"
            aria-label={`Delete submission from ${row.borrower_name}`}
            title="Delete submission"
            onClick={() => openDelete(row)}
            className={ICON_BUTTON_DANGER}
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        crumbs={[{ label: "Dashboard", href: "/admin" }, { label: "BFSI Submissions" }]}
        title="BFSI Submissions"
        description="Borrower reports from the BFSI calculator, plus records added by hand or imported."
        actions={
          <>
            <Button variant="adminSecondary" onClick={() => setAddOpen(true)}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add New
            </Button>
            <Button variant="adminSecondary" href="/admin/bfsi/import">
              <Upload className="h-4 w-4" aria-hidden="true" />
              Import File
            </Button>
            <Button variant="adminPrimary" href="/admin/bfsi/new">
              <FilePlus2 className="h-4 w-4" aria-hidden="true" />
              New BFSI Assessment
            </Button>
          </>
        }
      />

      <StatStrip
        items={[
          {
            label: "Total submissions",
            value: bfsi ? NUM.format(bfsi.total) : "—",
            icon: Landmark,
            tone: "teal",
          },
          {
            label: "Awaiting analysis",
            value: bfsi ? NUM.format(bfsi.new + bfsi.failed) : "—",
            hint: bfsi && bfsi.failed > 0 ? `${NUM.format(bfsi.failed)} failed` : undefined,
            icon: Hourglass,
            tone: "amber",
          },
          {
            label: "Reports generated",
            value: bfsi ? NUM.format(bfsi.reports_generated) : "—",
            icon: FileCheck2,
            tone: "green",
          },
          {
            label: "Sent to clients",
            value: bfsi ? NUM.format(bfsi.sent) : "—",
            icon: Send,
            tone: "violet",
          },
        ]}
      />

      <div
        className={clsx(
          CARD,
          "flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between",
        )}
      >
        <div className="relative w-full sm:max-w-sm">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted"
            aria-hidden="true"
          />
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search"
            aria-label="Search submissions"
            className={clsx(INPUT, "pl-9")}
          />
        </div>
        {items !== null ? (
          <p className="px-1 text-sm text-muted tabular-nums" aria-live="polite">
            {search
              ? `${NUM.format(total)} ${total === 1 ? "match" : "matches"} for “${search}”`
              : count(total)}
          </p>
        ) : null}
      </div>

      {error ? <Alert variant="error">{error}</Alert> : null}

      {items === null ? (
        error ? null : <TableSkeleton />
      ) : (
        <>
          <DataTable
            appearance="console"
            density="compact"
            columns={columns}
            rows={items}
            rowKey={(row) => row._id}
            empty={
              search ? (
                <EmptyState
                  icon={Search}
                  title="No matches"
                  description={`No submissions match “${search}”.`}
                />
              ) : (
                <EmptyState
                  icon={Landmark}
                  tone="teal"
                  title="No BFSI submissions yet."
                  description="Start an assessment, add a record by hand, or import a CSV."
                  action={
                    <Button variant="adminPrimary" href="/admin/bfsi/new">
                      <FilePlus2 className="h-4 w-4" aria-hidden="true" />
                      New BFSI Assessment
                    </Button>
                  }
                />
              )
            }
          />
          <ListFooter
            page={page}
            pageSize={PAGE_SIZE}
            total={total}
            pages={pages}
            onPageChange={setPage}
          />
        </>
      )}

      <AddRecordModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onCreated={() => {
          setAddOpen(false);
          reload();
        }}
        options={options}
      />

      <Modal
        open={deleteTarget !== null}
        onClose={() => (deleting ? undefined : setDeleteTarget(null))}
        title="Delete submission"
      >
        <div className="flex flex-col gap-4">
          {deleteError ? <Alert variant="error">{deleteError}</Alert> : null}
          {/* Verbatim from dashboard/index.php:826-827 (the confirm() text). */}
          <p className="text-sm font-medium text-ink">Delete this submission?</p>
          <p className="text-sm text-muted">
            Its uploaded report, AI analysis and cached results will be permanently removed. This
            cannot be undone.
          </p>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="adminSecondary"
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button variant="adminDanger" onClick={confirmDelete} disabled={deleting}>
              {deleting ? "Deleting…" : "Delete"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
