"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  CalendarRange,
  Clock,
  Download,
  Mail,
  PencilLine,
  Phone,
  RefreshCw,
  User,
} from "lucide-react";
import clsx from "clsx";
import type { EsgSubmission } from "@/lib/types";
import { apiFetch, ApiError } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { downloadPdf, pdfBlob, ESG_PDF_OPTS } from "@/lib/pdf";
import type { EsgEffective } from "@/lib/reportEdits";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import AnalyzePanel from "@/components/admin/AnalyzePanel";
import SendReportButton from "@/components/admin/SendReportButton";
import PageHeader from "@/components/admin/PageHeader";
import DetailRail from "@/components/admin/DetailRail";
import ReportPreview from "@/components/admin/ReportPreview";
import ReportEditBar, { ReportEditAnnouncer } from "@/components/admin/ReportEditBar";
import { useReportEditor } from "@/components/admin/useReportEditor";
import { DetailSkeleton } from "@/components/admin/Skeleton";
import {
  EditedBadge,
  StatusBadge,
  submissionState,
  submissionStatusLabel,
} from "@/components/admin/Badge";
import { CARD } from "@/components/admin/styles";
import EsgReport, { ESG_REPORT_PDF_FILENAME } from "@/components/reports/EsgReport";
import { ReportEditProvider } from "@/components/reports/edit/ReportEdit";
import PageScoresTables from "@/components/reports/edit/PageScoresPanel";

const PDF_FILENAME = ESG_REPORT_PDF_FILENAME;

const LIST_CRUMBS = [
  { label: "Dashboard", href: "/admin" },
  { label: "ESG Submissions", href: "/admin/esg" },
];

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
  const [confirmRerun, setConfirmRerun] = useState(false);
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

  const editor = useReportEditor<EsgEffective>("esg", id, {
    enabled: !!sub?.final && sub.analysis_status !== "running",
    onSaved: reload,
  });

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

  /** Re-running replaces saved edits, so confirm first when there are any. */
  function requestAnalyze() {
    if (editor.report?.edited) setConfirmRerun(true);
    else void handleAnalyze();
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
    return <DetailSkeleton />;
  }

  if (loadError || !sub) {
    return (
      <div className="flex flex-col gap-5">
        <PageHeader crumbs={[...LIST_CRUMBS, { label: "Submission" }]} title="ESG submission" />
        <Alert variant="error">{loadError ?? "Submission not found."}</Alert>
        <Button variant="adminSecondary" href="/admin/esg" className="self-start">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          ESG Submissions
        </Button>
      </div>
    );
  }

  const running = sub.analysis_status === "running";
  const final = sub.final;
  const showReport = !running && !!final;
  const editing = editor.editing;
  // The effective (edited / previewed) report when there is one, else the
  // stored `final` exactly as before.
  const viewFinal = editor.liveEffective?.final ?? final;
  // Download and Send render the saved edits, so they wait for GET …/report.
  const reportGate = editor.report
    ? null
    : editor.loadError
      ? "The saved report couldn't be loaded."
      : "Loading the saved report…";

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        crumbs={[...LIST_CRUMBS, { label: sub.company_name }]}
        title={sub.company_name}
        description={`FY ${sub.report_year} report from ${sub.name}`}
        badge={
          <>
            <StatusBadge state={submissionState(sub)} label={submissionStatusLabel(sub)} />
            {editor.report?.edited ? <EditedBadge /> : null}
          </>
        }
      />

      {/* With a report showing, two columns only from 2xl: the 736–750px sheet
          needs the width, so below that the rail stacks under the report. */}
      <div
        className={clsx(
          "grid grid-cols-1 items-start gap-5",
          showReport
            ? "2xl:grid-cols-[minmax(0,1fr)_340px]"
            : "xl:grid-cols-[minmax(0,1fr)_340px]",
        )}
      >
        <div
          className={clsx(
            "flex min-w-0 flex-col gap-5",
            showReport ? "2xl:col-start-1 2xl:row-start-1" : "xl:col-start-1 xl:row-start-1",
          )}
        >
          {actionError ? <Alert variant="error">{actionError}</Alert> : null}
          <ReportEditAnnouncer message={editor.announcement} />

          {running || !final || !viewFinal ? (
            <AnalyzePanel
              status={running ? "running" : sub.analysis_status}
              error={sub.analysis_error}
              startedAt={sub.analysis_started_at}
              onStart={handleAnalyze}
              onPoll={reload}
              label="Generating ESG Report"
            />
          ) : (
            <>
              {sub.analysis_status === "failed" ? (
                <Alert variant="error">
                  The last re-run failed: {sub.analysis_error ?? "Unknown error."} The report below
                  is from the previous successful run.
                </Alert>
              ) : null}

              {editor.loadError ? (
                <Alert variant="error">
                  Couldn&apos;t load the saved report ({editor.loadError}). Download and Send stay off
                  until it loads, so they never go out without your edits.{" "}
                  <button type="button" className="font-medium underline" onClick={editor.refresh}>
                    Retry
                  </button>
                </Alert>
              ) : null}
              {editing ? (
                <ReportEditBar
                  dirty={editor.dirty}
                  saving={editor.saving}
                  previewing={editor.previewing}
                  logoBusy={editor.logoBusy}
                  error={editor.error}
                  edited={!!editor.report?.edited}
                  onSave={editor.save}
                  onCancel={editor.cancel}
                  onReset={editor.reset}
                />
              ) : (
                /* Report actions left, Re-run right; when the column is too
                   narrow, Re-run drops to its own line. */
                <div
                  className={clsx(CARD, "flex flex-wrap items-center justify-between gap-2 p-3")}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant="adminPrimary"
                      onClick={handleDownload}
                      disabled={downloading || !!reportGate}
                      title={reportGate ?? undefined}
                    >
                      <Download className="h-4 w-4" aria-hidden="true" />
                      {downloading ? "Preparing…" : "Download PDF"}
                    </Button>
                    <SendReportButton
                      getPdfs={async () => [
                        await pdfBlob(reportRef.current as HTMLElement, ESG_PDF_OPTS),
                      ]}
                      endpoint={`/api/admin/esg/submissions/${id}/send`}
                      email={sub.email}
                      unavailableReason={reportGate}
                    />
                    {editor.unavailable ? null : (
                      <Button
                        variant="adminSecondary"
                        onClick={editor.start}
                        disabled={!editor.report}
                      >
                        <PencilLine className="h-4 w-4" aria-hidden="true" />
                        Edit report
                      </Button>
                    )}
                  </div>
                  <Button variant="adminGhost" onClick={requestAnalyze}>
                    <RefreshCw className="h-4 w-4" aria-hidden="true" />
                    Re-run analysis
                  </Button>
                </div>
              )}

              <ReportEditProvider value={editing ? editor.editCtx : editor.savedCtx}>
                <ReportPreview
                  caption={
                    editing
                      ? "Edits preview live. Save to use them in the PDF and the emailed copy."
                      : "The PDF and the emailed copy match this sheet."
                  }
                >
                  <EsgReport
                    ref={reportRef}
                    final={viewFinal}
                    yearScore={sub.year_score}
                    companyName={sub.company_name}
                    fy={sub.report_year}
                  />
                </ReportPreview>

                {editing ? (
                  <section
                    aria-labelledby="page-scores-title"
                    className={clsx(CARD, "min-w-0 overflow-hidden")}
                  >
                    <header className="px-5 pt-4 pb-3">
                      <h2 id="page-scores-title" className="text-[15px] font-semibold text-ink">
                        Page scores
                      </h2>
                      <p className="mt-0.5 text-[13px] text-muted">
                        Each pillar score is the average of its page scores. Change one to recompute
                        the average, the composite score and the grades.
                      </p>
                    </header>
                    <div className="overflow-x-auto border-t border-line px-5 pt-2 pb-4">
                      <div className="min-w-[560px]">
                        <PageScoresTables />
                      </div>
                    </div>
                  </section>
                ) : null}
              </ReportEditProvider>
            </>
          )}
        </div>

        <DetailRail
          className={
            showReport
              ? "2xl:sticky 2xl:top-24 2xl:col-start-2 2xl:row-start-1"
              : "xl:sticky xl:top-24 xl:col-start-2 xl:row-start-1"
          }
          title="Submission details"
          badge={<StatusBadge state={submissionState(sub)} label={submissionStatusLabel(sub)} />}
          fileHref={`/api/admin/esg/submissions/${id}/file`}
          rows={[
            { label: "Name", value: sub.name, icon: User },
            { label: "Email", value: sub.email, icon: Mail },
            { label: "Designation", value: sub.designation, icon: BadgeCheck },
            { label: "Company", value: sub.company_name, icon: Building2 },
            { label: "Mobile", value: sub.mobile_number, icon: Phone },
            { label: "FY", value: sub.report_year, icon: CalendarRange },
            { label: "Submitted", value: formatDate(sub.created_at), icon: Clock },
          ]}
        />
      </div>

      <ConfirmDialog
        open={confirmRerun}
        onClose={() => setConfirmRerun(false)}
        title="Re-run the analysis?"
        confirmLabel="Re-run analysis"
        danger
        onConfirm={() => {
          void handleAnalyze();
        }}
      >
        Re-running replaces your edits. The report will be regenerated from the uploaded file and
        every manual change (scores, headings, content and the custom logo) is discarded.
      </ConfirmDialog>
    </div>
  );
}
