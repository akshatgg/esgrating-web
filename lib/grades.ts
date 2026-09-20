// Grade/label helpers ported verbatim from the Python originals — see
// ../esg_score_calculator-master/utils/helper.py::evaluate_score (ESG) and
// ../esgratings-api/app/bfsi/scoring.py::bfsi_grade (BFSI). Both are the same
// gap-free ladder; ESG additionally truncates the score first (`int(score)`).
import type { Grade } from "@/lib/types";

/** Brand grade colours (docs/sdd/web-task-W6-brief.md's plan header). */
export const GRADE_COLORS: Record<Grade, string> = {
  "A+": "#1e8e5a",
  A: "#1e8e5a",
  "B+": "#2166b8",
  B: "#2166b8",
  C: "#c98a12",
  D: "#c0392b",
};

export const GRADE_LABELS: Record<Grade, string> = {
  "A+": "Outstanding",
  A: "Excellent",
  "B+": "Very Good",
  B: "Good",
  C: "Average",
  D: "Below Average",
};

function ladder(score: number): Grade {
  if (score > 90) return "A+";
  if (score >= 80) return "A";
  if (score >= 71) return "B+";
  if (score >= 61) return "B";
  if (score >= 40) return "C";
  return "D";
}

/** Port of `evaluate_score()` (esg_score_calculator-master/utils/helper.py:99-119).
 * Uses `Math.trunc`, matching Python's `int(score)` truncation-toward-zero. */
export function esgEvaluate(score: number): { grade: Grade; label: string } {
  const grade = ladder(Math.trunc(score));
  return { grade, label: GRADE_LABELS[grade] };
}

/** Port of `bfsi_grade()` (esgratings-api/app/bfsi/scoring.py) — the same
 * gap-free ladder. `whole` (KPI-scored reports) truncates first, as ESG does;
 * older reports grade the `php_round`ed score as it is. */
export function bfsiGrade(score: number, whole = false): { grade: Grade; label: string } {
  const grade = ladder(whole ? Math.trunc(score) : score);
  return { grade, label: GRADE_LABELS[grade] };
}

const FY_RE = /^(\d{4})-(\d{4})$/;
// A single reporting year ("2025"), for companies whose reporting period is one
// calendar year (user, 2026-09-20). It prints as typed — fyShort() leaves an input
// FY_RE does not match alone — so only prevFy() has to know about it.
const YEAR_RE = /^(\d{4})$/;

/** "2024-2025" -> "FY 24-25"; a single year ("2025") and any other unparsable
 * input are returned unchanged. Port of `get_formatted_report_year()`
 * (esg_score_calculator-master/utils/get_html.py:34-38) — "N/A" stays "N/A". */
export function fyShort(fy: string): string {
  if (!fy || fy === "N/A") return "N/A";
  const m = FY_RE.exec(fy);
  if (!m) return fy;
  return `FY ${m[1].slice(2)}-${m[2].slice(2)}`;
}

/** "2024-2025" -> "2023-2024", "2025" -> "2024". Port of
 * `get_previous_financial_year()`
 * (esg_score_calculator-master/utils/get_html.py:40-42). */
export function prevFy(fy: string): string {
  const y = YEAR_RE.exec(fy);
  if (y) return String(Number(y[1]) - 1);
  const m = FY_RE.exec(fy);
  if (!m) return fy;
  const start = Number(m[1]) - 1;
  const end = Number(m[2]) - 1;
  return `${start}-${end}`;
}

// --- Indian FY (1 Apr – 31 Mar) of a date, read in UTC -----------------------
// Ports of the BFSI one-pager's `bfsi_fy_*()` helpers (one_pager.php), shared by
// BfsiOnePager and the ESG Rating List one-pager (EsgRatingOnePager).

/** `bfsi_fy_bounds()` — the Indian FY (1 Apr – 31 Mar) containing `d` (now if null). */
export function fyBounds(d: Date | null): [number, number] {
  const x = d ?? new Date();
  const y = x.getUTCFullYear();
  const start = x.getUTCMonth() + 1 >= 4 ? y : y - 1;
  return [start, start + 1];
}

/** `bfsi_fy_full()` — "2024-2025". */
export function fyFull(d: Date | null): string {
  const [a, b] = fyBounds(d);
  return `${a}-${b}`;
}

/** `bfsi_fy_short()` — "FY 24-25", optionally shifted by whole years. */
export function fyShortOf(d: Date | null, offsetYears = 0): string {
  const [a, b] = fyBounds(d);
  return `FY ${String(a + offsetYears).slice(-2)}-${String(b + offsetYears).slice(-2)}`;
}
