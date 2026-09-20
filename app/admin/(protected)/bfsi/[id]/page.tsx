"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Clock,
  Download,
  Factory,
  FileSpreadsheet,
  Hash,
  IndianRupee,
  Layers,
  Loader2,
  Mail,
  PencilLine,
  RefreshCw,
  Tag,
  Target,
  User,
  Wallet,
} from "lucide-react";
import clsx from "clsx";
import type { BfsiDetail } from "@/lib/types";
import { apiFetch, apiFetchBlob, ApiError } from "@/lib/api";
import { formatUtc, numberFormat, slugify } from "@/lib/format";
import { BFSI_PDF_OPTS, downloadPdf, ONE_PAGER_PDF_OPTS, pdfBlob } from "@/lib/pdf";
import { bfsiView, type BfsiEffective } from "@/lib/reportEdits";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import AnalyzePanel from "@/components/admin/AnalyzePanel";
import CacheToggle from "@/components/admin/CacheToggle";
import SendReportButton from "@/components/admin/SendReportButton";
import RatingSummaryButton from "@/components/admin/RatingSummaryButton";
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
import { CARD, FOCUS_RING } from "@/components/admin/styles";
import BfsiDetailedReport from "@/components/reports/BfsiDetailedReport";
import BfsiOnePager from "@/components/reports/BfsiOnePager";
import { ReportEditProvider } from "@/components/reports/edit/ReportEdit";

const LIST_CRUMBS = [
  { label: "Dashboard", href: "/admin" },
  { label: "BFSI Submissions", href: "/admin/bfsi" },
];

/** The one-page rating report and the detailed report, side by side as tabs (as on ESG). */
const REPORT_TABS = [
  ["onepager", "One-Page Rating Report"],
  ["detailed", "Detailed Report"],
] as const;

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
  const [exportingCsv, setExportingCsv] = useState(false);
  const [confirmRerun, setConfirmRerun] = useState(false);
  // Off by default: every run scores the report fresh unless the admin ticks the box.
  const [useCache, setUseCache] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);
  const [tab, setTab] = useState<(typeof REPORT_TABS)[number][0]>("onepager");
  const onePagerRef = useRef<HTMLDivElement>(null);
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

  const editor = useReportEditor<BfsiEffective>("bfsi", id, {
    enabled:
      !!detail?.submission.ai_analysis && detail.submission.analysis_status !== "running",
    onSaved: reload,
  });

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
      await apiFetch(
        `/api/admin/bfsi/submissions/${id}/analyze?use_cache=${useCache}`,
        { method: "POST" },
      );
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
    // Downloads whichever report the tabs show; the names match Send report's attachments.
    const onePager = tab === "onepager" && !editor.editing;
    const el = onePager ? onePagerRef.current : reportRef.current;
    if (!el) return;
    setDownloading(true);
    setActionError(null);
    try {
      await downloadPdf(
        el,
        onePager ? `esg-rating-report-${id}.pdf` : `bfsi-detailed-report-${id}.pdf`,
        onePager ? ONE_PAGER_PDF_OPTS : BFSI_PDF_OPTS,
      );
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
    return [await pdfBlob(detailed, BFSI_PDF_OPTS), await pdfBlob(onePager, ONE_PAGER_PDF_OPTS)];
  }

  /** Same page-scores sheet as the ESG report: one row per page and category. */
  async function handleExportCsv() {
    const name = detail?.submission.borrower_name || "report";
    setExportingCsv(true);
    setActionError(null);
    try {
      const blob = await apiFetchBlob(`/api/admin/bfsi/submissions/${id}/export_csv`);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `bfsi-page-scores-${slugify(name)}-${id.slice(0, 6)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      setExportingCsv(false);
    }
  }

  if (!detail && !loadError) {
    return <DetailSkeleton />;
  }

  if (loadError || !detail) {
    return (
      <div className="flex flex-col gap-5">
        <PageHeader crumbs={[...LIST_CRUMBS, { label: "Submission" }]} title="BFSI submission" />
        <Alert variant="error">{loadError ?? "Submission not found."}</Alert>
        <Button variant="adminSecondary" href="/admin/bfsi" className="self-start">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Submissions
        </Button>
      </div>
    );
  }

  const { submission: sub, overall, recommendation, previous, industry_label } = detail;
  const ai = sub.ai_analysis;
  const running = sub.analysis_status === "running";
  const showReport = !running && !!ai && !!overall;
  const editing = editor.editing;
  // This page edits the detailed report, so the one-page tab steps aside meanwhile.
  const onePagerView = tab === "onepager" && !editing;

  // What the sheets render: the effective (edited / previewed) report when
  // there is one, else the stored detail exactly as before.
  const live = editor.liveEffective
    ? bfsiView(sub, editor.liveEffective, editor.pages)
    : overall
      ? { submission: sub, overall, recommendation: recommendation ?? "", grades: undefined }
      : null;
  const saved =
    editor.report?.edited
      ? bfsiView(sub, editor.report.effective, editor.report.pages)
      : overall
        ? { submission: sub, overall, recommendation: recommendation ?? "", grades: undefined }
        : null;
  // Download and Send render the saved edits, so they wait for GET …/report.
  const reportGate = editor.report
    ? null
    : editor.loadError
      ? "The saved report couldn't be loaded."
      : "Loading the saved report…";

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        crumbs={[...LIST_CRUMBS, { label: sub.borrower_name }]}
        title={sub.borrower_name}
        description={[industry_label, sub.sub_sector].filter(Boolean).join(", ")}
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

          {!showReport || !ai || !live || !saved ? (
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
                      {downloading
                        ? "Preparing…"
                        : onePagerView
                          ? "Download One-Page Report (PDF)"
                          : "Download Detailed Report (PDF)"}
                    </Button>
                    <SendReportButton
                      getPdfs={getPdfs}
                      endpoint={`/api/admin/bfsi/submissions/${id}/send`}
                      templateEndpoint="/api/admin/bfsi/mail-template"
                      email={sub.contact_email}
                      fieldName="pdfs"
                      attachments={
                        sub.ai_analysis?.kpi_coverage
                          ? ["One-Page Rating Report", "Detailed Report", "Rating Summary (Word)"]
                          : ["One-Page Rating Report", "Detailed Report"]
                      }
                      unavailableReason={reportGate}
                    />
                    <Button
                      variant="adminSecondary"
                      onClick={handleExportCsv}
                      disabled={exportingCsv}
                      aria-label="Download page scores as CSV"
                    >
                      {exportingCsv ? (
                        <Loader2 className="h-4 w-4 motion-safe:animate-spin" aria-hidden="true" />
                      ) : (
                        <FileSpreadsheet className="h-4 w-4" aria-hidden="true" />
                      )}
                      {exportingCsv ? "Preparing…" : "Download page scores (CSV)"}
                    </Button>
                    {sub.ai_analysis?.kpi_coverage ? (
                      <RatingSummaryButton
                        endpoint={`/api/admin/bfsi/submissions/${id}/summary`}
                        fileName={`bfsi-rating-summary-${slugify(sub.borrower_name || "report")}-${id.slice(0, 6)}.docx`}
                        onError={setActionError}
                      />
                    ) : null}
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
                  <div className="flex flex-wrap items-center gap-3">
                    <CacheToggle checked={useCache} onChange={setUseCache} />
                    <Button variant="adminGhost" onClick={requestAnalyze}>
                      <RefreshCw className="h-4 w-4" aria-hidden="true" />
                      Re-run analysis
                    </Button>
                  </div>
                </div>
              )}

              {!editing ? (
                <div
                  role="tablist"
                  aria-label="Report view"
                  className="flex self-start gap-1 rounded-xl border border-line bg-white p-1"
                >
                  {REPORT_TABS.map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      role="tab"
                      aria-selected={tab === key}
                      onClick={() => setTab(key)}
                      className={clsx(
                        "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                        tab === key ? "bg-navy text-white" : "text-muted hover:text-ink",
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              ) : null}

              <ReportPreview
                caption={
                  editing
                    ? "Edits preview live. Save to use them in the PDFs and the email."
                    : onePagerView
                      ? "The one-page rating report. Send report attaches this and the detailed report."
                      : "Send report attaches this and the one-page report."
                }
              >
                {/* The same 750px sheet width as the off-screen copies below. */}
                <div
                  role="region"
                  aria-label={onePagerView ? "One-page rating report" : "Detailed report"}
                  tabIndex={0}
                  className={clsx("overflow-x-auto", FOCUS_RING)}
                >
                  <div className="mx-auto w-[750px] pt-5">
                    <ReportEditProvider value={editing ? editor.editCtx : editor.savedCtx}>
                      {onePagerView ? (
                        <BfsiOnePager
                          ref={onePagerRef}
                          submission={live.submission}
                          overall={live.overall}
                          previous={previous}
                          industryLabel={industry_label}
                          grades={live.grades}
                        />
                      ) : (
                        <BfsiDetailedReport
                          ref={reportRef}
                          submission={live.submission}
                          overall={live.overall}
                          recommendation={live.recommendation}
                          grades={live.grades}
                          narrative={editor.report?.narrative}
                        />
                      )}
                    </ReportEditProvider>
                  </div>
                </div>
              </ReportPreview>

              {/* Off-screen render of both sheets for "Send report" — always the
                  saved report. Not display:none, so the Chart.js canvases get a
                  real size to draw into. */}
              <div
                aria-hidden="true"
                inert
                className="pointer-events-none fixed left-[-10000px] top-0 w-[750px]"
              >
                <ReportEditProvider value={editor.savedCtx}>
                  <BfsiDetailedReport
                    ref={pdfDetailedRef}
                    submission={saved.submission}
                    overall={saved.overall}
                    recommendation={saved.recommendation}
                    grades={saved.grades}
                    narrative={editor.report?.narrative}
                  />
                  <BfsiOnePager
                    ref={pdfOnePagerRef}
                    submission={saved.submission}
                    overall={saved.overall}
                    previous={previous}
                    industryLabel={industry_label}
                    grades={saved.grades}
                  />
                </ReportEditProvider>
              </div>
            </>
          )}
        </div>

        {/* report.php's "Borrower & Loan Details" card — its 12 pairs, with the
            status as the header badge and the upload as the footer button. */}
        <DetailRail
          className={
            showReport
              ? "2xl:sticky 2xl:top-24 2xl:col-start-2 2xl:row-start-1"
              : "xl:sticky xl:top-24 xl:col-start-2 xl:row-start-1"
          }
          title="Borrower & Loan Details"
          badge={<StatusBadge state={submissionState(sub)} label={submissionStatusLabel(sub)} />}
          fileHref={`/api/admin/bfsi/submissions/${id}/file`}
          fileCaption="Uploaded Report"
          rows={[
            { label: "Borrower", value: sub.borrower_name, icon: User },
            { label: "CIN / GSTIN", value: sub.cin_gstin, icon: Hash },
            { label: "Industry", value: industry_label, icon: Factory },
            { label: "Sub-sector", value: sub.sub_sector, icon: Layers },
            {
              label: "Loan Amount",
              value: `₹${numberFormat(sub.loan_amount)}`,
              icon: IndianRupee,
            },
            {
              label: "Outstanding Loans",
              value: `₹${numberFormat(sub.outstanding_loans)}`,
              icon: Wallet,
            },
            { label: "Loan Purpose", value: sub.loan_purpose, icon: Target },
            { label: "Loan Type", value: sub.loan_type, icon: Tag },
            { label: "Contact Email", value: sub.contact_email, icon: Mail },
            { label: "Submitted", value: formatUtc(sub.created_at, "Y-m-d H:i"), icon: Clock },
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
