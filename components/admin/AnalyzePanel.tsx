"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, ChevronRight, Loader2, RefreshCw, Sparkles } from "lucide-react";
import clsx from "clsx";
import type { AnalysisStatus } from "@/lib/types";
import { parseApiDate } from "@/lib/format";
import Button from "@/components/ui/Button";
import IconTile from "./IconTile";
import { CARD } from "./styles";

const INITIAL_SECONDS = 240;
const RESET_SECONDS = 300;
const POLL_MS = 5000;

type AnalyzePanelProps = {
  status: AnalysisStatus;
  error?: string | null;
  /** `analysis_started_at` — used to resume the countdown correctly across a
   * page refresh instead of always restarting at 240s. */
  startedAt?: string | null;
  /** Kicks off (or retries) the analysis job — `POST …/analyze`. */
  onStart: () => void | Promise<void>;
  /** Re-fetches the submission — called every 5s while `status === "running"`. */
  onPoll?: () => void | Promise<void>;
  /** "Generating ESG Report" (default) or "Generating BFSI ESG Report". */
  label?: string;
  /** Copy variant. "esg" (default) keeps esg-report.php's wording. "bfsi"
   * follows bfsi-calculator/admin/report.php:90-126 verbatim: the "Taking some
   * extra time: " prefix leads the sentence, minutes/seconds are always
   * plural, the idle box carries the "AI analysis pending." copy in the
   * `.pending` yellow, and a failure keeps that box, adds "Error: …" (falling
   * back to "analysis failed", report.php:123) and brings the original
   * analyze button back. */
  variant?: "esg" | "bfsi";
};

type Countdown = { secondsLeft: number; extraTime: boolean };

/** Countdown from 240s; once it hits 0 it switches to "Taking some extra
 * time: " and resets to 300s, repeating — esg-report.php's countdown
 * (esg.md §B4). Derived from `startedAt` (rather than a plain decrementing
 * counter) so a page refresh mid-analysis resumes the right phase. */
function computeCountdown(startedAt: string | null | undefined): Countdown {
  // parseApiDate: the API's `analysis_started_at` is naive UTC with no
  // offset, which `new Date()` would misread as local time.
  const startedMs = parseApiDate(startedAt)?.getTime() ?? NaN;
  const elapsed = Number.isFinite(startedMs)
    ? Math.max(0, Math.floor((Date.now() - startedMs) / 1000))
    : 0;
  if (elapsed < INITIAL_SECONDS) {
    return { secondsLeft: INITIAL_SECONDS - elapsed, extraTime: false };
  }
  const overflow = elapsed - INITIAL_SECONDS;
  const remainder = overflow % RESET_SECONDS;
  return { secondsLeft: RESET_SECONDS - remainder, extraTime: true };
}

function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m} minute${m === 1 ? "" : "s"} ${s} second${s === 1 ? "" : "s"}`;
}

/** report.php's `bfsiFmt()` — always "minutes"/"seconds". */
function formatCountdownBfsi(seconds: number): string {
  return `${Math.floor(seconds / 60)} minutes ${seconds % 60} seconds`;
}

const START_LABEL = "Analyze with AI + Generate Report";

/** What the server does, in order — shown under the progress bar. */
const STEPS = ["Extracting text", "Scoring pages", "Building report"];

/** report.php's `.pending` box colours (#fff8e6 / #e0b020 / #6b5000). */
const PENDING_BOX = "rounded-2xl border border-[#e0b020] bg-[#fff8e6] text-[#6b5000]";

/** The analysis states of a submission detail page: the call-to-action card
 * before a report exists, the progress card while the background job runs,
 * and the failed card. Polls the detail endpoint every 5s (via `onPoll`)
 * until `status` is `done` or `failed`. */
export default function AnalyzePanel({
  status,
  error,
  startedAt,
  onStart,
  onPoll,
  label = "Generating ESG Report",
  variant = "esg",
}: AnalyzePanelProps) {
  // Re-render once a second while running so `countdown` (computed fresh
  // below, straight from `startedAt` + `Date.now()`) stays current — the
  // effect only owns the interval subscription, never the countdown value
  // itself, so there's nothing to seed synchronously on mount.
  const [, setTick] = useState(0);
  useEffect(() => {
    if (status !== "running") return;
    const timer = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, [status]);
  const countdown = computeCountdown(startedAt);

  useEffect(() => {
    if (status !== "running" || !onPoll) return;
    const poll = setInterval(() => {
      onPoll();
    }, POLL_MS);
    return () => clearInterval(poll);
  }, [status, onPoll]);

  if (status === "running") {
    return (
      <section aria-label="Analysis in progress" className={clsx(CARD, "p-5 sm:p-6")}>
        <div className="flex items-start gap-4">
          <span
            aria-hidden="true"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand/8 text-brand"
          >
            <Loader2 className="h-5 w-5 motion-safe:animate-spin" strokeWidth={1.75} />
          </span>
          <div className="min-w-0 flex-1">
            {variant === "bfsi" ? (
              <p className="text-[15px] font-semibold text-ink" role="status">
                {countdown.extraTime ? "Taking some extra time: " : ""}
                {label}… Please wait ({formatCountdownBfsi(countdown.secondsLeft)})
              </p>
            ) : (
              <p className="text-[15px] font-semibold text-ink" role="status">
                {label}… Please wait ({countdown.extraTime ? "Taking some extra time: " : ""}
                {formatCountdown(countdown.secondsLeft)})
              </p>
            )}
            <p className="mt-1 text-[13px] text-muted">
              The analysis runs on the server, so you can leave this page. The report appears
              here when it&apos;s ready.
            </p>
          </div>
        </div>
        <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-brand/10" aria-hidden="true">
          <div className="admin-indeterminate h-full w-1/3 rounded-full bg-brand" />
        </div>
        <ol
          aria-label="Analysis steps"
          className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted"
        >
          {STEPS.map((step, i) => (
            <li key={step} className="flex items-center gap-2">
              {i > 0 ? (
                <ChevronRight className="h-3.5 w-3.5 text-slate-300" aria-hidden="true" />
              ) : null}
              {step}
            </li>
          ))}
        </ol>
      </section>
    );
  }

  // "done" only reaches here for an instant — the caller swaps to the report
  // view as soon as the report data is populated — but render nothing rather
  // than flashing the idle card.
  if (status === "done") return null;

  if (variant === "bfsi") {
    // report.php keeps the `.pending` box on failure: the error line shows
    // under the analyze button, which comes back for another try.
    return (
      <section aria-labelledby="analyze-title" className={clsx(PENDING_BOX, "p-5 sm:p-6")}>
        <div className="flex items-start gap-4">
          <span
            aria-hidden="true"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#e0b020]/15 text-[#8a6600]"
          >
            <Sparkles className="h-5 w-5" strokeWidth={1.75} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 id="analyze-title" className="text-[15px] font-semibold">
              Generate the BFSI ESG report
            </h2>
            <p className="mt-1 text-sm">
              <strong>AI analysis pending.</strong> Run the AI document analysis to score the
              uploaded report and generate the full branded report.
            </p>
            <p className="mt-1 text-[13px] opacity-80">It takes about 4 minutes.</p>
            <Button variant="adminPrimary" onClick={() => onStart()} className="mt-4">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              {START_LABEL}
            </Button>
            {status === "failed" ? (
              <p role="alert" className="mt-3 text-sm font-medium break-words">
                Error: {error || "analysis failed"}
              </p>
            ) : null}
          </div>
        </div>
      </section>
    );
  }

  if (status === "failed") {
    return (
      <section
        aria-labelledby="analyze-title"
        className="rounded-2xl border border-red-200 bg-white p-5 shadow-[0_1px_2px_rgba(11,28,57,0.04)] sm:p-6"
      >
        <div className="flex items-start gap-4">
          <IconTile icon={AlertTriangle} tone="red" />
          <div className="min-w-0 flex-1">
            <h2 id="analyze-title" className="text-[15px] font-semibold text-ink">
              The analysis failed
            </h2>
            <p role="alert" className="mt-1 text-sm break-words text-red-700">
              Error: {error ?? "The analysis failed."}
            </p>
            <Button variant="adminPrimary" onClick={() => onStart()} className="mt-4">
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Try again
            </Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section aria-labelledby="analyze-title" className={clsx(CARD, "p-5 sm:p-6")}>
      <div className="flex items-start gap-4">
        <IconTile icon={Sparkles} tone="brand" />
        <div className="min-w-0 flex-1">
          <h2 id="analyze-title" className="text-[15px] font-semibold text-ink">
            Generate the ESG report
          </h2>
          <p className="mt-1 text-sm text-muted">
            No report has been generated for this submission yet.
          </p>
          <p className="mt-0.5 text-sm text-muted">
            The AI reads every page, scores Environment, Social and Governance, and builds the
            report. It takes about 4 minutes.
          </p>
          <Button variant="adminPrimary" onClick={() => onStart()} className="mt-4">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            {START_LABEL}
          </Button>
        </div>
      </div>
    </section>
  );
}
