"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Download, RefreshCw } from "lucide-react";
import type { BfsiDetail } from "@/lib/types";
import { apiFetch, ApiError } from "@/lib/api";
import { formatUtc, numberFormat } from "@/lib/format";
import { BFSI_PDF_OPTS, downloadPdf, pdfBlob } from "@/lib/pdf";
import Card from "@/components/ui/Card";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import AnalyzePanel from "@/components/admin/AnalyzePanel";
import SendReportButton from "@/components/admin/SendReportButton";
import BfsiDetailedReport from "@/components/reports/BfsiDetailedReport";
import BfsiOnePager from "@/components/reports/BfsiOnePager";

/** Pure network call — only the effect's `.then/.catch` sets state. */
function fetchDetail(id: string): Promise<BfsiDetail> {
  return apiFetch<BfsiDetail>(`/api/admin/bfsi/submissions/${id}`);
}

/** Port of bfsi-calculator/admin/report.php (bfsi.md §3). */
export default function BfsiSubmissionDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [detail, setDetail] = useState<BfsiDetail | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);
  // Off-screen copies used only for "Send report" (detailed + one-pager).
  const pdfDetailedRef = useRef<HTMLDivElement>(null);
  const pdfOnePagerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    fetchDetail(id)
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

  // Safe from a click handler or AnalyzePanel's polling interval.
  const reload = useCallback(async () => {
    try {
      const res = await fetchDetail(id);
      setDetail(res);
      setLoadError(null);
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : "Something went wrong.");
    }
  }, [id]);

  async function handleAnalyze() {
    setActionError(null);
    // Optimistically flip to "running" so the countdown shows immediately.
    setDetail((d) =>
      d
        ? {
            ...d,
            submission: {
              ...d.submission,
              analysis_status: "running",
              analysis_error: null,
              analysis_started_at: new Date().toISOString(),
            },
          }
        : d,
    );
    try {
      await apiFetch(`/api/admin/bfsi/submissions/${id}/analyze`, { method: "POST" });
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      await reload();
    }
  }

  async function handleDownload() {
    if (!reportRef.current) return;
    setDownloading(true);
    setActionError(null);
    try {
      await downloadPdf(reportRef.current, `bfsi-detailed-report-${id}.pdf`, BFSI_PDF_OPTS);
    } catch {
      setActionError("Couldn't generate the PDF. Please try again.");
    } finally {
      setDownloading(false);
    }
  }

  async function getPdfs(): Promise<Blob[]> {
    const detailed = pdfDetailedRef.current;
    const onePager = pdfOnePagerRef.current;
    if (!detailed || !onePager) throw new Error("The report isn't ready yet.");
    // Order matters: the API names them bfsi-detailed-report-<id>.pdf, then
    // esg-rating-report-<id>.pdf (router_admin.py SEND_FILE_NAMES).
    return [await pdfBlob(detailed, BFSI_PDF_OPTS), await pdfBlob(onePager, BFSI_PDF_OPTS)];
  }

  if (!detail && !loadError) {
    return <div className="px-6 py-12 text-center text-sm text-muted">Loading…</div>;
  }

  if (loadError || !detail) {
    return <Alert variant="error">{loadError ?? "Submission not found."}</Alert>;
  }

  const { submission: sub, overall, recommendation, previous, industry_label } = detail;
  const ai = sub.ai_analysis;
  const running = sub.analysis_status === "running";
  const showReport = !running && !!ai && !!overall;

  // report.php's "Borrower & Loan Details" card — 12 pairs.
  const pairs: Array<[string, ReactNode]> = [
    ["Borrower", sub.borrower_name],
    ["CIN / GSTIN", sub.cin_gstin],
    ["Industry", industry_label],
    ["Sub-sector", sub.sub_sector],
    ["Loan Amount", `₹${numberFormat(sub.loan_amount)}`],
    ["Outstanding Loans", `₹${numberFormat(sub.outstanding_loans)}`],
    ["Loan Purpose", sub.loan_purpose],
    ["Loan Type", sub.loan_type],
    ["Contact Email", sub.contact_email],
    ["Submitted", formatUtc(sub.created_at, "Y-m-d H:i")],
    ["Status", sub.status ?? ""],
    [
      "Uploaded Report",
      <a
        key="file"
        href={`/api/admin/bfsi/submissions/${id}/file`}
        className="text-calc-blue hover:underline"
      >
        Download original file
      </a>,
    ],
  ];

  return (
    <div className="flex flex-col gap-6">
      <Link href="/admin/bfsi" className="text-sm font-medium text-calc-blue hover:underline">
        ← Submissions
      </Link>

      <Card lift={false}>
        <h2 className="mb-4 text-lg font-semibold text-ink">Borrower &amp; Loan Details</h2>
        <dl className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
          {pairs.map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs text-[#5c6b82]">{label}</dt>
              <dd className="break-words text-sm font-bold text-ink">{value}</dd>
            </div>
          ))}
        </dl>
      </Card>

      {actionError ? <Alert variant="error">{actionError}</Alert> : null}

      {!showReport || !ai || !overall ? (
        <AnalyzePanel
          variant="bfsi"
          label="Generating BFSI ESG Report"
          status={running ? "running" : sub.analysis_status === "failed" ? "failed" : "idle"}
          error={sub.analysis_error}
          startedAt={sub.analysis_started_at}
          onStart={handleAnalyze}
          onPoll={reload}
        />
      ) : (
        <div className="flex flex-col gap-4">
          {sub.analysis_status === "failed" ? (
            <Alert variant="error">
              The last re-run failed: {sub.analysis_error ?? "Unknown error."} The report below is
              from the previous successful run.
            </Alert>
          ) : null}

          <div className="flex flex-wrap items-center gap-3">
            <Button variant="calcBlue" onClick={handleDownload} disabled={downloading}>
              <Download className="h-4 w-4" aria-hidden="true" />
              {downloading ? "Preparing…" : "Download Detailed Report (PDF)"}
            </Button>
            <Button variant="calcNavy" href={`/admin/bfsi/${id}/one-pager`}>
              One-Page Rating Report →
            </Button>
            <SendReportButton
              getPdfs={getPdfs}
              endpoint={`/api/admin/bfsi/submissions/${id}/send`}
              email={sub.contact_email}
              fieldName="pdfs"
            />
            <Button variant="outline" onClick={handleAnalyze}>
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Re-run analysis
            </Button>
          </div>

          <BfsiDetailedReport
            ref={reportRef}
            submission={sub}
            overall={overall}
            recommendation={recommendation ?? ""}
          />

          {/* Off-screen render of both sheets for "Send report". Not display:none,
              so the Chart.js canvases get a real size to draw into. */}
          <div
            aria-hidden="true"
            inert
            className="pointer-events-none fixed left-[-10000px] top-0 w-[750px]"
          >
            <BfsiDetailedReport
              ref={pdfDetailedRef}
              submission={sub}
              overall={overall}
              recommendation={recommendation ?? ""}
            />
            <BfsiOnePager
              ref={pdfOnePagerRef}
              submission={sub}
              overall={overall}
              previous={previous}
              industryLabel={industry_label}
            />
          </div>
        </div>
      )}
    </div>
  );
}
