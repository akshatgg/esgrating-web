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
import { LIST_MAX } from "@/lib/reportEdits";
import Doughnut from "@/components/reports/Doughnut";
import {
  EditableHeading,
  EditableListItems,
  EditableLogo,
  EditableText,
  KeywordChips,
  PillarScore,
  useField,
  useReportEdit,
} from "@/components/reports/edit/ReportEdit";
import PageScoresTables from "@/components/reports/edit/PageScoresPanel";
import KpiAssessment from "@/components/reports/KpiAssessment";
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
  { key: "e", cat: "E", pillar: "Environment", color: "#1e8e5a" },
  { key: "s", cat: "S", pillar: "Social", color: "#2166b8" },
  { key: "g", cat: "G", pillar: "Governance", color: "#c98a12" },
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

type Keywords = Partial<Record<BfsiCategory, string[]>>;

/** Server pillar grades (`effective.grades`), used in edit and edited views. */
export type PillarGrades = Partial<Record<BfsiCategory, { grade: Grade; label: string }>>;

type BfsiDetailedReportProps = {
  submission: BfsiSubmission;
  /** From the API — recomputed from the stored E/S/G (report.php:17). */
  overall: BfsiOverall;
  /** `bfsi_recommendation(grade)`, from the API. */
  recommendation: string;
  /** Pillar grades from the server; without them the display ladder is used. */
  grades?: PillarGrades;
};

/** Port of report.php's `#bfsiReport` card (sections 1–9, bfsi.md §3). The ref
 * points at the card root, for `lib/pdf.ts`. Renders nothing without an
 * `ai_analysis`. Inside a `ReportEditProvider` in edit mode, headings, text,
 * lists, keywords, the logo and the pillar scores become inline editors and the
 * Scoring Rationale becomes the editable page-scores table. */
const BfsiDetailedReport = forwardRef<HTMLDivElement, BfsiDetailedReportProps>(
  function BfsiDetailedReport({ submission: sub, overall, recommendation, grades }, ref) {
    const ai = sub.ai_analysis;
    const edit = useReportEdit();
    const editing = edit?.editing ?? false;
    const company = useField("company", sub.borrower_name);
    const risks = useField("top_risks", asArray(ai?.top_risks));
    const improvements = useField("top_improvements", asArray(ai?.top_improvements));
    const climate = useField("climate_risk", ai?.climate_risk ?? "");
    const governance = useField("governance_summary", ai?.governance_summary ?? "");
    // Category overrides lay over the report's own keywords (as on the server),
    // so a category without an override keeps its AI list.
    const keywords: Keywords = { ...(ai?.keywords ?? {}), ...useField<Keywords>("keywords", {}) };
    const negKeywords: Keywords = {
      ...(ai?.negative_keywords ?? {}),
      ...useField<Keywords>("negative_keywords", {}),
    };
    const decision = useField("recommendation", recommendation);
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
          <EditableLogo defaultSrc={BFSI_REPORT_LOGO} alt="ESG Ratings logo" />
          <div style={editing ? { flex: 1 } : undefined}>
            <EditableHeading k="report_title" as="h2">
              BFSI ESG Credit Risk Report — Detailed Assessment
            </EditableHeading>
            <div style={{ color: "#5c6b82", fontSize: 13 }}>
              {editing ? (
                <span style={{ display: "flex", gap: 6, alignItems: "baseline" }}>
                  <span style={{ flex: 1 }}>
                    <EditableText k="company" label="Company" value={company} />
                  </span>
                  <span>· {formatUtc(sub.created_at, "Y-m-d H:i")}</span>
                </span>
              ) : (
                <>
                  {company} · {formatUtc(sub.created_at, "Y-m-d H:i")}
                </>
              )}
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
        <EditableHeading k="marks_by_pillar">Marks by Pillar</EditableHeading>
        <p className={styles["factor-note"]}>
          Assessed on the <b>{overall.weightage_row}</b> weighting (loan type: {sub.loan_type}).
          Each pillar&apos;s weight is the marks available for it.
        </p>
        <table className={styles.data}>
          <tbody>
            <tr>
              <th>Pillar</th>
              {editing ? <th>Score</th> : null}
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
                  {editing ? (
                    <td>
                      <PillarScore cat={p.cat} pillar={p.pillar} score={score}>
                        {phpFloat(score)}
                      </PillarScore>
                    </td>
                  ) : null}
                  <td>
                    <b>{numberFormat((max * score) / 100, 2)}</b>
                  </td>
                  <td>{phpFloat(max)}</td>
                  <td>{(grades?.[p.cat] ?? bfsiGrade(score)).grade}</td>
                </tr>
              );
            })}
            <tr className={styles["factor-total"]}>
              <td>
                <b>Total</b>
              </td>
              {editing ? <td /> : null}
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
        <EditableHeading k="rating_summary">Rating Summary</EditableHeading>
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
        <EditableHeading k="top_risks">Top 5 Risks</EditableHeading>
        <ul className={styles.risks}>
          <EditableListItems
            k="top_risks"
            label="Risk"
            items={editing ? risks : risks.slice(0, 5)}
            max={LIST_MAX}
            shown={5}
          />
        </ul>

        <EditableHeading k="top_improvements">Top 5 Improvements</EditableHeading>
        <ul className={styles.risks}>
          <EditableListItems
            k="top_improvements"
            label="Improvement"
            items={editing ? improvements : improvements.slice(0, 5)}
            max={LIST_MAX}
            shown={5}
          />
        </ul>

        <EditableHeading k="climate_risk">Climate Risk</EditableHeading>
        <p>
          <EditableText k="climate_risk" label="Climate risk" value={climate} multiline>
            {nl2br(climate)}
          </EditableText>
        </p>

        <EditableHeading k="governance_summary">Governance Summary</EditableHeading>
        <p>
          <EditableText k="governance_summary" label="Governance summary" value={governance} multiline>
            {nl2br(governance)}
          </EditableText>
        </p>

        {/* 6. Signals by Category */}
        <EditableHeading k="signals">Signals by Category</EditableHeading>
        <table className={styles.data}>
          <tbody>
            <tr>
              <th>Category</th>
              <th>Positive signals</th>
              <th>Negative signals</th>
            </tr>
            {CATEGORIES.map(([ck, label]) => {
              const pos = asArray(keywords[ck]);
              const neg = asArray(negKeywords[ck]);
              return (
                <tr key={ck}>
                  <td>
                    <b>{label}</b>
                  </td>
                  <td>
                    <KeywordChips
                      label={`${label} positive signals`}
                      values={pos}
                      onChange={(next) => edit?.setField?.("keywords", { ...keywords, [ck]: next })}
                    >
                      {pos.length ? pos.join(", ") : "—"}
                    </KeywordChips>
                  </td>
                  <td className={styles.neg}>
                    <KeywordChips
                      label={`${label} negative signals`}
                      values={neg}
                      onChange={(next) =>
                        edit?.setField?.("negative_keywords", { ...negKeywords, [ck]: next })
                      }
                    >
                      {neg.length ? neg.join(", ") : "—"}
                    </KeywordChips>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* 6b. KPI Assessment: every KPI, how well the report proves it, and where */}
        {ai.kpi_coverage ? <KpiAssessment coverage={ai.kpi_coverage} /> : null}

        {/* 7. Scoring Rationale (edit mode: the editable page-scores table) */}
        {editing ? (
          <>
            <EditableHeading k="scoring_rationale">Scoring Rationale</EditableHeading>
            <p style={{ color: "#5c6b82", fontSize: 13, marginTop: 0 }}>
              Change a page score to recompute its pillar average, the overall score and the grades.
            </p>
            <PageScoresTables />
          </>
        ) : hasReasons ? (
          <>
            <EditableHeading k="scoring_rationale">Scoring Rationale</EditableHeading>
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
        <EditableHeading k="score_scale">Score Scale</EditableHeading>
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
        <EditableHeading k="recommended_decision">Recommended Lending Decision</EditableHeading>
        <p style={{ fontWeight: 700, color }}>
          <EditableText k="recommendation" label="Recommended lending decision" value={decision} />
        </p>
      </div>
    );
  },
);

export default BfsiDetailedReport;
