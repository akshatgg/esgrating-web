import { forwardRef } from "react";
import { KPI_SCORE_METHOD, type EsgFinal, type Grade, type KpiCoverageCategory } from "@/lib/types";
import type { RatingDriver, RatingNarrative } from "@/lib/reportEdits";
import { GRADE_COLORS } from "@/lib/grades";
import { formatScore, numberFormat } from "@/lib/format";
import Doughnut from "@/components/reports/Doughnut";
import KpiAssessment from "@/components/reports/KpiAssessment";
import {
  DraftInput,
  DraftTextarea,
  EditableHeading,
  EditableText,
  useField,
  useReportEdit,
} from "@/components/reports/edit/ReportEdit";
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

/** A block of the written rating. Outside edit mode its paragraphs; in edit mode one
 * textarea holding the whole block, blank lines and all -- an analyst corrects a
 * paragraph, not a field (user, 2026-09-21). */
function Prose({ k, label, text }: { k: string; label: string; text: string }) {
  const paragraphs = paragraphsOf(text);
  return (
    <EditableText
      k={k}
      label={label}
      value={text}
      multiline
    >
      {paragraphs.map((p, i) => (
        <p key={i} className={extra["pillar-para"]}>
          {p}
        </p>
      ))}
    </EditableText>
  );
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
  const ctx = useReportEdit();
  const editing = ctx?.editing ?? false;
  // The draft laid over what the server served, so typing in one pillar shows at once.
  const drafts = useField<Record<string, string>>("pillar_narratives", {});
  const written = PILLARS.map((p) => ({
    ...p,
    score: final[`${p.key}_score` as keyof EsgFinal] as number,
    // Named apart from the pillar's own `label` ("Environment"), which this must not
    // overwrite: the banner needs both the pillar and how it performed.
    grade: final[`${p.key}_score_performance` as keyof EsgFinal] as string,
    performance: final[`${p.key}_score_performance_label` as keyof EsgFinal] as string,
    text: narrative?.pillar_narratives?.[p.cat] ?? "",
  })).filter((p) => p.text.trim() || editing);
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
          {editing ? (
            <DraftTextarea
              className={extra["prose-input"]}
              aria-label={`${p.label} assessment`}
              rows={8}
              value={drafts[p.cat] ?? p.text}
              onCommit={(v) => ctx?.setField?.("pillar_narratives", { ...drafts, [p.cat]: v })}
            />
          ) : (
            paragraphsOf(p.text).map((text, i) => (
              <p key={i} className={extra["pillar-para"]}>
                {text}
              </p>
            ))
          )}
        </section>
      ))}
    </>
  );
}

/** A rating driver: its headline in bold, then the paragraph of evidence.
 * Written by the AI from the scored KPIs (esgratings-api app/reports/summary.py). */
function Drivers({ k, items }: { k: "strengths" | "weaknesses"; items: RatingDriver[] }) {
  const ctx = useReportEdit();
  const editing = ctx?.editing ?? false;
  const write = (i: number, part: "headline" | "detail", value: string) =>
    ctx?.setField?.(
      k,
      items.map((d, j) => (j === i ? { headline: d.headline ?? "", detail: d.detail ?? "", [part]: value } : d)),
    );
  return (
    <ul className={extra.drivers}>
      {items.map((d, i) => (
        // Keyed by position: a key that changed as the headline is typed would remount
        // the field and lose focus.
        <li key={i}>
          {editing ? (
            <>
              <DraftInput
                className={extra["prose-input"]}
                aria-label={`${k === "strengths" ? "Strength" : "Weakness"} ${i + 1} headline`}
                value={d.headline ?? ""}
                onCommit={(v) => write(i, "headline", v)}
              />
              <DraftTextarea
                className={extra["prose-input"]}
                aria-label={`${k === "strengths" ? "Strength" : "Weakness"} ${i + 1}`}
                rows={4}
                value={d.detail ?? ""}
                onCommit={(v) => write(i, "detail", v)}
              />
            </>
          ) : (
            <>
              {d.headline ? <b>{d.headline}</b> : null}
              {d.headline && d.detail ? " — " : null}
              {d.detail}
            </>
          )}
        </li>
      ))}
    </ul>
  );
}

/** A narrative field as its paragraphs: the AI separates them with a blank line. */
function paragraphsOf(text: string | undefined): string[] {
  return (text ?? "")
    .split(/\n\s*\n/)
    .map((t) => t.trim())
    .filter(Boolean);
}

function driversOf(items: RatingDriver[] | undefined): RatingDriver[] {
  // A narrative written before drivers had a headline gave each one as a plain string.
  // Read as an object it vanished, and the report fell back to the KPI table.
  return (items ?? [])
    .map((d) => (typeof d === "string" ? { detail: d as string } : d))
    .filter((d) => (d?.headline || d?.detail || "").trim() !== "");
}

function strengthsAndGaps(data: KpiCoverageCategory) {
  const pick = (level: string) => data.kpis.filter((k) => k.level === level).map((k) => k.kpi);
  return { strong: pick("strong"), partial: pick("partial"), none: pick("none") };
}

type EsgDetailedReportProps = {
  final: EsgFinal;
  companyName: string;
  fy: string;
  /** The rating narrative written when the report was analysed. Without it the
   * Rating Summary stays the score sentence and the drivers fall back to the
   * KPI lists, so reports analysed before it existed still read. */
  narrative?: RatingNarrative | null;
};

const EsgDetailedReport = forwardRef<HTMLDivElement, EsgDetailedReportProps>(function EsgDetailedReport(
  { final, companyName, fy, narrative },
  ref,
) {
  // Saved report edits (company name, sector) carry over, as on the one-page report.
  // In edit mode an empty block still shows its editor, so an analyst can write text the
  // AI left out rather than having nothing to click on.
  const editing = useReportEdit()?.editing ?? false;
  const company = useField("company", companyName);
  const fyShown = useField("fy", fy);
  const reportDate = useField("report_date", final.report_date);
  const sector = useField("sector", final.sector);
  const coverage = final.kpi_coverage;
  const strengths = driversOf(narrative?.strengths);
  const weaknesses = driversOf(narrative?.weaknesses);
  const grade = final.composite_score_performance;
  const weights = weightsOf(final);
  const kpiScored = final.scoring_method === KPI_SCORE_METHOD;
  const gradeColor = GRADE_COLORS[grade as Grade] ?? "#c0392b";



  return (
    <div className="overflow-x-auto">
      <div ref={ref} className={styles.card} style={{ width: 736, margin: "0 auto" }}>
        <div className={styles["report-header"]}>
          {/* eslint-disable-next-line @next/next/no-img-element -- html2canvas needs a plain same-origin <img> */}
          <img src={LOGO} alt="ESG Ratings logo" />
          <div>
            <EditableHeading k="report_title" as="h2">
              ESG Detailed Assessment Report
            </EditableHeading>
            <div style={{ color: "#5c6b82", fontSize: 13 }}>
              <EditableText k="company" label="Company" value={company} />
              {sector || editing ? (
                <>
                  {" · "}
                  <EditableText k="sector" label="Sector" value={sector} />
                </>
              ) : null}
              {" · FY "}
              <EditableText k="fy" label="Financial year" value={fyShown} />
              {" · Report date "}
              <EditableText k="report_date" label="Report date" value={reportDate} />
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

            <EditableHeading k="marks_by_pillar">Marks by Pillar</EditableHeading>
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

            <EditableHeading k="rating_summary">Rating Summary</EditableHeading>
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
            {narrative?.executive_summary || editing ? (
              <Prose
                k="executive_summary"
                label="Executive summary"
                text={narrative?.executive_summary ?? ""}
              />
            ) : null}
            {narrative?.favourable_factors || editing ? (
              <>
                <p className={extra["prose-lead"]}>
                  <b>The score favourably factors in</b>
                </p>
                <Prose
                  k="favourable_factors"
                  label="What the score favourably factors in"
                  text={narrative?.favourable_factors ?? ""}
                />
              </>
            ) : null}
            {narrative?.constraints || editing ? (
              <>
                <p className={extra["prose-lead"]}>
                  <b>The assessment is, however, constrained by</b>
                </p>
                <Prose
                  k="constraints"
                  label="What constrains the assessment"
                  text={narrative?.constraints ?? ""}
                />
              </>
            ) : null}

            <PillarSections narrative={narrative} final={final} />

            <KpiAssessment coverage={coverage} />

            {strengths.length || weaknesses.length ? (
              <>
                <EditableHeading k="key_rating_drivers">Key Rating Drivers</EditableHeading>
                {strengths.length ? (
                  <>
                    <EditableHeading k="strengths_heading" as="h4" className={extra["driver-heading"]}>
                      Strengths
                    </EditableHeading>
                    <Drivers k="strengths" items={strengths} />
                  </>
                ) : null}
                {weaknesses.length ? (
                  <>
                    <EditableHeading k="weaknesses_heading" as="h4" className={extra["driver-heading"]}>
                      Weaknesses
                    </EditableHeading>
                    <Drivers k="weaknesses" items={weaknesses} />
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

            {narrative?.rating_rationale || editing ? (
              <>
                <EditableHeading k="scoring_rationale">Scoring Rationale</EditableHeading>
                <Prose
                  k="rating_rationale"
                  label="Scoring rationale"
                  text={narrative?.rating_rationale ?? ""}
                />
              </>
            ) : null}

            <EditableHeading k="score_scale">Score Scale</EditableHeading>
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

          </>
        )}
      </div>
    </div>
  );
});

export default EsgDetailedReport;
