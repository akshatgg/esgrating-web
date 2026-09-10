"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import type { AnalysisStatus } from "@/lib/types";
import { parseApiDate } from "@/lib/format";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";

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
   * plural, the idle box carries the "AI analysis pending." copy, and a
   * failure brings the original analyze button back. */
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

/** The countdown/spinner shown while a background analysis job runs, plus the
 * idle "start" prompt and the failed/retry state. Polls the detail endpoint
 * every 5s (via `onPoll`) until `status` is `done` or `failed`. */
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
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-line bg-white px-6 py-12 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-calc-blue" aria-hidden="true" />
        {variant === "bfsi" ? (
          <p className="text-sm text-muted" role="status">
            {countdown.extraTime ? "Taking some extra time: " : ""}
            {label}… Please wait ({formatCountdownBfsi(countdown.secondsLeft)})
          </p>
        ) : (
          <p className="text-sm text-muted" role="status">
            {label}… Please wait ({countdown.extraTime ? "Taking some extra time: " : ""}
            {formatCountdown(countdown.secondsLeft)})
          </p>
        )}
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className="flex flex-col gap-3">
        <Alert variant="error">Error: {error ?? "The analysis failed."}</Alert>
        <Button variant="calcBlue" onClick={() => onStart()} className="self-start">
          {variant === "bfsi" ? START_LABEL : "Try again"}
        </Button>
      </div>
    );
  }

  // "done" only reaches here for an instant — the caller swaps to the report
  // view as soon as `final` is populated — but render nothing rather than
  // flashing the idle pending box.
  if (status === "done") return null;

  if (variant === "bfsi") {
    // report.php's `.pending` box (#fff8e6 / #e0b020 / #6b5000).
    return (
      <div className="flex flex-col items-start gap-3 rounded-xl border border-[#e0b020] bg-[#fff8e6] p-[18px] text-sm text-[#6b5000]">
        <p>
          <strong>AI analysis pending.</strong> Run the AI document analysis to score the uploaded
          report and generate the full branded report.
        </p>
        <Button variant="calcBlue" onClick={() => onStart()}>
          {START_LABEL}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-line bg-bg-soft px-6 py-12 text-center">
      <p className="text-sm text-muted">No report has been generated for this submission yet.</p>
      <Button variant="calcBlue" onClick={() => onStart()}>
        {START_LABEL}
      </Button>
    </div>
  );
}
