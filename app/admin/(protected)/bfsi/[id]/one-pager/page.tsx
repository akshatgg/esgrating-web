"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { BfsiDetail } from "@/lib/types";
import { apiFetch, ApiError } from "@/lib/api";
import { BFSI_PDF_OPTS, downloadPdf } from "@/lib/pdf";
import Alert from "@/components/ui/Alert";
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

  if (!detail && !loadError) {
    return <div className="px-6 py-12 text-center text-sm text-muted">Loading…</div>;
  }

  if (loadError || !detail) {
    return <Alert variant="error">{loadError ?? "Submission not found."}</Alert>;
  }

  const { submission: sub, overall, previous, industry_label } = detail;

  // one_pager.php's 409 page.
  if (!sub.ai_analysis || !overall) {
    return (
      <div className="rounded-2xl border border-line bg-white px-6 py-8 text-sm text-ink">
        <p>
          AI analysis has not run for this submission yet.{" "}
          <Link href={`/admin/bfsi/${id}`} className="text-calc-blue hover:underline">
            Run it from the detailed report
          </Link>
          , then come back.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* one_pager.php's `.page-actions` */}
      <div className="mx-auto flex w-full max-w-[736px] items-center justify-between font-[Arial,sans-serif] text-sm">
        <Link href={`/admin/bfsi/${id}`} className="text-[#002d6c] hover:underline">
          ← Detailed report
        </Link>
        <button
          type="button"
          onClick={handleDownload}
          disabled={downloading}
          className="rounded bg-[#002d6c] px-4 py-2 text-sm text-white disabled:opacity-60"
        >
          {downloading ? "Preparing…" : "Download PDF"}
        </button>
      </div>

      {actionError ? (
        <Alert variant="error" className="mx-auto mt-3 w-full max-w-[736px]">
          {actionError}
        </Alert>
      ) : null}

      <BfsiOnePager
        ref={ref}
        submission={sub}
        overall={overall}
        previous={previous}
        industryLabel={industry_label}
      />
    </div>
  );
}
