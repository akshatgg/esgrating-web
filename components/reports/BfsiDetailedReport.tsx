import { forwardRef, Fragment, type ReactNode } from "react";
import type { ChartOptions } from "chart.js";
import type {
  BfsiCategory,
  BfsiOverall,
  BfsiReason,
  BfsiSubmission,
  Grade,
} from "@/lib/types";
import { bfsiGrade, GRADE_COLORS } from "@/lib/grades";
import { asArray, formatUtc, numberFormat, phpFloat } from "@/lib/format";
import Doughnut from "@/components/reports/Doughnut";
import styles from "@/components/reports/BfsiDetailedReport.module.css";

/** report.php / one_pager.php load the logo from
 * esgratings.co.in/wp-content/uploads/2024/10/WhatsApp-Image-2024-10-09-at-14.04.04_db00d97a-e1728803538909.jpg;
 * public/brand/logo.jpg is the byte-identical file. Serving it same-origin
 * lets html2canvas draw it into the PDF (a cross-origin image is skipped). */
export const BFSI_REPORT_LOGO = "/brand/logo.jpg";

const CATEGORIES: ReadonlyArray<readonly [BfsiCategory, string]> = [
  ["E", "Environment"],
  ["S", "Social"],
  ["G", "Governance"],
];

const PILLARS = [
  { key: "e", pillar: "Environment", color: "#1e8e5a" },
  { key: "s", pillar: "Social", color: "#2166b8" },
  { key: "g", pillar: "Governance", color: "#c98a12" },
] as const;

// report.php:270-280 — default Chart.js doughnut, legend at the bottom.
// Animation is off so a PDF captured right after mount isn't mid-tween.
const DOUGHNUT_COLORS = ["#1e8e5a", "#2166b8", "#c98a12"];
const DOUGHNUT_OPTIONS: ChartOptions<"doughnut"> = {
  plugins: { legend: { position: "bottom" } },
  animation: false,
};

// report.php:257-262 — ranges match bfsi_grade() exactly.
const SCORE_SCALE: ReadonlyArray<readonly [string, Grade, string]> = [
  ["> 90", "A+", "Outstanding"],
  ["80 – 90", "A", "Excellent"],
  ["71 – <80", "B+", "Very Good"],
  ["61 – <71", "B", "Good"],
  ["40 – <61", "C", "Average"],
  ["< 40", "D", "Below Average"],
];

/** `bfsi_grade_color()` (report.php:19-26). */
export function bfsiGradeColor(grade: string): string {
  return GRADE_COLORS[grade as Grade] ?? "#c0392b";
}

/** `nl2br(htmlspecialchars($text))`. */
function nl2br(text: string): ReactNode {
  return text.split(/\r\n|\r|\n/).map((line, i) => (
    <Fragment key={i}>
      {i > 0 ? <br /> : null}
      {line}
    </Fragment>
  ));
}

function isReason(r: BfsiReason | string): r is BfsiReason {
  return typeof r === "object" && r !== null;
}

type BfsiDetailedReportProps = {
  submission: BfsiSubmission;
  /** From the API — recomputed from the stored E/S/G (report.php:17). */
  overall: BfsiOverall;
  /** `bfsi_recommendation(grade)`, from the API. */
  recommendation: string;
};

/** Port of report.php's `#bfsiReport` card (sections 1–9, bfsi.md §3). The ref
 * points at the card root, for `lib/pdf.ts`. Renders nothing without an
 * `ai_analysis`. */
const BfsiDetailedReport = forwardRef<HTMLDivElement, BfsiDetailedReportProps>(
  function BfsiDetailedReport({ submission: sub, overall, recommendation }, ref) {
    const ai = sub.ai_analysis;
    if (!ai) return null;

    const scores = { e: sub.e_score ?? 0, s: sub.s_score ?? 0, g: sub.g_score ?? 0 };
    const color = bfsiGradeColor(overall.grade);
    const reasons = ai.reasons ?? {};
    // PHP `!empty($ai['reasons'])`: shown whenever the reasons map has keys.
    const hasReasons = Object.keys(reasons).length > 0;

    return (
      <div ref={ref} className={styles.card}>
        {/* 1. Header */}
        <div className={styles["report-header"]}>
          {/* eslint-disable-next-line @next/next/no-img-element -- plain <img> so html2canvas can capture it */}
          <img src={BFSI_REPORT_LOGO} alt="ESG Ratings logo" />
          <div>
            <h2>BFSI ESG Credit Risk Report — Detailed Assessment</h2>
            <div style={{ color: "#5c6b82", fontSize: 13 }}>
              {sub.borrower_name} · {formatUtc(sub.created_at, "Y-m-d H:i")}
            </div>
          </div>
        </div>

        {/* 2. Doughnut + overall */}
        <div className={styles["score-row"]}>
          <div className={styles["doughnut-box"]}>
            <Doughnut
              environmental={scores.e}
              social={scores.s}
              governance={scores.g}
              colors={DOUGHNUT_COLORS}
              options={DOUGHNUT_OPTIONS}
              borderWidth={2}
            />
          </div>
          <div>
            <div style={{ fontSize: 15, color: "#5c6b82" }}>Overall Score</div>
            <div style={{ fontSize: 36, fontWeight: 700, color: "#0b1c39" }}>
              {phpFloat(overall.overall)}
            </div>
            <span className={styles.badge} style={{ background: color }}>
              {overall.grade} — {overall.label}
            </span>
          </div>
        </div>

        {/* 3. Marks by Pillar */}
        <h3>Marks by Pillar</h3>
        <p className={styles["factor-note"]}>
          Assessed on the <b>{overall.weightage_row}</b> weighting (loan type: {sub.loan_type}).
          Each pillar&apos;s weight is the marks available for it.
        </p>
        <table className={styles.data}>
          <tbody>
            <tr>
              <th>Pillar</th>
              <th>Marks</th>
              <th>Out of</th>
              <th>Grade</th>
            </tr>
            {PILLARS.map((p) => {
              const score = scores[p.key];
              const max = overall.weights[p.key];
              return (
                <tr key={p.key}>
                  <td>
                    <span className={styles.swatch} style={{ background: p.color }} />
                    <b>{p.pillar}</b>
                  </td>
                  <td>
                    <b>{numberFormat((max * score) / 100, 2)}</b>
                  </td>
                  <td>{phpFloat(max)}</td>
                  <td>{bfsiGrade(score).grade}</td>
                </tr>
              );
            })}
            <tr className={styles["factor-total"]}>
              <td>
                <b>Total</b>
              </td>
              <td>
                <b>{phpFloat(overall.overall)}</b>
              </td>
              <td>100</td>
              <td>
                <b>
                  {overall.grade} — {overall.label}
                </b>
              </td>
            </tr>
          </tbody>
        </table>

        {/* 4. Rating Summary */}
        <h3>Rating Summary</h3>
        <p>
          This borrower has been assessed with an overall ESG credit risk score of{" "}
          <b>{phpFloat(overall.overall)}</b> (Grade{" "}
          <b>
            {overall.grade} — {overall.label}
          </b>
          ), based on a weighted analysis of the uploaded sustainability/ESG report (E:{" "}
          {phpFloat(scores.e)}, S: {phpFloat(scores.s)}, G: {phpFloat(scores.g)}).
        </p>

        {/* 5. Risks, improvements, climate, governance */}
        <h3>Top 5 Risks</h3>
        <ul className={styles.risks}>
          {asArray(ai.top_risks)
            .slice(0, 5)
            .map((risk, i) => (
              <li key={i}>{risk}</li>
            ))}
        </ul>

        <h3>Top 5 Improvements</h3>
        <ul className={styles.risks}>
          {asArray(ai.top_improvements)
            .slice(0, 5)
            .map((imp, i) => (
              <li key={i}>{imp}</li>
            ))}
        </ul>

        <h3>Climate Risk</h3>
        <p>{nl2br(ai.climate_risk ?? "")}</p>

        <h3>Governance Summary</h3>
        <p>{nl2br(ai.governance_summary ?? "")}</p>

        {/* 6. Signals by Category */}
        <h3>Signals by Category</h3>
        <table className={styles.data}>
          <tbody>
            <tr>
              <th>Category</th>
              <th>Positive signals</th>
              <th>Negative signals</th>
            </tr>
            {CATEGORIES.map(([ck, label]) => {
              const pos = asArray(ai.keywords?.[ck]);
              const neg = asArray(ai.negative_keywords?.[ck]);
              return (
                <tr key={ck}>
                  <td>
                    <b>{label}</b>
                  </td>
                  <td>{pos.length ? pos.join(", ") : "—"}</td>
                  <td className={styles.neg}>{neg.length ? neg.join(", ") : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* 7. Scoring Rationale */}
        {hasReasons ? (
          <>
            <h3>Scoring Rationale</h3>
            <p style={{ color: "#5c6b82", fontSize: 13, marginTop: 0 }}>
              Every page of the uploaded report is scored on its own. Each line below cites the page
              it came from.
            </p>
            {CATEGORIES.map(([ck, label]) => {
              const rs = asArray(reasons[ck]);
              if (rs.length === 0) return null;
              return (
                <details key={ck} className={styles.rationale}>
                  <summary>
                    {label} — {rs.length} page{rs.length === 1 ? "" : "s"} scored
                  </summary>
                  <ul>
                    {rs.map((r, i) =>
                      isReason(r) ? (
                        <li key={i}>
                          <span className={styles.cite}>
                            p.{Math.trunc(Number(r.page ?? 0)) || 0}
                            {r.score !== null && r.score !== undefined
                              ? ` · ${phpFloat(Number(r.score))}`
                              : ""}
                          </span>
                          {String(r.reason ?? "")}
                        </li>
                      ) : (
                        <li key={i}>{String(r)}</li>
                      ),
                    )}
                  </ul>
                </details>
              );
            })}
          </>
        ) : null}

        {/* 8. Score Scale */}
        <h3>Score Scale</h3>
        <table className={styles.data}>
          <tbody>
            <tr>
              <th>Range</th>
              <th>Grade</th>
              <th>Label</th>
            </tr>
            {SCORE_SCALE.map(([range, grade, label]) => (
              <tr key={grade}>
                <td>{range}</td>
                <td>{grade}</td>
                <td>{label}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* 9. Recommended Lending Decision */}
        <h3>Recommended Lending Decision</h3>
        <p style={{ fontWeight: 700, color }}>{recommendation}</p>
      </div>
    );
  },
);

export default BfsiDetailedReport;
