"use client";

import { forwardRef, type ReactNode } from "react";
import clsx from "clsx";
import {
  DraftTextarea,
  EditableHeading,
  EditableText,
  useEditing,
  useField,
  useReportEdit,
} from "@/components/reports/edit/ReportEdit";
import styles from "@/components/reports/EsgSummaryReport.module.css";

// The Rating Summary, on screen. This is the client's Word template
// (esgratings-api app/reports/templates/rating_summary_template.docx) rendered as the
// page, so an analyst reads and corrects exactly what downloads rather than editing the
// .docx afterwards (user, 2026-09-25).
//
// Every heading is an EditableHeading keyed sum_*; every prose block is a field; every
// other slot -- a table cell, a static paragraph -- goes through Slot, which writes into
// the summary_text map. The API keys the Word file off the same names, so a correction
// here is what comes out of Download summary (Word).
//
// The numbers are never editable here: pillar and KPI scores are corrected on the
// Detailed Report, where changing one recomputes the pillar and the overall score. A
// number typed over in two places would let the documents disagree.

type Theme = { name: string; score: number; label: string; drivers: string; note: string };
type KpiRow = {
  pillar: string; theme: string | null; kpi: string; score: number;
  driver: string; materiality: string; evidence_type: string;
};
type Pillar = {
  name: string; score: number; grade: string; label: string; themes: Theme[];
  strong: { kpi: string; score: number }[]; gaps: { kpi: string }[];
};
type Band = { result: string; note?: string; pct?: number; found?: number; total?: number; specific?: number };

export type SummaryFacts = {
  company: string; identifier: string; sector: string; period: string; assessed: string;
  status: string; overall: number; grade: string; label: string; weights: string; movement: string;
  pillars: Record<string, Pillar>;
  kpi_rows: KpiRow[];
  completeness: Band; specificity: Band; verification: Band; timeliness: Band;
};

type Narrative = {
  executive_summary?: string;
  pillar_narratives?: Record<string, string>;
  strengths?: (string | { headline?: string; detail?: string })[];
  weaknesses?: (string | { headline?: string; detail?: string })[];
  priorities?: { area?: string; gap?: string; why?: string; action?: string }[];
  rating_rationale?: string;
  rating_interpretation?: string;
};

const CODES = ["E", "S", "G"] as const;
const PILLAR_NAME: Record<string, string> = { E: "Environment", S: "Social", G: "Governance" };

const SCALE: [string, string, string][] = [
  [">90", "A+", "Outstanding"],
  ["80–90", "A", "Excellent"],
  ["71–79", "B+", "Very Good"],
  ["61–70", "B", "Good"],
  ["40–60", "C", "Average"],
  ["<40", "D", "Below Average"],
];

// The template's fixed wording. Reproduced exactly; Slot lets an analyst change any of it
// for one report without the template changing for everyone.
const METHOD_TREATMENT =
  "CFC distinguishes disclosure quality from ESG performance. More disclosure does not " +
  "automatically result in a higher ESG score, while limited disclosure is not automatically " +
  "treated as poor performance where reliable evidence establishes the company’s position.";
const METHOD_ALIGNMENT =
  "This summary is generated from the CFC ESG Rating assessment using the approved methodology. " +
  "The report presents the principal score drivers at pillar, theme / sub-pillar and applicable " +
  "KPI level, together with data completeness indicators and the rating interpretation. It should " +
  "be read together with the CFC ESG Scorecard and the full CFC ESG Rating Methodology.";
const SCOPE_NOTE =
  "The summary is an analytical explanation of the rating outcome. It does not replace the " +
  "underlying evidence, controlled indicator library, detailed rating file or methodology, and " +
  "does not constitute a credit rating, investment recommendation, statutory audit or " +
  "certification of legal compliance.";

const QUALITY_ROWS: [string, string, keyof SummaryFacts][] = [
  ["Completeness", "Coverage of material indicators and reporting boundary", "completeness"],
  ["Specificity", "Whether disclosures are quantified, time-bound and location / business-unit specific", "specificity"],
  ["Verification", "Use of assurance, audit, certifications or independent evidence", "verification"],
  ["Timeliness", "Recency relative to the rating period and event monitoring", "timeliness"],
];

const TRANSITION_AREAS: [string, string][] = [
  ["Target credibility", "Whether ESG and climate targets are specific, time-bound and backed by a baseline"],
  ["Target progress", "Progress disclosed against stated targets and commitments"],
  ["Transition readiness", "Preparedness for sector transition risk; technology, product or process change"],
  ["Resilience", "Climate resilience and business continuity"],
  ["Emerging risk preparedness", "Ability to respond to material emerging ESG risks"],
];

const fmt = (n: number | undefined) =>
  typeof n === "number" ? (Number.isInteger(n) ? String(n) : n.toFixed(2)) : "—";

/** Any slot of the template by its own key: a table cell, a static paragraph. Falls back
 * to what the rating produced, so an untouched slot shows the generated text. */
function Slot({ k, children, className }: { k: string; children: string; className?: string }) {
  const ctx = useReportEdit();
  const editing = useEditing();
  const map = useField<Record<string, string>>("summary_text", {});
  const value = map[k] ?? children;
  if (!editing) return <span className={className}>{value}</span>;
  return (
    <DraftTextarea
      className={styles.slot}
      aria-label={k.replace(/_/g, " ").toLowerCase()}
      rows={Math.min(8, Math.max(2, Math.ceil(value.length / 60)))}
      value={value}
      onCommit={(v) => ctx?.setField?.("summary_text", { ...map, [k]: v })}
    />
  );
}

function Prose({ k, label, text }: { k: string; label: string; text: string }) {
  return (
    <EditableText k={k} label={label} value={text} multiline>
      {text
        .split(/\n\s*\n/)
        .map((p) => p.trim())
        .filter(Boolean)
        .map((p, i) => (
          <p key={i} className={styles.para}>
            {p}
          </p>
        ))}
    </EditableText>
  );
}

function driverText(d: string | { headline?: string; detail?: string } | undefined): string {
  if (!d) return "";
  if (typeof d === "string") return d;
  return [d.headline, d.detail].filter(Boolean).join(" — ");
}

function Section({ k, title, children }: { k: string; title: string; children: ReactNode }) {
  return (
    <section className={styles.section}>
      <EditableHeading k={k} as="h2" className={styles.h2}>
        {title}
      </EditableHeading>
      {children}
    </section>
  );
}

const EsgSummaryReport = forwardRef<HTMLDivElement, { facts: SummaryFacts; narrative?: Narrative | null }>(
  function EsgSummaryReport({ facts, narrative }, ref) {
    const n = narrative ?? {};
    const p = facts.pillars;
    const strengths = (n.strengths ?? []).slice(0, 5);
    const weaknesses = (n.weaknesses ?? []).slice(0, 5);
    const priorities = (n.priorities ?? []).slice(0, 5);

    return (
      <div ref={ref} className={styles.doc}>
        <header className={styles.head}>
          <EditableHeading k="sum_title" as="h1" className={styles.h1}>
            CFC ESG Rating Summary
          </EditableHeading>
          <p className={styles.sub}>
            <Slot k="SUM_SUBTITLE">Companion report to the CFC ESG Scorecard</Slot>
          </p>
        </header>

        <EditableHeading k="sum_snapshot" as="h2" className={styles.h2}>
          COMPANY &amp; RATING SNAPSHOT
        </EditableHeading>
        <table className={styles.table}>
          <tbody>
            <tr><th>Company</th><td>{facts.company}</td><th>Sector</th><td>{facts.sector}</td></tr>
            <tr><th>CIN / GSTIN</th><td>{facts.identifier}</td><th>Reporting period</th><td>{facts.period}</td></tr>
            <tr><th>Assessment date</th><td>{facts.assessed}</td><th>Rating status</th><td>{facts.status}</td></tr>
            <tr>
              <th>Overall Score</th><td>{fmt(facts.overall)} / 100</td>
              <th>Rating</th><td>{facts.grade} — {facts.label}</td>
            </tr>
            <tr>
              <th>Score movement</th><td>{facts.movement}</td>
              <th>Data completeness</th><td>{facts.completeness.result} ({Math.round(facts.completeness.pct ?? 0)}%)</td>
            </tr>
          </tbody>
        </table>

        <div className={styles.tiles}>
          {CODES.map((c) => (
            <div key={c} className={styles.tile}>
              <span className={styles.tileName}>{PILLAR_NAME[c].toUpperCase()}</span>
              <span className={styles.tileScore}>{fmt(p[c]?.score)}</span>
              <span className={styles.tileGrade}>{p[c]?.grade} · {p[c]?.label}</span>
            </div>
          ))}
          <div className={clsx(styles.tile, styles.tileOverall)}>
            <span className={styles.tileName}>OVERALL</span>
            <span className={styles.tileScore}>{fmt(facts.overall)}</span>
            <span className={styles.tileGrade}>{facts.grade} · {facts.label}</span>
          </div>
        </div>

        <div className={styles.box}>
          <EditableHeading k="sum_exec_heading" as="h3" className={styles.h3}>
            Executive rating view
          </EditableHeading>
          <Prose k="executive_summary" label="Executive rating view" text={n.executive_summary ?? ""} />
        </div>

        <Section k="sum_s1" title="1. Pillar Assessment">
          <p className={styles.note}>
            <Slot k="SUM_S1_NOTE">
              Summary of the key factors considered in determining each pillar score
            </Slot>
          </p>
          <EditableHeading k="sum_scorecard" as="h3" className={styles.h3}>
            Pillar scorecard
          </EditableHeading>
          <table className={styles.table}>
            <thead>
              <tr><th>Pillar</th><th>Score</th><th>Rating</th><th>Performance</th>
                <th>Key positive drivers</th><th>Key gaps / risks</th></tr>
            </thead>
            <tbody>
              {CODES.map((c) => (
                <tr key={c}>
                  <td>{PILLAR_NAME[c]}</td>
                  <td>{fmt(p[c]?.score)}</td>
                  <td>{p[c]?.grade}</td>
                  <td>{p[c]?.label}</td>
                  <td>
                    <Slot k={`${c}_STRONG_DRIVERS`}>
                      {(p[c]?.strong ?? []).slice(0, 3).map((r) => `${r.kpi} (${fmt(r.score)})`).join("; ")
                        || "No KPI evidence found"}
                    </Slot>
                  </td>
                  <td>
                    <Slot k={`${c}_GAPS`}>
                      {(p[c]?.gaps ?? []).slice(0, 3).map((r) => r.kpi).join("; ") || "No KPI gaps"}
                    </Slot>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {CODES.map((c) => (
            <div key={c}>
              <EditableHeading k={`sum_${c.toLowerCase()}_factors`} as="h3" className={styles.h3}>
                {`${PILLAR_NAME[c]} — key assessment factors`}
              </EditableHeading>
              <Prose
                k={`pillar_narratives.${c}`}
                label={`${PILLAR_NAME[c]} assessment`}
                text={(n.pillar_narratives ?? {})[c] ?? ""}
              />
              <table className={styles.table}>
                <thead>
                  <tr><th>Theme / sub-pillar</th><th>Score</th><th>Performance</th>
                    <th>Key KPI / evidence drivers</th><th>Disclosure / data note</th></tr>
                </thead>
                <tbody>
                  {(p[c]?.themes ?? []).map((t, i) => (
                    <tr key={t.name}>
                      <td>{t.name}</td>
                      <td>{fmt(t.score)}</td>
                      <td>{t.label}</td>
                      <td><Slot k={`${c}_THEME_${i + 1}_DRIVERS`}>{t.drivers}</Slot></td>
                      <td><Slot k={`${c}_THEME_${i + 1}_DATA_NOTE`}>{t.note}</Slot></td>
                    </tr>
                  ))}
                  {(p[c]?.themes ?? []).length === 0 ? (
                    <tr><td colSpan={5}>KPIs are not mapped to sub-pillars for this report</td></tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          ))}
        </Section>

        <Section k="sum_s2" title="2. KPI &amp; Evidence Summary">
          <table className={styles.table}>
            <thead>
              <tr><th>Pillar</th><th>Theme / Sub-pillar</th><th>KPI / Indicator</th><th>Score</th>
                <th>Weight / Importance</th><th>Key evidence / factor</th><th>Status</th></tr>
            </thead>
            <tbody>
              {facts.kpi_rows.map((r, i) => (
                <tr key={`${r.pillar}-${r.kpi}`}>
                  <td>{r.pillar}</td>
                  <td>{r.theme || "—"}</td>
                  <td>{r.kpi}</td>
                  <td>{fmt(r.score)}</td>
                  <td>{[r.materiality, r.evidence_type].filter(Boolean).join(" · ") || "—"}</td>
                  <td><Slot k={`KPI_${i + 1}_DRIVER`}>{r.driver}</Slot></td>
                  <td>{r.score >= 61 ? "Strong" : r.score > 0 ? "Partial" : "Not found"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        <Section k="sum_s3" title="3. Strengths, Weaknesses &amp; Improvement Priorities">
          <div className={styles.two}>
            <div className={styles.box}>
              <h3 className={styles.h3}>What is supporting the rating</h3>
              <ol className={styles.ol}>
                {strengths.map((d, i) => (
                  <li key={i}><Slot k={`STRENGTH_${i + 1}`}>{driverText(d)}</Slot></li>
                ))}
              </ol>
            </div>
            <div className={styles.box}>
              <h3 className={styles.h3}>What is constraining the rating</h3>
              <ol className={styles.ol}>
                {weaknesses.map((d, i) => (
                  <li key={i}><Slot k={`WEAKNESS_${i + 1}`}>{driverText(d)}</Slot></li>
                ))}
              </ol>
            </div>
          </div>

          <EditableHeading k="sum_priorities_heading" as="h3" className={styles.h3}>
            Priority improvement opportunities
          </EditableHeading>
          <table className={styles.table}>
            <thead>
              <tr><th>Priority</th><th>ESG area</th><th>Observed gap / weakness</th>
                <th>Why it matters</th><th>Suggested evidence / action to improve assessment</th></tr>
            </thead>
            <tbody>
              {priorities.map((pr, i) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td><Slot k={`PRIORITY_${i + 1}_AREA`}>{pr.area ?? ""}</Slot></td>
                  <td><Slot k={`PRIORITY_${i + 1}_GAP`}>{pr.gap ?? ""}</Slot></td>
                  <td><Slot k={`PRIORITY_${i + 1}_WHY`}>{pr.why ?? ""}</Slot></td>
                  <td><Slot k={`PRIORITY_${i + 1}_EVIDENCE_ACTION`}>{pr.action ?? ""}</Slot></td>
                </tr>
              ))}
            </tbody>
          </table>

          <EditableHeading k="sum_rationale_heading" as="h3" className={styles.h3}>
            Rating rationale
          </EditableHeading>
          <Prose k="rating_rationale" label="Rating rationale" text={n.rating_rationale ?? ""} />
        </Section>

        <Section k="sum_s4" title="4. Data Completeness &amp; Evidence Confidence">
          <div className={styles.box}>
            <h3 className={styles.h3}>Methodology treatment</h3>
            <p className={styles.para}><Slot k="SUM_METHOD_TREATMENT">{METHOD_TREATMENT}</Slot></p>
          </div>
          <table className={styles.table}>
            <thead>
              <tr><th>Data quality dimension</th><th>What is assessed</th><th>Result</th><th>Key observation</th></tr>
            </thead>
            <tbody>
              {QUALITY_ROWS.map(([name, assessed, key]) => {
                const band = facts[key] as Band;
                const result = band?.pct !== undefined
                  ? `${band.result} (${Math.round(band.pct)}%)`
                  : band?.result ?? "—";
                return (
                  <tr key={name}>
                    <td>{name}</td>
                    <td>{assessed}</td>
                    <td>{result}</td>
                    <td><Slot k={`DATA_${name.toUpperCase()}_NOTE`}>{band?.note ?? ""}</Slot></td>
                  </tr>
                );
              })}
              <tr>
                <td>Consistency</td>
                <td>Alignment across annual report, SLFRS disclosures, website, regulator filings and questionnaire</td>
                <td>Not assessed</td>
                <td>
                  <Slot k="DATA_CONSISTENCY_NOTE">
                    This rating reads one disclosure, so there is no second source to compare it against.
                  </Slot>
                </td>
              </tr>
            </tbody>
          </table>
        </Section>

        <Section k="sum_s5" title="5. Forward-Looking / Transition &amp; Controversy">
          <table className={styles.table}>
            <thead>
              <tr><th>Assessment area</th><th>Score / adjustment</th><th>Key factors considered</th><th>Summary</th></tr>
            </thead>
            <tbody>
              {TRANSITION_AREAS.map(([area, considered], i) => (
                <tr key={area}>
                  <td>{area}</td>
                  <td><Slot k={`TRANSITION_${i + 1}_SCORE_ADJ`}>Not assessed</Slot></td>
                  <td>{considered}</td>
                  <td>
                    <Slot k={`TRANSITION_${i + 1}_SUMMARY`}>
                      No forward-looking assessment was recorded for this rating, so no adjustment was applied to the base score.
                    </Slot>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <EditableHeading k="sum_controversy_heading" as="h3" className={styles.h3}>
            Controversy / adverse event assessment
          </EditableHeading>
          <div className={styles.box}>
            <Prose
              k="controversy_status"
              label="Controversy status"
              text={
                "No adverse event was identified in the source report. Controversies are assessed from " +
                "the company’s own disclosure only; regulator, court and media sources are not part of " +
                "this rating, so a clean result here is not a statement that none exist."
              }
            />
          </div>
        </Section>

        <Section k="sum_s6" title="6. Rating Interpretation &amp; Methodology Notes">
          <EditableHeading k="sum_scale_heading" as="h3" className={styles.h3}>
            CFC rating interpretation guide
          </EditableHeading>
          <table className={styles.table}>
            <thead><tr><th>Score</th><th>Rating</th><th>Interpretation</th></tr></thead>
            <tbody>
              {SCALE.map(([range, grade, meaning]) => (
                <tr key={grade}><td>{range}</td><td>{grade}</td><td>{meaning}</td></tr>
              ))}
            </tbody>
          </table>
          <div className={styles.box}>
            <h3 className={styles.h3}>How to interpret the result</h3>
            <Prose
              k="rating_interpretation"
              label="How to interpret the result"
              text={n.rating_interpretation ?? ""}
            />
            <p className={styles.note}>Overall score weights: {facts.weights}.</p>
          </div>

          <EditableHeading k="sum_method_heading" as="h3" className={styles.h3}>
            Methodology alignment statement
          </EditableHeading>
          <p className={styles.para}><Slot k="SUM_METHOD_ALIGNMENT">{METHOD_ALIGNMENT}</Slot></p>

          <EditableHeading k="sum_note_heading" as="h3" className={styles.h3}>
            Important note
          </EditableHeading>
          <div className={styles.box}>
            <p className={styles.para}><Slot k="SUM_SCOPE_NOTE">{SCOPE_NOTE}</Slot></p>
          </div>
        </Section>
      </div>
    );
  },
);

export default EsgSummaryReport;
