"use client";

// The per-page ("input") scores behind each pillar average, editable in place:
// Page · Reason · Score · Original. Changing a score re-runs the server preview,
// which recomputes the pillar average, the overall score and the grades.

import { CATS, type Cat, type PageRow } from "@/lib/reportEdits";
import { ScoreInput, useReportEdit } from "@/components/reports/edit/ReportEdit";
import s from "@/components/reports/edit/Editable.module.css";

const same = (a: number | null | undefined, b: number | null | undefined) =>
  typeof a === "number" && typeof b === "number" ? Math.abs(a - b) < 1e-9 : a === b;

function CategoryTable({ cat, label, rows }: { cat: Cat; label: string; rows: PageRow[] }) {
  const ctx = useReportEdit();
  if (!ctx) return null;
  const overrides = ctx.pageScores[cat] ?? {};
  const reasonEdits =
    ((ctx.fields.reasons as Record<string, Record<string, string>> | undefined) ?? {})[cat] ?? {};
  const edited = rows.filter((r) => {
    const o = overrides[String(r.page)];
    return typeof o === "number" && !same(o, r.original_score);
  }).length;

  return (
    <details open className="rationale-edit" style={{ margin: "8px 0" }}>
      <summary style={{ cursor: "pointer", fontWeight: 600, fontSize: 14 }}>
        {label} — {rows.length} page{rows.length === 1 ? "" : "s"} scored
        {edited ? ` · ${edited} edited` : ""}
      </summary>
      <table className={s.pageTable}>
        <caption className="sr-only">{label} page scores</caption>
        <thead>
          <tr>
            <th scope="col" className={s.pageCol}>
              Page
            </th>
            <th scope="col">Reason</th>
            <th scope="col" className={s.scoreCol}>
              Score
            </th>
            <th scope="col" className={s.origCol}>
              Original
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const key = String(r.page);
            const override = overrides[key];
            const scoreEdited = typeof override === "number" && !same(override, r.original_score);
            const reason = Object.prototype.hasOwnProperty.call(reasonEdits, key)
              ? reasonEdits[key]
              : r.reason;
            const reasonEdited = Object.prototype.hasOwnProperty.call(reasonEdits, key);
            return (
              <tr key={key}>
                <td className={s.pageCol}>p.{r.page}</td>
                <td className={reasonEdited ? s.edited : undefined}>
                  <textarea
                    className={s.input}
                    rows={1}
                    aria-label={`${label} page ${r.page} reason`}
                    value={reason}
                    onChange={(e) => ctx.setReason?.(cat, r.page, e.target.value)}
                  />
                </td>
                <td className={scoreEdited ? s.edited : undefined}>
                  <ScoreInput
                    label={`${label} page ${r.page} score (0 to 100)`}
                    value={typeof override === "number" ? override : r.score}
                    allowEmpty
                    onCommit={(v) =>
                      ctx.setPageScore?.(cat, r.page, v === null || same(v, r.original_score) ? null : v)
                    }
                  />
                </td>
                <td className={s.origCol}>{r.original_score ?? "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </details>
  );
}

/** One table per category that has scored pages. Renders nothing without pages. */
export default function PageScoresTables() {
  const ctx = useReportEdit();
  if (!ctx) return null;
  const any = CATS.some(([c]) => (ctx.pages[c]?.length ?? 0) > 0);
  if (!any) {
    return (
      <p style={{ color: "#5c6b82", fontSize: 13 }}>
        Page scores aren&apos;t available for this report. You can still set each pillar score
        directly in the report above.
      </p>
    );
  }
  return (
    <>
      {CATS.map(([c, label]) => {
        const rows = ctx.pages[c] ?? [];
        return rows.length ? <CategoryTable key={c} cat={c} label={label} rows={rows} /> : null;
      })}
    </>
  );
}
