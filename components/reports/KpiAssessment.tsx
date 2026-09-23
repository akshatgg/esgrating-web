import { KPI_SCORE_METHOD, type KpiCoverage, type KpiCoverageCategory, type KpiLevel } from "@/lib/types";
import type { Cat } from "@/lib/reportEdits";
import {
  DraftTextarea,
  ScoreInput,
  useField,
  useReportEdit,
} from "@/components/reports/edit/ReportEdit";
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
  // Page numbers are left out: the column is the reason for the score, and the citations
  // read as working notes in a client's report (user, 2026-09-22). The capping note stays,
  // since a score held down to 20 is otherwise unexplained.
  const parts = [
    k.capped ? `Held at ${points(best(k))} — poor performance found: ${ev.reason}` : ev.reason,
  ];
  for (const o of ev.also ?? []) {
    if (o?.reason) parts.push(`${k.capped && parts.length === 1 ? "Best evidence: " : "Also: "}${o.reason}`);
  }
  return parts.map((t) => String(t).replace(/\.*$/, "")).join(". ") + ".";
}

const SCORED_NOTE =
  "Each KPI is scored from 0 to 100 on how good the performance is, not on how much detail " +
  "the report gives: 0 when it is only mentioned, promised or too vague to judge, 1\u201320 poor " +
  "(fines, incidents, a worsening trend), 21\u201340 weak, 41\u201360 real action without results, " +
  "61\u201380 measured results, 81\u2013100 targets met or independently assured. A KPI keeps its " +
  "best score from any page \u2014 held down to 20 if any page showed poor performance \u2014 and " +
  "scores 0 when it is not found. Each pillar score is the average of all its KPI scores, with " +
  "missing KPIs counted as 0.";
const PROVEN_NOTE =
  "Each KPI is rated on how well the uploaded report proves it: Strong = 100, Partial = 50, " +
  "Not found = 0. A KPI takes its best result from any page, and each pillar score is the " +
  "average of its KPIs.";

const scored = (data: KpiCoverageCategory) => data.method === KPI_SCORE_METHOD;

/** A KPI's best score, 0–100 (older results carry it as points). */
const best = (k: KpiCoverageCategory["kpis"][number]) => k.score ?? k.points;

export default function KpiAssessment({ coverage }: { coverage: KpiCoverage }) {
  // Every hook first: the early return below must not change how many run.
  const ctx = useReportEdit();
  const noteOverride = useField<string>("kpi_assessment_note", "");
  // Reasons an analyst has corrected, by pillar and KPI name. The report already carries
  // the corrected text (the API writes it onto the KPI row), so this is only the draft
  // while editing.
  const reasonEdits = useField<Record<string, Record<string, string>>>("kpi_reasons", {});

  const categories = CATEGORY_ORDER.filter((c) => (coverage[c]?.kpis?.length ?? 0) > 0);
  if (categories.length === 0) return null;
  const anyScored = categories.some((c) => scored(coverage[c]!));
  const editing = ctx?.editing ?? false;
  const reasonFor = (code: Cat, k: KpiCoverageCategory["kpis"][number]) =>
    reasonEdits[code]?.[k.kpi] ?? reasonOf(k);
  // The editor starts from whatever is showing, so an analyst rewords the real note
  // rather than an empty box.
  const noteText = noteOverride || (anyScored ? SCORED_NOTE : PROVEN_NOTE);

  return (
    <section className={styles.section}>
      <h2 className={styles.title}>KPI Assessment</h2>
      {/* The note is the method, so it is the same on every report -- but an analyst can
          reword it for one (user, 2026-09-23). */}
      {editing ? (
        <DraftTextarea
          className={styles.noteInput}
          aria-label="KPI Assessment note"
          rows={5}
          value={noteText}
          onCommit={(v) => ctx?.setField?.("kpi_assessment_note", v)}
        />
      ) : noteOverride ? (
        <p className={styles.note}>{noteOverride}</p>
      ) : (
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
      )}
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
                      {/* Highlighted only while editing: a delivered report shows a
                          revised score like any other (user, 2026-09-21). */}
                      <td
                        className={styles.num}
                        style={edited && editable ? { background: EDITED_BG } : undefined}
                      >
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
                      {anyReason ? (
                        <td className={styles.reason}>
                          {editing ? (
                            <DraftTextarea
                              className={styles.noteInput}
                              aria-label={`${k.kpi} reason`}
                              rows={3}
                              value={reasonFor(code, k)}
                              onCommit={(v) =>
                                ctx?.setField?.("kpi_reasons", {
                                  ...reasonEdits,
                                  [code]: { ...(reasonEdits[code] ?? {}), [k.kpi]: v },
                                })
                              }
                            />
                          ) : (
                            reasonFor(code, k) || (best(k) > 0 ? "—" : "")
                          )}
                        </td>
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
                  {/* Nothing about who set the pillar score: this table is part of a
                      client document. */}
                  {anyReason ? <td className={styles.pages} /> : null}
                </tr>
              </tbody>
            </table>
          </div>
        );
      })}
    </section>
  );
}
