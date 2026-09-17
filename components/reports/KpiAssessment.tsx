import type { KpiCoverage, KpiLevel, PageScoreRow } from "@/lib/types";
import styles from "@/components/reports/KpiAssessment.module.css";

// The report's KPI Assessment: every KPI of every pillar, how well the uploaded
// report proves it and on which pages, and the pillar score those KPIs add up
// to. Shared by the ESG report and the BFSI detailed report; the numbers come
// from the API's KPI-coverage scoring (esgratings-api app/core/kpis.py), so the
// pillar totals here are the report's own pillar scores.

const CATEGORY_ORDER = ["Environment", "Social", "Governance"] as const;
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
        Every page of the uploaded report is scored for each pillar, and counted for the KPIs it
        proves. Page scores are shown for reference; the pillar scores come from the KPI Assessment.
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
  const categories = CATEGORY_ORDER.filter((c) => (coverage[c]?.kpis?.length ?? 0) > 0);
  if (categories.length === 0) return null;

  return (
    <section className={styles.section}>
      <h2 className={styles.title}>KPI Assessment</h2>
      <p className={styles.note}>
        Each KPI is rated on how well the uploaded report proves it: Strong = 100, Partial = 50, Not
        found = 0. A KPI takes its best result from any page, and each pillar score is the average of
        its KPIs.
      </p>
      {categories.map((cat) => {
        const data = coverage[cat]!;
        const count = (level: KpiLevel) => data.kpis.filter((k) => k.level === level).length;
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
                  <th>Result</th>
                  <th className={styles.num}>Points</th>
                  <th>Found on pages</th>
                </tr>
              </thead>
              <tbody>
                {data.kpis.map((k) => (
                  <tr key={k.kpi}>
                    <td>{k.kpi}</td>
                    <td>
                      <span className={`${styles.level} ${styles[k.level] ?? ""}`}>
                        {LEVEL_LABEL[k.level] ?? k.level}
                      </span>
                    </td>
                    <td className={styles.num}>{points(k.points)}</td>
                    <td className={styles.pages}>{pagesText(k.pages)}</td>
                  </tr>
                ))}
                <tr className={styles.total}>
                  <td colSpan={2}>
                    {cat} score (average of {data.kpis.length} KPIs)
                  </td>
                  <td className={styles.num}>{points(data.score)}</td>
                  <td />
                </tr>
              </tbody>
            </table>
          </div>
        );
      })}
    </section>
  );
}
