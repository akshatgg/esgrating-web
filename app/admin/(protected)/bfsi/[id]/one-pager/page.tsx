"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Download, Sparkles } from "lucide-react";
import clsx from "clsx";
import type { BfsiDetail } from "@/lib/types";
import { apiFetch, ApiError } from "@/lib/api";
import { BFSI_PDF_OPTS, downloadPdf } from "@/lib/pdf";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import PageHeader from "@/components/admin/PageHeader";
import ReportPreview from "@/components/admin/ReportPreview";
import IconTile from "@/components/admin/IconTile";
import { Bone } from "@/components/admin/Skeleton";
import { CARD, FOCUS_RING } from "@/components/admin/styles";
import BfsiOnePager from "@/components/reports/BfsiOnePager";

/** Port of bfsi-calculator/admin/one_pager.php. */
export default function BfsiOnePagerPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [detail, setDetail] = useState<BfsiDetail | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    apiFetch<BfsiDetail>(`/api/admin/bfsi/submissions/${id}`)
      .then((res) => {
        if (cancelled) return;
        setDetail(res);
        setLoadError(null);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setLoadError(err instanceof ApiError ? err.message : "Something went wrong.");
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function handleDownload() {
    if (!ref.current) return;
    setDownloading(true);
    setActionError(null);
    try {
      await downloadPdf(ref.current, `esg-rating-report-${id}.pdf`, BFSI_PDF_OPTS);
    } catch {
      setActionError("Couldn't generate the PDF. Please try again.");
    } finally {
      setDownloading(false);
    }
  }

  const borrower = detail?.submission.borrower_name;
  const crumbs = [
    { label: "Dashboard", href: "/admin" },
    { label: "BFSI Submissions", href: "/admin/bfsi" },
    { label: borrower ?? "Submission", href: `/admin/bfsi/${id}` },
    { label: "One-page report" },
  ];
  const ready = !!detail?.submission.ai_analysis && !!detail?.overall;

  const header = (
    <PageHeader
      crumbs={crumbs}
      title="One-Page Rating Report"
      description={borrower}
      actions={
        <>
          <Button variant="adminSecondary" href={`/admin/bfsi/${id}`}>
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Detailed report
          </Button>
          {ready ? (
            <Button variant="adminPrimary" onClick={handleDownload} disabled={downloading}>
              <Download className="h-4 w-4" aria-hidden="true" />
              {downloading ? "Preparing…" : "Download PDF"}
            </Button>
          ) : null}
        </>
      }
    />
  );

  if (!detail && !loadError) {
    return (
      <div className="flex flex-col gap-5" aria-busy="true">
        <span role="status" className="sr-only">
          Loading…
        </span>
        <div>
          <Bone className="h-3 w-56" />
          <Bone className="mt-3 h-6 w-72 max-w-full" />
        </div>
        <div className={clsx(CARD, "h-[480px] p-6")}>
          <Bone className="h-4 w-32" />
        </div>
      </div>
    );
  }

  if (loadError || !detail) {
    return (
      <div className="flex flex-col gap-5">
        {header}
        <Alert variant="error">{loadError ?? "Submission not found."}</Alert>
      </div>
    );
  }

  const { submission: sub, overall, previous, industry_label } = detail;

  // one_pager.php's 409 page.
  if (!sub.ai_analysis || !overall) {
    return (
      <div className="flex flex-col gap-5">
        {header}
        <div className={clsx(CARD, "flex items-start gap-4 p-5 sm:p-6")}>
          <IconTile icon={Sparkles} tone="amber" />
          <p className="pt-2 text-sm text-ink">
            AI analysis has not run for this submission yet.{" "}
            <Link
              href={`/admin/bfsi/${id}`}
              className={clsx("rounded font-medium text-brand hover:underline", FOCUS_RING)}
            >
              Run it from the detailed report
            </Link>
            , then come back.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {header}

      {actionError ? <Alert variant="error">{actionError}</Alert> : null}

      <ReportPreview caption="Downloads as esg-rating-report PDF.">
        <BfsiOnePager
          ref={ref}
          submission={sub}
          overall={overall}
          previous={previous}
          industryLabel={industry_label}
        />
      </ReportPreview>
    </div>
  );
}
