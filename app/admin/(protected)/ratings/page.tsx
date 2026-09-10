"use client";

import { useEffect, useState } from "react";
import { Award, BarChart3, Building2, Gauge, Pencil, Plus, Search, Trash2, Upload } from "lucide-react";
import clsx from "clsx";
import type { Paged, RatingRow } from "@/lib/types";
import { apiFetch, ApiError } from "@/lib/api";
import { formatDmy } from "@/lib/format";
import DataTable, { type Column } from "@/components/admin/DataTable";
import PageHeader from "@/components/admin/PageHeader";
import StatStrip from "@/components/admin/StatStrip";
import EmptyState from "@/components/admin/EmptyState";
import ListFooter from "@/components/admin/ListFooter";
import { TableSkeleton } from "@/components/admin/Skeleton";
import { GradeChip } from "@/components/admin/Badge";
import { CARD, ICON_BUTTON, ICON_BUTTON_DANGER, INPUT } from "@/components/admin/styles";
import { useAdminStats } from "@/components/admin/useAdminStats";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Alert from "@/components/ui/Alert";
import RatingModal from "./RatingModal";

// ESG Rating List — the table behind the public /esg-rating page. Port of
// esgratings/site/dashboard/index.php's default view (docs/analysis/esg.md B3):
// search across all six fields, 50 per page newest first, SN / Company Name /
// Sector / ESG Rating / Date of Rating (d-m-y) / Grade / Category / Action,
// Add New + Edit in one modal, Delete behind a confirm, Import File.

const PAGE_SIZE = 50;
const NUM = new Intl.NumberFormat("en-IN");

type Row = RatingRow & { sn: number };

function fetchRatings(page: number, search: string): Promise<Paged<RatingRow>> {
  const params = new URLSearchParams({ page: String(page) });
  if (search) params.set("search", search);
  return apiFetch<Paged<RatingRow>>(`/api/admin/ratings?${params}`);
}

/** PHP echoed the DECIMAL(5,1) column, so 75 shows as "75.0". */
function formatRating(value: number | null | undefined): string {
  return typeof value === "number" && Number.isFinite(value) ? value.toFixed(1) : "";
}

export default function RatingsPage() {
  const [items, setItems] = useState<RatingRow[] | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  // `row: null` = Add New; the modal mounts fresh on every open.
  const [editor, setEditor] = useState<{ row: RatingRow | null } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RatingRow | null>(null);
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

  useEffect(() => {
    let cancelled = false;
    fetchRatings(page, search)
      .then((res) => {
        if (cancelled) return;
        // Deleting the last row of the last page: step back a page.
        if (res.items.length === 0 && res.page > 1 && res.total > 0) {
          setPage(Math.max(1, res.pages));
          return;
        }
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

  function openEditor(row: RatingRow | null) {
    setNotice(null);
    setEditor({ row });
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await apiFetch(`/api/admin/ratings/${deleteTarget.s_no}`, { method: "DELETE" });
      setDeleteTarget(null);
      setNotice("Entry deleted.");
      reload();
    } catch (err) {
      setDeleteError(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      setDeleting(false);
    }
  }

  const ratings = stats.data?.ratings;
  const topGrade = ratings
    ? Object.entries(ratings.by_grade).reduce<[string, number]>(
        (best, cur) => (cur[1] > best[1] ? cur : best),
        ["", 0],
      )
    : null;

  const rows: Row[] = (items ?? []).map((r, i) => ({ ...r, sn: (page - 1) * PAGE_SIZE + i + 1 }));

  const columns: Column<Row>[] = [
    { key: "sn", header: "SN", className: "w-14 text-muted" },
    { key: "company_name", header: "Company Name", className: "min-w-[14rem] font-medium" },
    { key: "sector", header: "Sector", className: "min-w-[11rem] text-ink/80" },
    { key: "esg_rating", header: "ESG Rating", render: (r) => formatRating(r.esg_rating) },
    {
      key: "date_of_rating",
      header: "Date of Rating",
      className: "whitespace-nowrap",
      render: (r) => formatDmy(r.date_of_rating),
    },
    { key: "grade", header: "Grade", render: (r) => <GradeChip grade={r.grade} /> },
    { key: "category", header: "Category", className: "whitespace-nowrap" },
    {
      key: "s_no",
      id: "action",
      header: "Action",
      className: "text-right",
      render: (r) => (
        <div className="flex justify-end gap-1">
          <button
            type="button"
            onClick={() => openEditor(r)}
            aria-label={`Edit ${r.company_name}`}
            title="Edit"
            className={ICON_BUTTON}
          >
            <Pencil className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => {
              setNotice(null);
              setDeleteError(null);
              setDeleteTarget(r);
            }}
            aria-label={`Delete ${r.company_name}`}
            title="Delete"
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
        crumbs={[{ label: "Dashboard", href: "/admin" }, { label: "ESG Rating List" }]}
        title="ESG Rating List"
        description="The companies and ratings shown on the public ESG Rating page."
        actions={
          <>
            <Button variant="adminSecondary" href="/admin/ratings/import">
              <Upload className="h-4 w-4" aria-hidden="true" />
              Import File
            </Button>
            <Button variant="adminPrimary" onClick={() => openEditor(null)}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add New
            </Button>
          </>
        }
      />

      <StatStrip
        items={[
          {
            label: "Companies rated",
            value: ratings ? NUM.format(ratings.total) : "—",
            icon: Building2,
            tone: "brand",
          },
          {
            label: "Average rating",
            value: ratings ? ratings.average.toFixed(1) : "—",
            icon: Gauge,
            tone: "teal",
          },
          {
            label: "Graded A+ or A",
            value: ratings ? NUM.format(ratings.by_grade["A+"] + ratings.by_grade.A) : "—",
            icon: Award,
            tone: "green",
          },
          {
            label: "Most common grade",
            value: topGrade && topGrade[1] > 0 ? topGrade[0] : "—",
            hint: topGrade && topGrade[1] > 0 ? count(topGrade[1]) : undefined,
            icon: BarChart3,
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
            aria-label="Search ratings"
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

      {notice ? <Alert variant="success">{notice}</Alert> : null}
      {error ? <Alert variant="error">{error}</Alert> : null}

      {items === null ? (
        error ? null : <TableSkeleton />
      ) : (
        <>
          <DataTable
            appearance="console"
            columns={columns}
            rows={rows}
            rowKey={(r) => r.s_no}
            empty={
              search ? (
                <EmptyState
                  icon={Search}
                  title="No matches"
                  description={`No companies match “${search}”.`}
                />
              ) : (
                <EmptyState
                  icon={BarChart3}
                  title="No ratings yet"
                  description="Add a company or import a CSV to fill the ESG Rating List."
                  action={
                    <Button variant="adminPrimary" onClick={() => openEditor(null)}>
                      <Plus className="h-4 w-4" aria-hidden="true" />
                      Add New
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

      {editor ? (
        <RatingModal
          row={editor.row}
          onClose={() => setEditor(null)}
          onSaved={() => {
            setNotice(editor.row ? "Changes saved." : "Entry added.");
            setEditor(null);
            reload();
          }}
        />
      ) : null}

      <Modal
        open={deleteTarget !== null}
        onClose={() => (deleting ? undefined : setDeleteTarget(null))}
        title="Delete entry"
      >
        <div className="flex flex-col gap-4">
          {deleteError ? <Alert variant="error">{deleteError}</Alert> : null}
          {/* Verbatim confirm() text from dashboard/index.php:757. */}
          <p className="text-sm font-medium text-ink">Are you sure you want to delete?</p>
          {deleteTarget ? (
            <p className="text-sm text-muted">
              {deleteTarget.company_name} will be removed from the ESG Rating List and the public
              ESG Rating page.
            </p>
          ) : null}
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

function count(n: number): string {
  return `${NUM.format(n)} ${n === 1 ? "company" : "companies"}`;
}
