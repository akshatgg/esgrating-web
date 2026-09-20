"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Award,
  Building2,
  CalendarDays,
  Database,
  Download,
  Factory,
  Gauge,
  Hash,
  ArrowLeft,
  Pencil,
  Tag,
  Trash2,
} from "lucide-react";
import clsx from "clsx";
import type { EsgListItem } from "@/lib/types";
import { apiFetch, ApiError } from "@/lib/api";
import { formatDmyFull } from "@/lib/format";
import { downloadPdf, ONE_PAGER_PDF_OPTS } from "@/lib/pdf";
import { RATED_COMPANIES_HREF } from "@/lib/admin-nav";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import PageHeader from "@/components/admin/PageHeader";
import DetailRail from "@/components/admin/DetailRail";
import ReportPreview from "@/components/admin/ReportPreview";
import { DetailSkeleton } from "@/components/admin/Skeleton";
import { GradeChip, StatusBadge } from "@/components/admin/Badge";
import { CARD } from "@/components/admin/styles";
import EsgRatingOnePager, { ratingPdfFilename } from "@/components/reports/EsgRatingOnePager";
import RatingModal, { ratingRowFromItem } from "../../RatingModal";
import RatingDeleteModal from "../../RatingDeleteModal";

// A company on the ESG Rating List, as a report: its details in the rail and
// the rated-company one-pager (docs/sdd/web-task-esg-merge-brief.md).

const LIST_CRUMBS = [
  { label: "Dashboard", href: "/admin" },
  { label: "ESG Submissions", href: "/admin/esg" },
];

/** Pure network call — only the effect's `.then/.catch` sets state. */
function fetchRating(sNo: string): Promise<EsgListItem> {
  return apiFetch<EsgListItem>(`/api/admin/ratings/${sNo}`);
}

export default function RatedCompanyPage() {
  const params = useParams<{ s_no: string }>();
  const sNo = params.s_no;
  // A non-numeric S.No can't exist; don't ask the API (it would answer with a
  // validation error rather than "Not found").
  const validSNo = /^\d+$/.test(sNo);
  const router = useRouter();

  const [item, setItem] = useState<EsgListItem | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!validSNo) return;
    let cancelled = false;
    fetchRating(sNo)
      .then((res) => {
        if (cancelled) return;
        setItem(res);
        setLoadError(null);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setLoadError(err instanceof ApiError ? err.message : "Something went wrong.");
      });
    return () => {
      cancelled = true;
    };
  }, [sNo, validSNo, refreshToken]);

  async function handleDownload() {
    if (!reportRef.current || !item) return;
    setDownloading(true);
    setActionError(null);
    try {
      await downloadPdf(reportRef.current, ratingPdfFilename(item), ONE_PAGER_PDF_OPTS);
    } catch {
      setActionError("Couldn't generate the PDF. Please try again.");
    } finally {
      setDownloading(false);
    }
  }

  if (validSNo && !item && !loadError) {
    return <DetailSkeleton />;
  }

  if (!validSNo || loadError || !item) {
    return (
      <div className="flex flex-col gap-5">
        <PageHeader crumbs={[...LIST_CRUMBS, { label: "Rated company" }]} title="Rated company" />
        <Alert variant="error">{validSNo ? (loadError ?? "Not found") : "Not found"}</Alert>
        <Button variant="adminSecondary" href={RATED_COMPANIES_HREF} className="self-start">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Rated companies
        </Button>
      </div>
    );
  }

  const company = item.company ?? "Rated company";
  const filename = ratingPdfFilename(item);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        crumbs={[...LIST_CRUMBS, { label: company }]}
        title={company}
        description="Rated company on the ESG Rating List"
        badge={<StatusBadge state="generated" label="Rated" />}
      />

      {/* Two columns only from 2xl: below that the 736px one-pager would be
          squeezed beside the rail, so the rail stacks under the report. */}
      <div className="grid grid-cols-1 items-start gap-5 2xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-5 2xl:col-start-1 2xl:row-start-1">
          {notice ? <Alert variant="success">{notice}</Alert> : null}
          {actionError ? <Alert variant="error">{actionError}</Alert> : null}

          <div className={clsx(CARD, "flex flex-wrap items-center gap-2 p-3")}>
            <Button variant="adminPrimary" onClick={handleDownload} disabled={downloading}>
              <Download className="h-4 w-4" aria-hidden="true" />
              {downloading ? "Preparing…" : "Download one-pager PDF"}
            </Button>
            {/* The one-pager is drawn from the rating's fields, so editing the rating
                is editing the report. Same modal as the rail's Edit, which sits below
                the preview under 2xl and is easy to miss. */}
            <Button
              variant="adminSecondary"
              onClick={() => {
                setNotice(null);
                setEditing(true);
              }}
            >
              <Pencil className="h-4 w-4" aria-hidden="true" />
              Edit report
            </Button>
          </div>

          <ReportPreview caption={`Downloads as ${filename}`}>
            <EsgRatingOnePager ref={reportRef} item={item} />
          </ReportPreview>
        </div>

        <DetailRail
          className="2xl:sticky 2xl:top-24 2xl:col-start-2 2xl:row-start-1"
          title="Company details"
          badge={<StatusBadge state="generated" label="Rated" />}
          rows={[
            { label: "Company", value: item.company, icon: Building2 },
            { label: "Sector", value: item.sector, icon: Factory },
            {
              label: "ESG Rating",
              value: typeof item.rating === "number" ? item.rating.toFixed(1) : null,
              icon: Gauge,
            },
            { label: "Grade", value: item.grade ? <GradeChip grade={item.grade} /> : null, icon: Award },
            { label: "Category", value: item.category, icon: Tag },
            { label: "Date of rating", value: formatDmyFull(item.date), icon: CalendarDays },
            { label: "Source", value: "ESG Rating List", icon: Database },
            { label: "S.No", value: item.id, icon: Hash },
          ]}
          footer={
            <div className="flex gap-2">
              <Button
                variant="adminSecondary"
                className="flex-1"
                onClick={() => {
                  setNotice(null);
                  setEditing(true);
                }}
              >
                <Pencil className="h-4 w-4" aria-hidden="true" />
                Edit
              </Button>
              <Button
                variant="adminSecondary"
                className="flex-1 text-red-600 hover:border-red-200 hover:bg-red-50"
                onClick={() => {
                  setNotice(null);
                  setConfirmingDelete(true);
                }}
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                Delete
              </Button>
            </div>
          }
        />
      </div>

      {editing ? (
        <RatingModal
          row={ratingRowFromItem(item)}
          onClose={() => setEditing(false)}
          onSaved={() => {
            setEditing(false);
            setNotice("Changes saved.");
            setRefreshToken((n) => n + 1);
          }}
        />
      ) : null}

      <RatingDeleteModal
        target={confirmingDelete ? { sNo: item.id, company: item.company } : null}
        onClose={() => setConfirmingDelete(false)}
        onDeleted={() => {
          setConfirmingDelete(false);
          router.push(RATED_COMPANIES_HREF);
        }}
      />
    </div>
  );
}
