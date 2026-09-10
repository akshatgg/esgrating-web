"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowUpRight,
  FileCheck2,
  FilePlus2,
  FileText,
  Hourglass,
  Search,
  Send,
  Trash2,
} from "lucide-react";
import clsx from "clsx";
import type { EsgSubmission } from "@/lib/types";
import { apiFetch, ApiError } from "@/lib/api";
import { formatDate, formatScore, shortId } from "@/lib/format";
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

const PAGE_SIZE = 50; // esgratings-api app/esg/router_admin.py PAGE_SIZE
const NUM = new Intl.NumberFormat("en-IN");

type ListResponse = {
  items: EsgSubmission[];
  total: number;
  page: number;
  pages: number;
};

function statusLabel(sub: EsgSubmission): string {
  if (sub.analysis_status === "running") return "Analyzing…";
  if (sub.analysis_status === "failed") return "Failed";
  if (sub.status === "report_generated") return "Report generated";
  if (sub.status === "sent") return "Sent";
  return "New";
}

/** Pure network call — never touches React state, so it's safe to call
 * directly from inside a `useEffect` body (see the .then/.catch chain
 * below); only the state-setting happens at the effect callsite. */
function fetchSubmissions(page: number, search: string): Promise<ListResponse> {
  const params = new URLSearchParams({ page: String(page) });
  if (search) params.set("search", search);
  return apiFetch<ListResponse>(`/api/admin/esg/submissions?${params}`);
}

function count(n: number): string {
  return `${NUM.format(n)} submission${n === 1 ? "" : "s"}`;
}

function EsgSubmissionsList() {
  // The console's top-bar search lands here as `?search=…`; seed the box from
  // it, and follow it if the admin searches again while already on this page.
  const urlSearch = useSearchParams().get("search") ?? "";
  const [syncedUrlSearch, setSyncedUrlSearch] = useState(urlSearch);
  const [items, setItems] = useState<EsgSubmission[] | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(0);
  const [searchInput, setSearchInput] = useState(urlSearch);
  const [search, setSearch] = useState(urlSearch.trim());
  if (urlSearch !== syncedUrlSearch) {
    setSyncedUrlSearch(urlSearch);
    setSearchInput(urlSearch);
  }
  const [error, setError] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<EsgSubmission | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const stats = useAdminStats();

  // Debounce the search box so every keystroke doesn't fire a request.
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Re-fetches whenever the page, the (debounced) search term, or
  // `refreshToken` (bumped after a delete) changes.
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

  function openDelete(row: EsgSubmission) {
    setDeleteError(null);
    setDeleteTarget(row);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await apiFetch(`/api/admin/esg/submissions/${deleteTarget._id}`, { method: "DELETE" });
      setDeleteTarget(null);
      setRefreshToken((n) => n + 1);
      stats.refresh();
    } catch (err) {
      setDeleteError(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      setDeleting(false);
    }
  }

  const esg = stats.data?.esg;

  const columns: Column<EsgSubmission>[] = [
    {
      key: "_id",
      header: "ID",
      className: "whitespace-nowrap",
      render: (row) => (
        <span title={row._id} className="font-mono text-xs text-muted">
          {shortId(row._id)}
        </span>
      ),
    },
    {
      key: "created_at",
      header: "Date",
      className: "whitespace-nowrap text-ink/80",
      render: (row) => formatDate(row.created_at),
    },
    { key: "name", header: "Name", className: "min-w-[8rem]" },
    {
      key: "company_name",
      header: "Company",
      className: "min-w-[10rem]",
      render: (row) => (
        <Link
          href={`/admin/esg/${row._id}`}
          className={clsx(
            "rounded font-medium text-ink hover:text-brand motion-safe:transition-colors",
            FOCUS_RING,
          )}
        >
          {row.company_name}
        </Link>
      ),
    },
    { key: "email", header: "Email", className: "text-ink/80" },
    { key: "mobile_number", header: "Mobile", className: "whitespace-nowrap text-ink/80" },
    { key: "report_year", header: "FY", className: "whitespace-nowrap" },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusBadge state={submissionState(row)} label={statusLabel(row)} />,
    },
    {
      key: "final",
      id: "score",
      header: "Score",
      className: "font-semibold",
      render: (row) => formatScore(row.final?.composite_score),
    },
    {
      key: "final",
      id: "grade",
      header: "Grade",
      render: (row) => <GradeChip grade={row.final?.composite_score_performance} />,
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
            href={`/admin/esg/${row._id}`}
            aria-label={`Open submission from ${row.company_name}`}
            title="Open"
            className={ICON_BUTTON}
          >
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <button
            type="button"
            aria-label={`Delete submission from ${row.company_name}`}
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
        crumbs={[{ label: "Dashboard", href: "/admin" }, { label: "ESG Submissions" }]}
        title="ESG Submissions"
        description="Reports uploaded through the ESG calculator, and the ratings built from them."
        actions={
          <Button variant="adminPrimary" href="/admin/esg/new">
            <FilePlus2 className="h-4 w-4" aria-hidden="true" />
            New ESG Assessment
          </Button>
        }
      />

      <StatStrip
        items={[
          {
            label: "Total submissions",
            value: esg ? NUM.format(esg.total) : "—",
            icon: FileText,
            tone: "brand",
          },
          {
            label: "Awaiting analysis",
            value: esg ? NUM.format(esg.new + esg.failed) : "—",
            hint: esg && esg.failed > 0 ? `${NUM.format(esg.failed)} failed` : undefined,
            icon: Hourglass,
            tone: "amber",
          },
          {
            label: "Reports generated",
            value: esg ? NUM.format(esg.reports_generated) : "—",
            icon: FileCheck2,
            tone: "green",
          },
          {
            label: "Sent to clients",
            value: esg ? NUM.format(esg.sent) : "—",
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
            placeholder="Search name, company or email"
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
                  icon={FileText}
                  title="No ESG submissions yet."
                  description="Reports sent through the ESG calculator show up here."
                  action={
                    <Button variant="adminPrimary" href="/admin/esg/new">
                      <FilePlus2 className="h-4 w-4" aria-hidden="true" />
                      New ESG Assessment
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

      <Modal
        open={deleteTarget !== null}
        onClose={() => (deleting ? undefined : setDeleteTarget(null))}
        title="Delete submission"
      >
        <div className="flex flex-col gap-4">
          {deleteError ? <Alert variant="error">{deleteError}</Alert> : null}
          <p className="text-sm text-ink">
            Delete this submission? Its uploaded report and analysis will be permanently removed.
            This cannot be undone.
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

export default function EsgSubmissionsPage() {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <EsgSubmissionsList />
    </Suspense>
  );
}
