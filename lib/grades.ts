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

/** Port of `bfsi_grade()` (esgratings-api/app/bfsi/scoring.py:20-33) — the same
 * gap-free ladder, without truncation (BFSI scores are already `php_round`ed). */
export function bfsiGrade(score: number): { grade: Grade; label: string } {
  const grade = ladder(score);
  return { grade, label: GRADE_LABELS[grade] };
}

const FY_RE = /^(\d{4})-(\d{4})$/;

/** "2024-2025" -> "FY 24-25". Port of `get_formatted_report_year()`
 * (esg_score_calculator-master/utils/get_html.py:34-38) — an unparsable or
 * "N/A" input is returned unchanged/as "N/A". */
export function fyShort(fy: string): string {
  if (!fy || fy === "N/A") return "N/A";
  const m = FY_RE.exec(fy);
  if (!m) return fy;
  return `FY ${m[1].slice(2)}-${m[2].slice(2)}`;
}

/** "2024-2025" -> "2023-2024". Port of `get_previous_financial_year()`
 * (esg_score_calculator-master/utils/get_html.py:40-42). */
export function prevFy(fy: string): string {
  const m = FY_RE.exec(fy);
  if (!m) return fy;
  const start = Number(m[1]) - 1;
  const end = Number(m[2]) - 1;
  return `${start}-${end}`;
}
