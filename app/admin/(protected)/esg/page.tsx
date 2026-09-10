"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Search, Trash2 } from "lucide-react";
import type { EsgSubmission } from "@/lib/types";
import { apiFetch, ApiError } from "@/lib/api";
import { formatDate, formatScore, shortId } from "@/lib/format";
import DataTable, { type Column } from "@/components/admin/DataTable";
import Pagination from "@/components/ui/Pagination";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Alert from "@/components/ui/Alert";

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

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await apiFetch(`/api/admin/esg/submissions/${deleteTarget._id}`, { method: "DELETE" });
      setDeleteTarget(null);
      setRefreshToken((n) => n + 1);
    } catch (err) {
      setDeleteError(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      setDeleting(false);
    }
  }

  const columns: Column<EsgSubmission>[] = [
    {
      key: "_id",
      header: "ID",
      render: (row) => <span title={row._id}>{shortId(row._id)}</span>,
    },
    { key: "created_at", header: "Date", render: (row) => formatDate(row.created_at) },
    { key: "name", header: "Name" },
    { key: "company_name", header: "Company" },
    { key: "email", header: "Email" },
    { key: "mobile_number", header: "Mobile" },
    { key: "report_year", header: "FY" },
    { key: "status", header: "Status", render: (row) => statusLabel(row) },
    {
      key: "final",
      id: "score",
      header: "Score",
      render: (row) => formatScore(row.final?.composite_score),
    },
    {
      key: "final",
      id: "grade",
      header: "Grade",
      render: (row) => row.final?.composite_score_performance ?? "—",
    },
    {
      key: "_id",
      id: "action",
      header: "Action",
      render: (row) => (
        <div className="flex items-center justify-end gap-3 whitespace-nowrap">
          <Link
            href={`/admin/esg/${row._id}`}
            className="font-medium text-calc-blue hover:underline"
          >
            Open →
          </Link>
          <button
            type="button"
            aria-label={`Delete submission from ${row.company_name}`}
            onClick={() => setDeleteTarget(row)}
            className="text-muted hover:text-grade-d"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <h1 className="text-xl font-semibold text-ink">ESG Submissions</h1>
        <div className="relative w-full sm:w-72">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
            aria-hidden="true"
          />
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search name, company or email"
            aria-label="Search submissions"
            className="w-full rounded-full border border-field bg-white py-2 pl-9 pr-4 text-sm text-ink placeholder:text-muted focus:border-calc-blue focus:outline-none focus:ring-2 focus:ring-calc-blue/20"
          />
        </div>
      </div>

      {error ? <Alert variant="error">{error}</Alert> : null}

      {items === null ? (
        <div className="rounded-2xl border border-line bg-white px-6 py-12 text-center text-sm text-muted">
          Loading…
        </div>
      ) : (
        <>
          <DataTable
            columns={columns}
            rows={items}
            rowKey={(row) => row._id}
            empty="No ESG submissions yet."
          />
          <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
            <p className="text-sm text-muted">{total} submission{total === 1 ? "" : "s"}</p>
            <Pagination page={page} totalPages={pages} onChange={setPage} />
          </div>
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
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>
              Cancel
            </Button>
            <button
              type="button"
              onClick={confirmDelete}
              disabled={deleting}
              className="inline-flex items-center justify-center gap-2 rounded-[28px] bg-grade-d px-6 py-3 font-medium text-white hover:bg-grade-d/90 disabled:opacity-60"
            >
              {deleting ? "Deleting…" : "Delete"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default function EsgSubmissionsPage() {
  return (
    <Suspense fallback={null}>
      <EsgSubmissionsList />
    </Suspense>
  );
}
