import { KPI_SCORE_METHOD, type KpiCoverage, type KpiCoverageCategory, type KpiLevel } from "@/lib/types";
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

/** Why a KPI scored what it scored, from the pages that scored it: the page the score
 * came from first, then the others that supported it (user, 2026-09-20). Every word is
 * the scoring call's own reason for that page, so the column explains the score rather
 * than restating it. A KPI the report never addressed has none -- its 0 needs no
 * explaining. */
function reasonOf(k: KpiCoverageCategory["kpis"][number]): string {
  const ev = k.evidence;
  if (!ev?.reason) return "";
  const cite = (page: number | string | undefined, score: number | undefined, reason: string) =>
    `p.${page ?? "?"}${typeof score === "number" ? ` (${points(score)})` : ""}: ${reason}`;
  const parts = [
    k.capped
      ? `Held at ${points(best(k))} — poor performance on ${cite(ev.page, ev.score, ev.reason)}`
      : cite(ev.page, ev.score, ev.reason),
  ];
  for (const o of ev.also ?? []) {
    if (o?.reason) parts.push(`${k.capped && parts.length === 1 ? "Best evidence " : "Also "}${cite(o.page, o.score, o.reason)}`);
  }
  return parts.join(". ") + ".";
}

const scored = (data: KpiCoverageCategory) => data.method === KPI_SCORE_METHOD;

/** A KPI's best score, 0–100 (older results carry it as points). */
const best = (k: KpiCoverageCategory["kpis"][number]) => k.score ?? k.points;

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
            Each KPI is scored from 0 to 100 on how good the performance is, not on how much detail
            the report gives: 0 when it is only mentioned, promised or too vague to judge, 1–20 poor
            (fines, incidents, a worsening trend), 21–40 weak, 41–60 real action without results,
            61–80 measured results, 81–100 targets met or independently assured. A KPI keeps its best
            score from any page — held down to 20 if any page showed poor performance — and scores 0
            when it is not found. Each pillar score is the average of all its KPI scores, with
            missing KPIs counted as 0.
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
        // Every KPI-scored report gets the column, whether or not each row filled it: a
        // column that comes and goes reads as a missing feature (user, 2026-09-20). A
        // strong/partial result -- BFSI, and ESG runs from before KPI scoring -- has no
        // reasons at all and never will, so there the column stays off.
        const anyReason = isScored;
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
                  {anyReason ? <th>Reason</th> : null}
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
                      <td className={styles.pages}>
                        {pagesText(k.pages)}
                        {k.capped ? " · capped at 20 (poor performance found)" : null}
                      </td>
                      {anyReason ? (
                        <td className={styles.reason}>{reasonOf(k) || (best(k) > 0 ? "—" : "")}</td>
                      ) : null}
                    </tr>
                  );
                })}
                <tr className={styles.total}>
                  <td colSpan={2}>
                    {isScored
                      ? `${cat} score (average of all ${data.kpis.length} KPI scores, missing counted as 0)`
                      : `${cat} score (average of ${data.kpis.length} KPIs)`}
                  </td>
                  <td className={styles.num}>
                    {typeof data.analyst_score === "number" ? points(data.analyst_score) : points(data.score)}
                  </td>
                  <td className={styles.pages} colSpan={anyReason ? 2 : 1}>
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
