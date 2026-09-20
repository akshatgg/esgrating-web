import { forwardRef } from "react";
import { KPI_SCORE_METHOD, type EsgFinal, type Grade, type KpiCoverageCategory } from "@/lib/types";
import type { Pages, RatingDriver, RatingNarrative } from "@/lib/reportEdits";
import { GRADE_COLORS } from "@/lib/grades";
import { formatScore, numberFormat } from "@/lib/format";
import Doughnut from "@/components/reports/Doughnut";
import KpiAssessment from "@/components/reports/KpiAssessment";
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
  { key: "environmental", cat: "E", label: "Environment", color: "#8BC34A" },
  { key: "social", cat: "S", label: "Social", color: "#FF6B6B" },
  { key: "governance", cat: "G", label: "Governance", color: "#FFEB3B" },
] as const;

/** The overall score's weights (esgratings-api app/esg/scoring.py): KPI-scored
 * reports 35/30/35, older reports 30/30/40. */
function weightsOf(final: EsgFinal): Record<(typeof PILLARS)[number]["key"], number> {
  return final.scoring_method === KPI_SCORE_METHOD
    ? { environmental: 35, social: 30, governance: 35 }
    : { environmental: 30, social: 30, governance: 40 };
}

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

/** One pillar's written assessment: the pillar, the score it earned, then the
 * paragraphs explaining what the report showed and why that is good or weak
 * (user, 2026-09-20 — the shape a rating agency's report uses). Rendered only when
 * the narrative has something to say about the pillar. */
function PillarSections({
  narrative,
  final,
}: {
  narrative: RatingNarrative | null | undefined;
  final: EsgFinal;
}) {
  const written = PILLARS.map((p) => ({
    ...p,
    score: final[`${p.key}_score` as keyof EsgFinal] as number,
    // Named apart from the pillar's own `label` ("Environment"), which this must not
    // overwrite: the banner needs both the pillar and how it performed.
    grade: final[`${p.key}_score_performance` as keyof EsgFinal] as string,
    performance: final[`${p.key}_score_performance_label` as keyof EsgFinal] as string,
    paragraphs: (narrative?.pillar_narratives?.[p.cat] ?? "")
      .split(/\n\s*\n/)
      .map((t) => t.trim())
      .filter(Boolean),
  })).filter((p) => p.paragraphs.length);
  if (!written.length) return null;
  return (
    <>
      {written.map((p) => (
        <section key={p.key} className={extra["pillar-section"]}>
          <div className={extra["pillar-bar"]} style={{ borderLeftColor: p.color }}>
            <span className={extra["pillar-name"]}>{p.label}</span>
            <span className={extra["pillar-score"]}>
              {formatScore(p.score)}
              {p.performance ? ` (${p.performance})` : p.grade ? ` (${p.grade})` : null}
            </span>
          </div>
          {p.paragraphs.map((text, i) => (
            <p key={i} className={extra["pillar-para"]}>
              {text}
            </p>
          ))}
        </section>
      ))}
    </>
  );
}

/** A rating driver: its headline in bold, then the paragraph of evidence.
 * Written by the AI from the scored KPIs (esgratings-api app/reports/summary.py). */
function Drivers({ items }: { items: RatingDriver[] }) {
  return (
    <ul className={extra.drivers}>
      {items.map((d, i) => (
        <li key={i}>
          {d.headline ? <b>{d.headline}</b> : null}
          {d.headline && d.detail ? " — " : null}
          {d.detail}
        </li>
      ))}
    </ul>
  );
}

function driversOf(items: RatingDriver[] | undefined): RatingDriver[] {
  return (items ?? []).filter((d) => (d?.headline || d?.detail || "").trim() !== "");
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
  /** The rating narrative written when the report was analysed. Without it the
   * Rating Summary stays the score sentence and the drivers fall back to the
   * KPI lists, so reports analysed before it existed still read. */
  narrative?: RatingNarrative | null;
};

const EsgDetailedReport = forwardRef<HTMLDivElement, EsgDetailedReportProps>(function EsgDetailedReport(
  { final, companyName, fy, pages, narrative },
  ref,
) {
  // Saved report edits (company name, sector) carry over, as on the one-page report.
  const company = useField("company", companyName);
  const sector = useField("sector", final.sector);
  const coverage = final.kpi_coverage;
  const pageRows = final.page_scores ?? [];
  const strengths = driversOf(narrative?.strengths);
  const weaknesses = driversOf(narrative?.weaknesses);
  const grade = final.composite_score_performance;
  const weights = weightsOf(final);
  const kpiScored = final.scoring_method === KPI_SCORE_METHOD;
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
              Each pillar&apos;s weight is the marks available for it: Environment {weights.environmental},
              Social {weights.social}, Governance {weights.governance}.
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
                      <td>{weights[p.key]}</td>
                      <td>
                        <b>{numberFormat((weights[p.key] * score) / 100, 2)}</b>
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
            {narrative?.executive_summary ? <p>{narrative.executive_summary}</p> : null}
            {narrative?.favourable_factors ? (
              <p>
                <b>The score favourably factors in</b> {narrative.favourable_factors}
              </p>
            ) : null}
            {narrative?.constraints ? (
              <p>
                <b>The assessment is, however, constrained by</b> {narrative.constraints}
              </p>
            ) : null}

            <PillarSections narrative={narrative} final={final} />

            <KpiAssessment coverage={coverage} />

            {strengths.length || weaknesses.length ? (
              <>
                <h3>Key Rating Drivers</h3>
                {strengths.length ? (
                  <>
                    <h4 className={extra["driver-heading"]}>Strengths</h4>
                    <Drivers items={strengths} />
                  </>
                ) : null}
                {weaknesses.length ? (
                  <>
                    <h4 className={extra["driver-heading"]}>Weaknesses</h4>
                    <Drivers items={weaknesses} />
                  </>
                ) : null}
              </>
            ) : (
              <>
                {/* No narrative -- a report analysed before it existed, or one whose run
                    could not write it: the KPI lists it was built from, as before. */}
              <h3>Strengths and Gaps</h3>
              <p className={styles["factor-note"]}>
                Strengths are the KPIs the report proves strongly
                {kpiScored ? " (scored 61–100; partly proven = 1–60)" : ""}; gaps are the KPIs it does
                not address, and the first places to improve disclosure.
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
              </>
            )}

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
              {kpiScored ? (
                <>
                  Every page of the uploaded report is checked against each pillar&apos;s KPI list,
                  and each KPI found is scored from 0 to 100. A KPI keeps its best score from any
                  page and scores 0 when it is not found. Each pillar score is the total of its KPI
                  scores as a percentage of the maximum.
                </>
              ) : (
                <>
                  Every page of the uploaded report is checked against each pillar&apos;s KPI list. A
                  KPI scores 100 when the report proves it strongly, 50 when only partly, and 0 when
                  it is not found; it keeps its best result from any page. Each pillar score is the
                  average of its KPIs.
                </>
              )}{" "}
              The overall score weights Environment {weights.environmental}%, Social {weights.social}%
              and Governance {weights.governance}%.
            </p>
          </>
        )}
      </div>
    </div>
  );
});

export default EsgDetailedReport;
