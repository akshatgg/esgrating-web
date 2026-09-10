"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowUpRight,
  BarChart3,
  Building2,
  FileDown,
  FilePlus2,
  FileText,
  Gauge,
  Layers,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import clsx from "clsx";
import type { EsgListItem, Paged, RatingRow } from "@/lib/types";
import { apiFetch, ApiError } from "@/lib/api";
import { formatDmyFull } from "@/lib/format";
import DataTable, { type Column } from "@/components/admin/DataTable";
import PageHeader from "@/components/admin/PageHeader";
import StatStrip from "@/components/admin/StatStrip";
import EmptyState from "@/components/admin/EmptyState";
import ListFooter from "@/components/admin/ListFooter";
import { TableSkeleton } from "@/components/admin/Skeleton";
import { GradeChip, SourceBadge, StatusBadge, submissionState } from "@/components/admin/Badge";
import {
  CARD,
  FOCUS_RING,
  ICON_BUTTON,
  ICON_BUTTON_DANGER,
  INPUT,
} from "@/components/admin/styles";
import { useAdminStats } from "@/components/admin/useAdminStats";
import { useEsgOnePagerPdf } from "@/components/admin/useEsgOnePagerPdf";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Alert from "@/components/ui/Alert";
import RatingModal, { ratingRowFromItem } from "./RatingModal";
import RatingDeleteModal from "./RatingDeleteModal";

// ESG Submissions: the ESG calculator's submissions and the ESG Rating List's
// rated companies in one list (docs/sdd/web-task-esg-merge-brief.md), from
// GET /api/admin/esg/combined — 50 per page, newest first. `?source=` and
// `?search=` live in the URL, so the top-bar search, the Dashboard card and the
// old /admin/ratings link all land on the right view.

const PAGE_SIZE = 50; // esgratings-api app/esg/combined.py PAGE_SIZE
const NUM = new Intl.NumberFormat("en-IN");

type Source = "all" | "calculator" | "rating";

const FILTERS: { value: Source; label: string }[] = [
  { value: "all", label: "All" },
  { value: "calculator", label: "Calculator" },
  { value: "rating", label: "Rating list" },
];

function parseSource(value: string | null): Source {
  return value === "calculator" || value === "rating" ? value : "all";
}

/** Same labels as the calculator list's status column had. */
function statusLabel(status: EsgListItem["status"]): string {
  if (status === "running") return "Analyzing…";
  if (status === "failed") return "Failed";
  if (status === "report_generated") return "Report generated";
  if (status === "sent") return "Sent";
  return "New";
}

function StatusCell({ row }: { row: EsgListItem }) {
  if (row.status === "rated") return <StatusBadge state="generated" label="Rated" />;
  // The combined feed already folds analysis_status into `status`.
  const state = submissionState({ status: row.status, analysis_status: row.status });
  return <StatusBadge state={state} label={statusLabel(row.status)} />;
}

function reportHref(row: Pick<EsgListItem, "source" | "id">): string {
  return row.source === "calculator" ? `/admin/esg/${row.id}` : `/admin/esg/rated/${row.id}`;
}

/** A calculator row has a report to print once its analysis has produced a score. */
function hasReport(row: EsgListItem): boolean {
  return row.source === "rating" || (row.rating !== null && row.status !== "running");
}

/** Pure network call — only the effects' `.then/.catch` set state. */
function fetchCombined(page: number, source: Source, search: string): Promise<Paged<EsgListItem>> {
  const params = new URLSearchParams({ page: String(page), source });
  if (search) params.set("search", search);
  return apiFetch<Paged<EsgListItem>>(`/api/admin/esg/combined?${params}`);
}

function countEntries(n: number): string {
  return `${NUM.format(n)} ${n === 1 ? "entry" : "entries"}`;
}

type Counts = { search: string; calculator: number; rating: number };

function EsgList() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const source = parseSource(params.get("source"));
  const urlSearch = params.get("search") ?? "";
  const search = urlSearch.trim();

  // The box follows the URL when it changes from outside (the top-bar search,
  // Back/Forward), but not while its own debounced value is catching up.
  const [searchInput, setSearchInput] = useState(urlSearch);
  const [syncedUrlSearch, setSyncedUrlSearch] = useState(urlSearch);
  if (urlSearch !== syncedUrlSearch) {
    setSyncedUrlSearch(urlSearch);
    if (urlSearch.trim() !== searchInput.trim()) setSearchInput(urlSearch);
  }

  // Back to page 1 whenever the filter or the search changes.
  const [page, setPage] = useState(1);
  const filterKey = `${source}|${search}`;
  const [pageFilterKey, setPageFilterKey] = useState(filterKey);
  if (filterKey !== pageFilterKey) {
    setPageFilterKey(filterKey);
    setPage(1);
  }

  const [items, setItems] = useState<EsgListItem[] | null>(null);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [counts, setCounts] = useState<Counts | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  // `row: null` = Add rated company; the modal mounts fresh on every open.
  const [editor, setEditor] = useState<{ row: RatingRow | null } | null>(null);
  const [ratingDelete, setRatingDelete] = useState<EsgListItem | null>(null);
  const [calcDelete, setCalcDelete] = useState<EsgListItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const stats = useAdminStats();
  const pdf = useEsgOnePagerPdf();

  const replaceParams = useCallback(
    (changes: Record<string, string | null>) => {
      const next = new URLSearchParams(params.toString());
      for (const [key, value] of Object.entries(changes)) {
        if (value) next.set(key, value);
        else next.delete(key);
      }
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [params, pathname, router],
  );

  // Debounce the search box into `?search=` so every keystroke doesn't fire a request.
  useEffect(() => {
    const t = setTimeout(() => {
      const value = searchInput.trim();
      if (value !== search) replaceParams({ search: value || null });
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput, search, replaceParams]);

  const requestKey = `${source}|${search}|${page}|${refreshToken}`;

  useEffect(() => {
    let cancelled = false;
    fetchCombined(page, source, search)
      .then((res) => {
        if (cancelled) return;
        // Deleting the last row of the last page: step back a page.
        if (res.items.length === 0 && res.page > 1 && res.total > 0) {
          setPage(Math.max(1, res.pages));
          return;
        }
        setItems(res.items);
        setTotal(res.total);
        setPages(res.pages);
        setLoadedKey(`${source}|${search}|${res.page}|${refreshToken}`);
        setError(null);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : "Something went wrong.");
      });
    return () => {
      cancelled = true;
    };
  }, [page, source, search, refreshToken]);

  // Per-filter counts for the chips, under the current search.
  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchCombined(1, "calculator", search), fetchCombined(1, "rating", search)])
      .then(([calculator, rating]) => {
        if (!cancelled) setCounts({ search, calculator: calculator.total, rating: rating.total });
      })
      .catch(() => {
        // Non-fatal: the chips just show no count.
      });
    return () => {
      cancelled = true;
    };
  }, [search, refreshToken]);

  function reload() {
    setRefreshToken((n) => n + 1);
    stats.refresh();
  }

  function openEditor(row: RatingRow | null) {
    setNotice(null);
    setEditor({ row });
  }

  async function confirmCalcDelete() {
    if (!calcDelete) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await apiFetch(`/api/admin/esg/submissions/${calcDelete.id}`, { method: "DELETE" });
      setCalcDelete(null);
      reload();
    } catch (err) {
      setDeleteError(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      setDeleting(false);
    }
  }

  const esg = stats.data?.esg;
  const ratings = stats.data?.ratings;
  const liveCounts = counts && counts.search === search ? counts : null;
  const chipCount = (value: Source): number | null => {
    if (!liveCounts) return null;
    return value === "all" ? liveCounts.calculator + liveCounts.rating : liveCounts[value];
  };
  const stale = items !== null && loadedKey !== requestKey;

  const columns: Column<EsgListItem>[] = [
    {
      key: "company",
      header: "Company",
      className: "min-w-[13rem]",
      render: (row) => (
        <div className="min-w-0">
          <Link
            href={reportHref(row)}
            className={clsx(
              "rounded font-semibold text-ink hover:text-brand motion-safe:transition-colors",
              FOCUS_RING,
            )}
          >
            {row.company}
          </Link>
          {row.contact ? (
            <p className="text-xs break-words text-muted">
              {[row.contact.name, row.contact.email].filter(Boolean).join(" · ")}
            </p>
          ) : null}
        </div>
      ),
    },
    {
      key: "sector",
      header: "Sector",
      className: "min-w-[10rem] text-ink/80",
      render: (row) => row.sector || "—",
    },
    {
      key: "rating",
      header: "ESG Rating",
      className: "whitespace-nowrap font-semibold tabular-nums",
      render: (row) => (typeof row.rating === "number" ? row.rating.toFixed(1) : "—"),
    },
    { key: "grade", header: "Grade", render: (row) => <GradeChip grade={row.grade} /> },
    {
      key: "category",
      header: "Category",
      className: "whitespace-nowrap",
      render: (row) => row.category || "—",
    },
    {
      key: "date",
      header: "Date",
      className: "whitespace-nowrap text-ink/80",
      render: (row) => formatDmyFull(row.date),
    },
    { key: "source", header: "Source", render: (row) => <SourceBadge source={row.source} /> },
    { key: "status", header: "Status", render: (row) => <StatusCell row={row} /> },
    {
      key: "id",
      id: "actions",
      header: "Actions",
      className: "text-right",
      sticky: true,
      render: (row) => {
        const company = row.company ?? "";
        const ready = hasReport(row);
        const busy = pdf.busyId === row.id;
        return (
          <div className="flex justify-end gap-1">
            <Link
              href={reportHref(row)}
              aria-label={`View report for ${company}`}
              title="View report"
              className={ICON_BUTTON}
            >
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <button
              type="button"
              onClick={() => {
                if (ready) void pdf.download(row);
              }}
              aria-disabled={!ready || undefined}
              aria-busy={busy || undefined}
              aria-label={
                ready
                  ? `One-pager PDF for ${company}`
                  : `One-pager PDF for ${company}: Run the analysis first`
              }
              title={ready ? "One-pager PDF" : "Run the analysis first"}
              className={clsx(
                ICON_BUTTON,
                !ready && "cursor-not-allowed opacity-40 hover:bg-transparent hover:text-muted",
              )}
            >
              {busy ? (
                <Loader2 className="h-4 w-4 motion-safe:animate-spin" aria-hidden="true" />
              ) : (
                <FileDown className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
            {row.source === "rating" ? (
              <>
                <button
                  type="button"
                  onClick={() => openEditor(ratingRowFromItem(row))}
                  aria-label={`Edit ${company}`}
                  title="Edit"
                  className={ICON_BUTTON}
                >
                  <Pencil className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setNotice(null);
                    setRatingDelete(row);
                  }}
                  aria-label={`Delete ${company}`}
                  title="Delete"
                  className={ICON_BUTTON_DANGER}
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setNotice(null);
                  setDeleteError(null);
                  setCalcDelete(row);
                }}
                aria-label={`Delete submission from ${company}`}
                title="Delete submission"
                className={ICON_BUTTON_DANGER}
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </div>
        );
      },
    },
  ];

  const emptyState = search ? (
    <EmptyState icon={Search} title="No matches" description={`No entries match “${search}”.`} />
  ) : source === "rating" ? (
    <EmptyState
      icon={BarChart3}
      title="No ratings yet"
      description="Add a company or import a CSV to fill the ESG Rating List."
      action={
        <Button variant="adminPrimary" onClick={() => openEditor(null)}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add rated company
        </Button>
      }
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
  );

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        crumbs={[{ label: "Dashboard", href: "/admin" }, { label: "ESG Submissions" }]}
        title="ESG Submissions"
        description="Calculator submissions and rated companies"
        actions={
          <>
            <Button variant="adminSecondary" href="/admin/esg/import">
              <Upload className="h-4 w-4" aria-hidden="true" />
              Import CSV
            </Button>
            <Button variant="adminSecondary" onClick={() => openEditor(null)}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add rated company
            </Button>
            <Button variant="adminPrimary" href="/admin/esg/new">
              <FilePlus2 className="h-4 w-4" aria-hidden="true" />
              New ESG Assessment
            </Button>
          </>
        }
      />

      <StatStrip
        items={[
          {
            label: "Total ESG entries",
            value: esg && ratings ? NUM.format(esg.total + ratings.total) : "—",
            icon: Layers,
            tone: "brand",
          },
          {
            label: "Calculator submissions",
            value: esg ? NUM.format(esg.total) : "—",
            hint: esg ? `${NUM.format(esg.reports_generated)} with a report` : undefined,
            icon: FileText,
            tone: "teal",
          },
          {
            label: "Rated companies",
            value: ratings ? NUM.format(ratings.total) : "—",
            icon: Building2,
            tone: "violet",
          },
          {
            label: "Average rating",
            value: ratings ? ratings.average.toFixed(1) : "—",
            hint: ratings ? "of the rated companies" : undefined,
            icon: Gauge,
            tone: "green",
          },
        ]}
      />

      {/* Search, then the three filter chips on one line (they scroll sideways
          on a narrow screen rather than wrap), then the result count. */}
      <div className={clsx(CARD, "flex flex-col gap-3 p-3 md:flex-row md:items-center")}>
        <div className="relative min-w-0 md:max-w-md md:flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted"
            aria-hidden="true"
          />
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search company, sector or grade…"
            aria-label="Search submissions"
            className={clsx(INPUT, "pl-9")}
          />
        </div>
        {/* p-1/-m-1 keeps the chips' focus ring clear of the scroll clip. */}
        <div
          role="group"
          aria-label="Filter by source"
          className="-m-1 flex min-w-0 flex-nowrap items-center gap-2 overflow-x-auto p-1 [scrollbar-width:none] md:shrink-0 [&::-webkit-scrollbar]:hidden"
        >
          {FILTERS.map((filter) => {
            const active = source === filter.value;
            const n = chipCount(filter.value);
            return (
              <button
                key={filter.value}
                type="button"
                aria-pressed={active}
                onClick={() => replaceParams({ source: filter.value === "all" ? null : filter.value })}
                className={clsx(
                  "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3 text-[13px] font-medium whitespace-nowrap ring-1 ring-inset motion-safe:transition-colors",
                  FOCUS_RING,
                  active
                    ? "bg-calc-navy text-white ring-calc-navy"
                    : "bg-white text-ink ring-line hover:bg-slate-50",
                )}
              >
                {filter.label}
                {n !== null ? (
                  <span
                    className={clsx(
                      "rounded-full px-1.5 py-px text-[11px] font-semibold tabular-nums",
                      active ? "bg-white/15 text-white" : "bg-slate-100 text-muted",
                    )}
                  >
                    {NUM.format(n)}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
        {items !== null ? (
          <p
            className="px-1 text-sm whitespace-nowrap text-muted tabular-nums md:ml-auto md:shrink-0"
            aria-live="polite"
          >
            {search
              ? `${NUM.format(total)} ${total === 1 ? "match" : "matches"} for “${search}”`
              : countEntries(total)}
          </p>
        ) : null}
      </div>

      {notice ? <Alert variant="success">{notice}</Alert> : null}
      {error ? <Alert variant="error">{error}</Alert> : null}
      {pdf.error ? <Alert variant="error">{pdf.error}</Alert> : null}

      {items === null ? (
        error ? null : <TableSkeleton />
      ) : (
        <div
          aria-busy={stale}
          className={clsx("flex flex-col gap-5 motion-safe:transition-opacity", stale && "opacity-60")}
        >
          <DataTable
            appearance="console"
            density="compact"
            columns={columns}
            rows={items}
            rowKey={(row) => `${row.source}-${row.id}`}
            empty={emptyState}
          />
          <ListFooter
            page={page}
            pageSize={PAGE_SIZE}
            total={total}
            pages={pages}
            onPageChange={setPage}
          />
        </div>
      )}

      {pdf.sheet}

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

      <RatingDeleteModal
        target={ratingDelete ? { sNo: ratingDelete.id, company: ratingDelete.company } : null}
        onClose={() => setRatingDelete(null)}
        onDeleted={() => {
          setRatingDelete(null);
          setNotice("Entry deleted.");
          reload();
        }}
      />

      <Modal
        open={calcDelete !== null}
        onClose={() => (deleting ? undefined : setCalcDelete(null))}
        title="Delete submission"
      >
        <div className="flex flex-col gap-4">
          {deleteError ? <Alert variant="error">{deleteError}</Alert> : null}
          <p className="text-sm text-ink">
            Delete this submission? Its uploaded report and analysis will be permanently removed.
            This cannot be undone.
          </p>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="adminSecondary" onClick={() => setCalcDelete(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="adminDanger" onClick={confirmCalcDelete} disabled={deleting}>
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
      <EsgList />
    </Suspense>
  );
}
