import { forwardRef } from "react";
import type { EsgFinal, Grade, KpiCoverageCategory } from "@/lib/types";
import type { Pages } from "@/lib/reportEdits";
import { GRADE_COLORS } from "@/lib/grades";
import { formatScore, numberFormat } from "@/lib/format";
import Doughnut from "@/components/reports/Doughnut";
import KpiAssessment, { PageScores } from "@/components/reports/KpiAssessment";
import { useField } from "@/components/reports/edit/ReportEdit";
import styles from "@/components/reports/BfsiDetailedReport.module.css";
import extra from "@/components/reports/EsgDetailedReport.module.css";

// The ESG calculator's Detailed Report: the full working behind the one-page ESG
// Rating Report (EsgReport), which stays the single-sheet template. Built only
// from what the analysis saved on `final` -- the KPI-coverage scoring's
// kpi_coverage and page_scores (esgratings-api app/esg/pipeline.py) -- so it
// makes no calls of its own. Styled like the BFSI detailed report.

/** Same-origin logo, so html2canvas can draw it into the PDF. */
const LOGO = "/brand/logo.jpg";

const PILLARS = [
  { key: "environmental", cat: "E", label: "Environment", weight: 30, color: "#8BC34A" },
  { key: "social", cat: "S", label: "Social", weight: 30, color: "#FF6B6B" },
  { key: "governance", cat: "G", label: "Governance", weight: 40, color: "#FFEB3B" },
] as const;

type RationaleLine = {
  page: number | string;
  score: number | string | null | undefined;
  reason: string;
  kpis?: string[];
};

/** evaluate_score()'s bands (app/esg/pipeline.py), as on the one-page report. */
const SCORE_SCALE: ReadonlyArray<readonly [string, Grade, string]> = [
  ["> 90", "A+", "Outstanding"],
  ["80 – 90", "A", "Excellent"],
  ["71 – 79", "B+", "Very Good"],
  ["61 – 70", "B", "Good"],
  ["40 – 60", "C", "Average"],
  ["< 40", "D", "Below Average"],
];

function listOr(items: string[], empty = "—"): string {
  return items.length ? items.join("; ") : empty;
}

function strengthsAndGaps(data: KpiCoverageCategory) {
  const pick = (level: string) => data.kpis.filter((k) => k.level === level).map((k) => k.kpi);
  return { strong: pick("strong"), partial: pick("partial"), none: pick("none") };
}

type EsgDetailedReportProps = {
  final: EsgFinal;
  companyName: string;
  fy: string;
  /** The analysis run's per-page scores and reasons (the report editor's
   * `pages`, read from esg_report). Every scored report has them, including
   * ones imported from the old calculator, so the rationale does not wait for
   * a re-run. */
  pages?: Pages;
};

const EsgDetailedReport = forwardRef<HTMLDivElement, EsgDetailedReportProps>(function EsgDetailedReport(
  { final, companyName, fy, pages },
  ref,
) {
  // Saved report edits (company name, sector) carry over, as on the one-page report.
  const company = useField("company", companyName);
  const sector = useField("sector", final.sector);
  const coverage = final.kpi_coverage;
  const pageRows = final.page_scores ?? [];
  const grade = final.composite_score_performance;
  const gradeColor = GRADE_COLORS[grade as Grade] ?? "#c0392b";

  // Scoring Rationale: the run's saved per-page reasons (pages) first, else the
  // reasons saved on page_scores; each line adds the KPIs that page proves.
  const kpisOn = (label: (typeof PILLARS)[number]["label"], page: number | string) =>
    pageRows.find((row) => String(row.page) === String(page))?.[label]?.kpi_names;
  const rationale = PILLARS.map((p) => {
    const fromRun: RationaleLine[] = (pages?.[p.cat] ?? [])
      .filter((r) => r.reason)
      .map((r) => ({ page: r.page, score: r.score, reason: r.reason, kpis: kpisOn(p.label, r.page) }));
    const fromRows: RationaleLine[] = pageRows
      .filter((row) => row[p.label]?.reason)
      .map((row) => ({
        page: row.page,
        score: row[p.label]!.score,
        reason: row[p.label]!.reason!,
        kpis: row[p.label]!.kpi_names,
      }));
    return { ...p, lines: fromRun.length ? fromRun : fromRows };
  });
  // Same markup and styles as the BFSI detailed report's Scoring Rationale: one
  // collapsible block per pillar. PDFs print them open (lib/pdf.ts).
  const rationaleSection = rationale.some((p) => p.lines.length) ? (
    <>
      <h3>Scoring Rationale</h3>
      <p style={{ color: "#5c6b82", fontSize: 13, marginTop: 0 }}>
        Every page of the uploaded report is scored on its own. Each line below cites the page it
        came from.
      </p>
      {rationale.map((p) =>
        p.lines.length ? (
          <details key={p.key} className={styles.rationale}>
            <summary>
              {p.label} — {p.lines.length} page{p.lines.length === 1 ? "" : "s"} scored
            </summary>
            <ul>
              {p.lines.map((line) => (
                <li key={String(line.page)}>
                  <span className={styles.cite}>
                    p.{line.page}
                    {line.score !== null && line.score !== undefined ? ` · ${line.score}` : ""}
                  </span>
                  {line.reason}
                  {line.kpis?.length ? (
                    <span className={extra.kpis}> KPIs: {line.kpis.join("; ")}</span>
                  ) : null}
                </li>
              ))}
            </ul>
          </details>
        ) : null,
      )}
    </>
  ) : null;

  return (
    <div className="overflow-x-auto">
      <div ref={ref} className={styles.card} style={{ width: 736, margin: "0 auto" }}>
        <div className={styles["report-header"]}>
          {/* eslint-disable-next-line @next/next/no-img-element -- html2canvas needs a plain same-origin <img> */}
          <img src={LOGO} alt="ESG Ratings logo" />
          <div>
            <h2>ESG Detailed Assessment Report</h2>
            <div style={{ color: "#5c6b82", fontSize: 13 }}>
              {company}
              {sector ? ` · ${sector}` : ""} · FY {fy} · Report date {final.report_date}
            </div>
          </div>
        </div>

        {!coverage ? (
          <>
            <p className={extra.empty}>
              The KPI tables come from the KPI scoring of the uploaded report, and this report was
              scored before that was added. Re-run the analysis with &ldquo;Use cached result&rdquo;
              unticked to generate them. The page-by-page rationale below is from the saved analysis.
            </p>
            {rationaleSection}
          </>
        ) : (
          <>
            <div className={styles["score-row"]}>
              <div className={styles["doughnut-box"]} style={{ position: "relative" }}>
                <Doughnut
                  environmental={final.environmental_score}
                  social={final.social_score}
                  governance={final.governance_score}
                />
              </div>
              <div>
                <div style={{ fontSize: 15, color: "#5c6b82" }}>Overall ESG Score</div>
                <div style={{ fontSize: 36, fontWeight: 700, color: "#0b1c39" }}>
                  {formatScore(final.composite_score)}
                </div>
                <span className={styles.badge} style={{ background: gradeColor }}>
                  {grade} — {final.composite_score_performance_label}
                </span>
              </div>
            </div>

            <h3>Marks by Pillar</h3>
            <p className={styles["factor-note"]}>
              Each pillar&apos;s weight is the marks available for it: Environment 30, Social 30,
              Governance 40.
            </p>
            <table className={styles.data}>
              <tbody>
                <tr>
                  <th>Pillar</th>
                  <th>Score</th>
                  <th>Weight</th>
                  <th>Marks</th>
                  <th>Grade</th>
                </tr>
                {PILLARS.map((p) => {
                  const score = final[`${p.key}_score`];
                  return (
                    <tr key={p.key}>
                      <td>
                        <span className={styles.swatch} style={{ background: p.color }} />
                        <b>{p.label}</b>
                      </td>
                      <td>{formatScore(score)}</td>
                      <td>{p.weight}</td>
                      <td>
                        <b>{numberFormat((p.weight * score) / 100, 2)}</b>
                      </td>
                      <td>
                        {final[`${p.key}_score_performance`]} — {final[`${p.key}_score_performance_label`]}
                      </td>
                    </tr>
                  );
                })}
                <tr className={styles["factor-total"]}>
                  <td>
                    <b>Total</b>
                  </td>
                  <td />
                  <td>100</td>
                  <td>
                    <b>{formatScore(final.composite_score)}</b>
                  </td>
                  <td>
                    <b>
                      {grade} — {final.composite_score_performance_label}
                    </b>
                  </td>
                </tr>
              </tbody>
            </table>

            <h3>Rating Summary</h3>
            <p>
              {company} has been assessed with an overall ESG score of{" "}
              <b>{formatScore(final.composite_score)}</b> (Grade{" "}
              <b>
                {grade} — {final.composite_score_performance_label}
              </b>
              ), based on how well its uploaded report proves the ESG KPIs of each pillar
              (Environment {formatScore(final.environmental_score)}, Social{" "}
              {formatScore(final.social_score)}, Governance {formatScore(final.governance_score)}).
            </p>

            <KpiAssessment coverage={coverage} />

            <h3>Strengths and Gaps</h3>
            <p className={styles["factor-note"]}>
              Strengths are the KPIs the report proves strongly; gaps are the KPIs it does not
              address, and the first places to improve disclosure.
            </p>
            <table className={styles.data}>
              <tbody>
                <tr>
                  <th style={{ width: "16%" }}>Pillar</th>
                  <th>Proven strongly</th>
                  <th>Partly proven</th>
                  <th>Not found (gaps)</th>
                </tr>
                {PILLARS.map((p) => {
                  const data = coverage[p.label];
                  if (!data) return null;
                  const s = strengthsAndGaps(data);
                  return (
                    <tr key={p.key}>
                      <td>
                        <b>{p.label}</b>
                      </td>
                      <td>{listOr(s.strong)}</td>
                      <td>{listOr(s.partial)}</td>
                      <td className={styles.neg}>{listOr(s.none, "None — every KPI is addressed")}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <PageScores rows={pageRows} />

            {rationaleSection}

            <h3>Score Scale</h3>
            <table className={styles.data}>
              <tbody>
                <tr>
                  <th>Range</th>
                  <th>Grade</th>
                  <th>Label</th>
                </tr>
                {SCORE_SCALE.map(([range, g, label]) => (
                  <tr key={g}>
                    <td>{range}</td>
                    <td>{g}</td>
                    <td>{label}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <h3>Methodology</h3>
            <p className={styles["factor-note"]}>
              Every page of the uploaded report is checked against each pillar&apos;s KPI list. A KPI
              scores 100 when the report proves it strongly, 50 when only partly, and 0 when it is not
              found; it keeps its best result from any page. Each pillar score is the average of its
              KPIs, and the overall score weights Environment 30%, Social 30% and Governance 40%.
            </p>
          </>
        )}
      </div>
    </div>
  );
});

export default EsgDetailedReport;
