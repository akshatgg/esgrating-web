"use client";

import { useEffect, useRef, useState } from "react";
import type { EsgListItem, EsgSubmission } from "@/lib/types";
import { apiFetch, ApiError } from "@/lib/api";
import { downloadPdf, ESG_PDF_OPTS } from "@/lib/pdf";
import EsgReport, { ESG_REPORT_PDF_FILENAME } from "@/components/reports/EsgReport";
import EsgRatingOnePager, { ratingPdfFilename } from "@/components/reports/EsgRatingOnePager";

type Job = { item: EsgListItem; submission: EsgSubmission | null };

/** Resolves once the sheet's images have decoded and two frames have painted
 * (the chart draws on mount), so html2canvas captures a finished sheet. */
async function settled(el: HTMLElement): Promise<void> {
  await Promise.all(
    [...el.querySelectorAll("img")].map((img) =>
      img.complete ? undefined : img.decode().catch(() => undefined),
    ),
  );
  await new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
  );
}

/** "One-pager PDF" straight from a list row: renders the row's sheet (the
 * calculator EsgReport, or the rated-company EsgRatingOnePager) off-screen,
 * saves it with the same html2pdf options as the report pages, then unmounts
 * it. Render `sheet` anywhere in the page. */
export function useEsgOnePagerPdf() {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [job, setJob] = useState<Job | null>(null);
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  async function download(item: EsgListItem) {
    if (busyId) return;
    setError(null);
    setBusyId(item.id);
    if (item.source === "rating") {
      setJob({ item, submission: null });
      return;
    }
    try {
      const submission = await apiFetch<EsgSubmission>(`/api/admin/esg/submissions/${item.id}`);
      if (!submission.final) {
        setError("Run the analysis first.");
        setBusyId(null);
        return;
      }
      setJob({ item, submission });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong.");
      setBusyId(null);
    }
  }

  useEffect(() => {
    const el = ref.current;
    if (!job || !el) return;
    const filename = job.submission ? ESG_REPORT_PDF_FILENAME : ratingPdfFilename(job.item);
    settled(el)
      .then(() => downloadPdf(el, filename, ESG_PDF_OPTS))
      .catch(() => setError("Couldn't generate the PDF. Please try again."))
      .finally(() => {
        setJob(null);
        setBusyId(null);
      });
  }, [job]);

  const final = job?.submission?.final;
  const sheet = job ? (
    <div aria-hidden="true" inert className="pointer-events-none fixed top-0 left-[-10000px]">
      {job.submission && final ? (
        <EsgReport
          ref={ref}
          final={final}
          yearScore={job.submission.year_score}
          companyName={job.submission.company_name}
          fy={job.submission.report_year}
        />
      ) : (
        <EsgRatingOnePager ref={ref} item={job.item} />
      )}
    </div>
  ) : null;

  return { download, busyId, error, clearError: () => setError(null), sheet };
}
