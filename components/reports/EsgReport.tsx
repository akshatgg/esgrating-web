import { forwardRef } from "react";
import type { EsgFinal } from "@/lib/types";
import { fyShort } from "@/lib/grades";
import { formatScore, capitalizeFirst } from "@/lib/format";
import Doughnut from "@/components/reports/Doughnut";
import EsgReportSheet from "@/components/reports/EsgReportSheet";
import {
  EditableHeading,
  EditableText,
  KeywordChips,
  PillarScore,
  useField,
  useReportEdit,
} from "@/components/reports/edit/ReportEdit";
import styles from "@/components/reports/EsgReport.module.css";

/** esg-report.php's download name for the calculator report PDF. */
export const ESG_REPORT_PDF_FILENAME = "esg_report.pdf";

function joinKeywords(keywords: string[]): string {
  return keywords.map(capitalizeFirst).join(", ");
}

const KPIS = [
  ["environmental_top_keywords", "env_kpis", "Environment KPI's"],
  ["social_top_keywords", "soc_kpis", "Social KPI's"],
  ["governance_top_keywords", "gov_kpis", "Governance KPI's"],
] as const;

type EsgReportProps = {
  final: EsgFinal;
  companyName: string;
  fy: string;
};

/** A faithful React port of `esg_template.html` / esg-report.php's `X1` report
 * builder (esg.md §A8/§B4), mapped onto the shared `EsgReportSheet`. Fixed
 * 736px width inside a horizontally-scrolling wrapper for narrow viewports.
 * The returned ref points at the report root, suitable for `lib/pdf.ts`'s
 * `pdfBlob`/`downloadPdf`. Editable in place inside a `ReportEditProvider`. */
const EsgReport = forwardRef<HTMLDivElement, EsgReportProps>(function EsgReport(
  { final, companyName, fy },
  ref,
) {
  const edit = useReportEdit();
  const company = useField("company", companyName);
  const sector = useField("sector", final.sector);
  const fyOverride = useField<string | null>("fy", null);
  const fyShown = fyOverride ?? fy;
  const reportDate = useField("report_date", final.report_date);
  const kpis = {
    environmental_top_keywords: useField("environmental_top_keywords", final.environmental_top_keywords),
    social_top_keywords: useField("social_top_keywords", final.social_top_keywords),
    governance_top_keywords: useField("governance_top_keywords", final.governance_top_keywords),
  };

  const score = formatScore(final.composite_score);

  return (
    <EsgReportSheet
      ref={ref}
      header={{
        company: <EditableText k="company" label="Company" value={company} />,
        sector: <EditableText k="sector" label="Sector" value={sector} />,
        fy: <EditableText k="fy" label="Financial year" value={fyShown} />,
        reportDate: <EditableText k="report_date" label="Report date" value={reportDate} />,
        badge: final.composite_score_performance,
      }}
      pillars={[
        {
          pillar: "Environment",
          score: (
            <PillarScore cat="E" pillar="Environment" score={final.environmental_score}>
              {formatScore(final.environmental_score)}
            </PillarScore>
          ),
          rating: final.environmental_score_performance,
          performance: final.environmental_score_performance_label,
        },
        {
          pillar: "Social",
          score: (
            <PillarScore cat="S" pillar="Social" score={final.social_score}>
              {formatScore(final.social_score)}
            </PillarScore>
          ),
          rating: final.social_score_performance,
          performance: final.social_score_performance_label,
        },
        {
          pillar: "Governance",
          score: (
            <PillarScore cat="G" pillar="Governance" score={final.governance_score}>
              {formatScore(final.governance_score)}
            </PillarScore>
          ),
          rating: final.governance_score_performance,
          performance: final.governance_score_performance_label,
        },
      ]}
      result={{
        score,
        performance: final.composite_score_performance_label,
        rating: final.composite_score_performance,
      }}
      scoreSummary={[
        // The latest analysis only: its score under the financial year given on the
        // calculator form (or typed into the report). No prior-run row and no trend --
        // two runs of the same year made both rows read the same FY, and the earlier
        // score is not a different year's rating (user, 2026-09-21).
        { label: fyShort(fyShown), value: score },
      ]}
      chart={
        <Doughnut
          environmental={final.environmental_score}
          social={final.social_score}
          governance={final.governance_score}
        />
      }
      chartScore={score}
      rightPanel={
        <>
          {KPIS.map(([key, headingKey, heading]) => (
            <KpiBlock
              key={key}
              headingKey={headingKey}
              heading={heading}
              values={kpis[key]}
              onChange={(next) => edit?.setField?.(key, next)}
            />
          ))}
        </>
      }
    />
  );
});

function KpiBlock({
  headingKey,
  heading,
  values,
  onChange,
}: {
  headingKey: string;
  heading: string;
  values: string[];
  onChange: (next: string[]) => void;
}) {
  return (
    <>
      <EditableHeading k={headingKey} as="h3" className={styles.subheading}>
        {heading}
      </EditableHeading>
      <p>
        <KeywordChips label={heading} values={values} onChange={onChange}>
          {joinKeywords(values)}
        </KeywordChips>
      </p>
    </>
  );
}

export default EsgReport;
