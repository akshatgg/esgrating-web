import clsx from "clsx";
import { GRADE_COLORS } from "@/lib/grades";
import type { Grade } from "@/lib/types";

// Status pills, grade chips and ESG/BFSI kind tags for the superadmin console
// (docs/sdd/web-task-admin-redesign-brief.md "Badges").

export type SubmissionState = "new" | "running" | "generated" | "sent" | "failed";

/** Collapses a submission's `status` + `analysis_status` into one pipeline
 * stage. A running/failed analysis wins over the stored status — the same
 * precedence as the API's dashboard counts and the ESG list's status column. */
export function submissionState(s: {
  status?: string | null;
  analysis_status?: string | null;
}): SubmissionState {
  if (s.analysis_status === "running") return "running";
  if (s.analysis_status === "failed") return "failed";
  if (s.status === "sent") return "sent";
  if (s.status === "report_generated") return "generated";
  return "new";
}

/** Stage colours, shared with the dashboard's pipeline donut so a stage reads
 * the same everywhere. */
export const STATE_COLORS: Record<SubmissionState, string> = {
  new: "#94a3b8",
  running: "#3147ff",
  generated: "#10b981",
  sent: "#8b5cf6",
  failed: "#ef4444",
};

const STATE_STYLE: Record<SubmissionState, { label: string; className: string }> = {
  new: { label: "New", className: "bg-slate-100 text-slate-700 ring-slate-200" },
  running: { label: "Analyzing", className: "bg-brand/8 text-brand ring-brand/20" },
  generated: { label: "Generated", className: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  sent: { label: "Sent", className: "bg-violet-50 text-violet-700 ring-violet-200" },
  failed: { label: "Failed", className: "bg-red-50 text-red-700 ring-red-200" },
};

export function StatusBadge({
  state,
  label,
  className,
}: {
  state: SubmissionState;
  /** Overrides the default stage label. */
  label?: string;
  className?: string;
}) {
  const style = STATE_STYLE[state];
  return (
    <span
      className={clsx(
        "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        style.className,
        className,
      )}
    >
      <span className="relative flex h-1.5 w-1.5" aria-hidden="true">
        {state === "running" ? (
          <span className="absolute inline-flex h-full w-full rounded-full bg-brand opacity-60 motion-safe:animate-ping" />
        ) : null}
        <span
          className="relative inline-flex h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: STATE_COLORS[state] }}
        />
      </span>
      {label ?? style.label}
    </span>
  );
}

/** Grade letter in its brand grade colour (lib/grades.ts GRADE_COLORS). An
 * unknown grade falls back to muted; a missing one renders an em dash. */
export function GradeChip({
  grade,
  className,
}: {
  grade: string | null | undefined;
  className?: string;
}) {
  if (!grade) return <span className="text-muted">—</span>;
  const color = GRADE_COLORS[grade as Grade] ?? "#5b6b85";
  return (
    <span
      className={clsx(
        "inline-flex min-w-8 shrink-0 items-center justify-center rounded-md px-1.5 py-0.5 text-xs font-bold tabular-nums",
        className,
      )}
      style={{ color, backgroundColor: `${color}14`, boxShadow: `inset 0 0 0 1px ${color}33` }}
    >
      {grade}
    </span>
  );
}

/** "ESG" / "BFSI" tag for mixed lists (Needs attention). */
export function KindBadge({ kind }: { kind: "esg" | "bfsi" }) {
  return (
    <span
      className={clsx(
        "inline-flex w-11 shrink-0 justify-center rounded-md px-1.5 py-0.5 text-[11px] font-semibold tracking-wide",
        kind === "esg" ? "bg-brand/8 text-brand" : "bg-teal-500/10 text-teal-700",
      )}
    >
      {kind.toUpperCase()}
    </span>
  );
}
