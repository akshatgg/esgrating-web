import { KPI_SCORE_METHOD, type KpiCoverage, type KpiCoverageCategory, type KpiLevel, type PageScoreRow } from "@/lib/types";
import type { Cat } from "@/lib/reportEdits";
import { ScoreInput, useReportEdit } from "@/components/reports/edit/ReportEdit";
import styles from "@/components/reports/KpiAssessment.module.css";

// The report's KPI Assessment: every KPI of every pillar, how well the uploaded
// report proves it and on which pages, and the pillar score those KPIs add up
// to. Shared by the ESG report and the BFSI detailed report; the numbers come
// from the API (ESG: esgratings-api app/esg/scoring.py, each KPI scored 0–100;
// BFSI: app/core/kpis.py, strong/partial), so the pillar totals here are the
// report's own pillar scores. In the ESG report editor each KPI score is an input.

const CATEGORY_ORDER = ["Environment", "Social", "Governance"] as const;
const CAT: Record<(typeof CATEGORY_ORDER)[number], Cat> = { Environment: "E", Social: "S", Governance: "G" };
const EDITED_BG = "#fff7e0";
const LEVEL_LABEL: Record<KpiLevel, string> = { strong: "Strong", partial: "Partial", none: "Not found" };
const MAX_PAGES = 8;

function pagesText(pages: Array<number | string> | undefined): string {
  if (!pages || pages.length === 0) return "—";
  const shown = pages.slice(0, MAX_PAGES).join(", ");
  return pages.length > MAX_PAGES ? `${shown} +${pages.length - MAX_PAGES} more` : shown;
}

function points(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

const scored = (data: KpiCoverageCategory) => data.method === KPI_SCORE_METHOD;

/** A KPI's best score, 0–100 (older results carry it as points). */
const best = (k: KpiCoverageCategory["kpis"][number]) => k.score ?? k.points;

/** The ESG report's Page Scores: one row per page, each pillar's page score and
 * how many KPIs that page proved. Page scores are for reading only; the pillar
 * scores come from the KPI Assessment above. */
export function PageScores({ rows }: { rows: PageScoreRow[] }) {
  if (rows.length === 0) return null;
  const cell = (row: PageScoreRow, cat: (typeof CATEGORY_ORDER)[number]) => {
    const v = row[cat];
    if (!v) return "—";
    const n = v.kpis;
    return (
      <>
        <b>{v.score ?? "—"}</b>
        <span className={styles.pages}> · {n === 0 ? "no KPI" : `${n} KPI${n === 1 ? "" : "s"}`}</span>
      </>
    );
  };
  return (
    <section className={styles.section}>
      <h2 className={styles.title}>Page Scores</h2>
      <p className={styles.note}>
        A page&apos;s score is the average of the KPI scores found on that page. Page scores are
        shown for reference only; the pillar scores come from each KPI&apos;s best score in the KPI
        Assessment.
      </p>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Page</th>
            {CATEGORY_ORDER.map((cat) => (
              <th key={cat}>{cat}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={String(row.page)}>
              <td>
                <b>p.{row.page}</b>
              </td>
              {CATEGORY_ORDER.map((cat) => (
                <td key={cat}>{cell(row, cat)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export default function KpiAssessment({ coverage }: { coverage: KpiCoverage }) {
  const ctx = useReportEdit();
  const categories = CATEGORY_ORDER.filter((c) => (coverage[c]?.kpis?.length ?? 0) > 0);
  if (categories.length === 0) return null;
  const anyScored = categories.some((c) => scored(coverage[c]!));

  return (
    <section className={styles.section}>
      <h2 className={styles.title}>KPI Assessment</h2>
      <p className={styles.note}>
        {anyScored ? (
          <>
            Each KPI is scored from 0 to 100 on what the uploaded report shows: 1–30 mentioned only,
            31–60 a policy or commitment, 61–80 specific actions, 81–100 measured data or targets with
            progress. A KPI keeps its best score from any page and scores 0 when it is not found. Each
            pillar score is the total of its KPI scores as a percentage of the maximum.
          </>
        ) : (
          <>
            Each KPI is rated on how well the uploaded report proves it: Strong = 100, Partial = 50,
            Not found = 0. A KPI takes its best result from any page, and each pillar score is the
            average of its KPIs.
          </>
        )}
      </p>
      {categories.map((cat) => {
        const data = coverage[cat]!;
        const isScored = scored(data);
        const count = (level: KpiLevel) => data.kpis.filter((k) => k.level === level).length;
        const code = CAT[cat];
        const editable = Boolean(ctx?.editing && ctx.kpisEditable?.[code] && ctx.setKpiScore);
        const overrides = ctx?.kpiScores?.[code] ?? {};
        const originals = new Map((ctx?.kpis?.[code] ?? []).map((r) => [r.kpi, r.original_score]));
        return (
          <div key={cat} className={styles.category}>
            <div className={styles.head}>
              <span>{cat}</span>
              <span className={styles.counts}>
                {count("strong")} strong · {count("partial")} partial · {count("none")} not found
              </span>
            </div>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>KPI</th>
                  <th>{isScored ? "Level" : "Result"}</th>
                  <th className={styles.num}>{isScored ? "Score" : "Points"}</th>
                  <th>Found on pages</th>
                </tr>
              </thead>
              <tbody>
                {data.kpis.map((k) => {
                  const original = originals.get(k.kpi) ?? best(k);
                  const edited = typeof overrides[k.kpi] === "number" && overrides[k.kpi] !== original;
                  return (
                    <tr key={k.kpi}>
                      <td>{k.kpi}</td>
                      <td>
                        <span className={`${styles.level} ${styles[k.level] ?? ""}`}>
                          {LEVEL_LABEL[k.level] ?? k.level}
                        </span>
                      </td>
                      <td className={styles.num} style={edited ? { background: EDITED_BG } : undefined}>
                        {editable ? (
                          <ScoreInput
                            label={`${cat} KPI ${k.kpi} score (0 to 100)`}
                            value={overrides[k.kpi] ?? best(k)}
                            onCommit={(v) =>
                              ctx!.setKpiScore!(code, k.kpi, v === null || v === original ? null : v)
                            }
                          />
                        ) : (
                          points(best(k))
                        )}
                      </td>
                      <td className={styles.pages}>{pagesText(k.pages)}</td>
                    </tr>
                  );
                })}
                <tr className={styles.total}>
                  <td colSpan={2}>
                    {isScored
                      ? `${cat} score (total of ${data.kpis.length} KPI scores ÷ ${data.kpis.length * 100} × 100)`
                      : `${cat} score (average of ${data.kpis.length} KPIs)`}
                  </td>
                  <td className={styles.num}>
                    {typeof data.analyst_score === "number" ? points(data.analyst_score) : points(data.score)}
                  </td>
                  <td className={styles.pages}>
                    {typeof data.analyst_score === "number"
                      ? `Set by analyst (KPI total ${points(data.score)})`
                      : null}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        );
      })}
    </section>
  );
}
