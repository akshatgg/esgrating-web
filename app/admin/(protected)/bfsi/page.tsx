"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Search, Trash2, Upload } from "lucide-react";
import type { BfsiOptions, BfsiSubmission } from "@/lib/types";
import { apiFetch, ApiError } from "@/lib/api";
import { bfsiGrade } from "@/lib/grades";
import { formatUtc, numberFormat, shortId } from "@/lib/format";
import DataTable, { type Column } from "@/components/admin/DataTable";
import Pagination from "@/components/ui/Pagination";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Alert from "@/components/ui/Alert";
import AddRecordModal from "./AddRecordModal";

// Port of dashboard/index.php?view=bfsi (bfsi.md §3): 12 columns, 50/page.

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
      setRefreshToken((n) => n + 1);
    } catch (err) {
      setDeleteError(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      setDeleting(false);
    }
  }

  const columns: Column<BfsiSubmission>[] = [
    {
      key: "_id",
      header: "ID",
      className: "whitespace-nowrap",
      render: (row) => <code title={row._id}>…{shortId(row._id)}</code>,
    },
    {
      key: "created_at",
      header: "Date",
      className: "whitespace-nowrap",
      render: (row) => formatUtc(row.created_at, "Y-m-d H:i:s"),
    },
    { key: "borrower_name", header: "Borrower" },
    {
      key: "industry",
      header: "Industry",
      render: (row) => options?.industries[row.industry]?.label ?? row.industry,
    },
    { key: "loan_type", header: "Loan Type" },
    {
      key: "loan_amount",
      header: "Amount (₹)",
      className: "whitespace-nowrap",
      render: (row) => `₹${numberFormat(row.loan_amount)}`,
    },
    { key: "status", header: "Status", render: (row) => row.status ?? "new" },
    {
      key: "e_score",
      header: "E / S / G",
      className: "whitespace-nowrap",
      render: esgSplit,
    },
    {
      key: "overall_score",
      header: "Score",
      render: (row) => <b>{fmt(row.overall_score)}</b>,
    },
    { key: "grade", header: "Grade", render: (row) => row.grade ?? "—" },
    { key: "grade", id: "category", header: "Category", render: category },
    {
      key: "_id",
      id: "action",
      header: "Action",
      render: (row) => (
        <div className="flex items-center justify-end gap-3 whitespace-nowrap">
          <Link
            href={`/admin/bfsi/${row._id}`}
            className="font-medium text-calc-blue hover:underline"
          >
            Open →
          </Link>
          <Link
            href={`/admin/bfsi/${row._id}/one-pager`}
            className="font-medium text-calc-blue hover:underline"
          >
            1-pager
          </Link>
          <button
            type="button"
            aria-label={`Delete submission from ${row.borrower_name}`}
            title="Delete submission"
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
        <h1 className="text-xl font-semibold text-ink">BFSI Submissions</h1>
        <div className="relative w-full sm:w-72">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
            aria-hidden="true"
          />
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search"
            aria-label="Search submissions"
            className="w-full rounded-full border border-field bg-white py-2 pl-9 pr-4 text-sm text-ink placeholder:text-muted focus:border-calc-blue focus:outline-none focus:ring-2 focus:ring-calc-blue/20"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="calcBlue" onClick={() => setAddOpen(true)} className="px-4 py-2 text-sm">
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add New
        </Button>
        <Button variant="outline" href="/admin/bfsi/import" className="px-4 py-2 text-sm">
          <Upload className="h-4 w-4" aria-hidden="true" />
          Import File
        </Button>
        <Button variant="calcNavy" href="/admin/bfsi/new" className="px-4 py-2 text-sm">
          New BFSI Assessment
        </Button>
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
            empty="No BFSI submissions yet."
          />
          <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
            <p className="text-sm text-muted">
              {total} submission{total === 1 ? "" : "s"}
            </p>
            <Pagination page={page} totalPages={pages} onChange={setPage} />
          </div>
        </>
      )}

      <AddRecordModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onCreated={() => {
          setAddOpen(false);
          setRefreshToken((n) => n + 1);
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
          <p className="text-sm text-ink">
            Its uploaded report, AI analysis and cached results will be permanently removed. This
            cannot be undone.
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
