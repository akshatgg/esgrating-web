"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { Download, RefreshCw } from "lucide-react";
import type { EsgSubmission } from "@/lib/types";
import { apiFetch, ApiError } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { downloadPdf, pdfBlob, ESG_PDF_OPTS } from "@/lib/pdf";
import Card from "@/components/ui/Card";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import AnalyzePanel from "@/components/admin/AnalyzePanel";
import SendReportButton from "@/components/admin/SendReportButton";
import EsgReport from "@/components/reports/EsgReport";

const PDF_FILENAME = "esg_report.pdf";

function statusLabel(sub: EsgSubmission): string {
  if (sub.analysis_status === "running") return "Analyzing…";
  if (sub.status === "sent") return "Sent";
  if (sub.status === "report_generated") return "Report generated";
  return "New";
}

/** Pure network call — see the matching note on the list page's
 * `fetchSubmissions`; only the effect's `.then/.catch` sets state. */
function fetchSubmission(id: string): Promise<EsgSubmission> {
  return apiFetch<EsgSubmission>(`/api/admin/esg/submissions/${id}`);
}

export default function EsgSubmissionDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [sub, setSub] = useState<EsgSubmission | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    fetchSubmission(id)
      .then((res) => {
        if (cancelled) return;
        setSub(res);
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

  // Event-handler-style reload, safe to call from a click handler or from
  // AnalyzePanel's own polling interval (never from a bare effect body).
  const reload = useCallback(async () => {
    try {
      const res = await fetchSubmission(id);
      setSub(res);
      setLoadError(null);
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : "Something went wrong.");
    }
  }, [id]);

  async function handleAnalyze() {
    setActionError(null);
    // Optimistically flip to "running" (with a fresh `analysis_started_at`,
    // so the countdown doesn't briefly show a stale elapsed time left over
    // from a previous run) so AnalyzePanel shows the countdown immediately,
    // without waiting on the next poll.
    setSub((s) =>
      s
        ? {
            ...s,
            analysis_status: "running",
            analysis_error: null,
            analysis_started_at: new Date().toISOString(),
          }
        : s,
    );
    try {
      await apiFetch(`/api/admin/esg/submissions/${id}/analyze`, { method: "POST" });
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
      await downloadPdf(reportRef.current, PDF_FILENAME, ESG_PDF_OPTS);
    } catch {
      setActionError("Couldn't generate the PDF. Please try again.");
    } finally {
      setDownloading(false);
    }
  }

  if (!sub && !loadError) {
    return <div className="px-6 py-12 text-center text-sm text-muted">Loading…</div>;
  }

  if (loadError || !sub) {
    return <Alert variant="error">{loadError ?? "Submission not found."}</Alert>;
  }

  const running = sub.analysis_status === "running";
  const final = sub.final;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-ink">{sub.company_name}</h1>

      <Card>
        <dl className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <dt className="text-muted">Name</dt>
            <dd className="text-ink">{sub.name}</dd>
          </div>
          <div>
            <dt className="text-muted">Email</dt>
            <dd className="text-ink">{sub.email}</dd>
          </div>
          <div>
            <dt className="text-muted">Designation</dt>
            <dd className="text-ink">{sub.designation}</dd>
          </div>
          <div>
            <dt className="text-muted">Company</dt>
            <dd className="text-ink">{sub.company_name}</dd>
          </div>
          <div>
            <dt className="text-muted">Mobile</dt>
            <dd className="text-ink">{sub.mobile_number}</dd>
          </div>
          <div>
            <dt className="text-muted">FY</dt>
            <dd className="text-ink">{sub.report_year}</dd>
          </div>
          <div>
            <dt className="text-muted">Submitted</dt>
            <dd className="text-ink">{formatDate(sub.created_at)}</dd>
          </div>
          <div>
            <dt className="text-muted">Status</dt>
            <dd className="text-ink">{statusLabel(sub)}</dd>
          </div>
          <div>
            <dt className="text-muted">Original file</dt>
            <dd>
              <a
                href={`/api/admin/esg/submissions/${id}/file`}
                className="font-medium text-calc-blue hover:underline"
              >
                Download original file
              </a>
            </dd>
          </div>
        </dl>
      </Card>

      {actionError ? <Alert variant="error">{actionError}</Alert> : null}

      {running || !final ? (
        <AnalyzePanel
          status={running ? "running" : sub.analysis_status}
          error={sub.analysis_error}
          startedAt={sub.analysis_started_at}
          onStart={handleAnalyze}
          onPoll={reload}
          label="Generating ESG Report"
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
              {downloading ? "Preparing…" : "Download PDF"}
            </Button>
            <SendReportButton
              getPdfs={async () => [await pdfBlob(reportRef.current as HTMLElement, ESG_PDF_OPTS)]}
              endpoint={`/api/admin/esg/submissions/${id}/send`}
              email={sub.email}
            />
            <Button variant="outline" onClick={handleAnalyze}>
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Re-run analysis
            </Button>
          </div>

          <EsgReport
            ref={reportRef}
            final={final}
            yearScore={sub.year_score}
            companyName={sub.company_name}
            fy={sub.report_year}
          />
        </div>
      )}
    </div>
  );
}
