import { forwardRef } from "react";
import type { EsgFinal, YearScore } from "@/lib/types";
import { fyShort, prevFy } from "@/lib/grades";
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

type YearScoreOk = Extract<YearScore, { latest_year: string }>;

function hasHistory(ys: YearScore | undefined): ys is YearScoreOk {
  return !!ys && "latest_year" in ys;
}

/** Whether there's a prior-year figure to compare against — the third state
 * ("first assessment") the brief calls for alongside Improved/Impaired,
 * covering both the 0-doc `{status:false}` shape and the 1-doc shape (whose
 * `previous_year`/`previous_score` are the literal string "N/A" — see
 * esg.md §A6/§A8 and store.get_esg_score()). */
function isFirstAssessment(ys: YearScore | undefined): boolean {
  return !hasHistory(ys) || ys.previous_year === "N/A";
}

function reportYearLabel(ys: YearScore | undefined, fy: string): string {
  return fyShort(hasHistory(ys) ? ys.latest_year : fy);
}

/** The Score Summary's previous-year row label. get_html.py's own fallback
 * branch (computing the prior FY from `latest_year`) is dead code for the
 * real `esg_submissions` shape, since `previous_year` is always truthy (a
 * real FY string or the literal "N/A") — this deliberately takes that
 * fallback anyway so the 1-doc "first assessment" case still shows which FY
 * it would have compared against, rather than "N/A: N/A". */
function reportPreviousYearLabel(ys: YearScore | undefined): string {
  if (!hasHistory(ys)) return "N/A";
  if (ys.previous_year !== "N/A") return fyShort(ys.previous_year);
  return fyShort(prevFy(ys.latest_year));
}

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
  yearScore?: YearScore;
  companyName: string;
  fy: string;
};

/** A faithful React port of `esg_template.html` / esg-report.php's `X1` report
 * builder (esg.md §A8/§B4), mapped onto the shared `EsgReportSheet`. Fixed
 * 736px width inside a horizontally-scrolling wrapper for narrow viewports.
 * The returned ref points at the report root, suitable for `lib/pdf.ts`'s
 * `pdfBlob`/`downloadPdf`. Editable in place inside a `ReportEditProvider`. */
const EsgReport = forwardRef<HTMLDivElement, EsgReportProps>(function EsgReport(
  { final, yearScore, companyName, fy },
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

  const firstAssessment = isFirstAssessment(yearScore);
  const previousYearLabel = reportPreviousYearLabel(yearScore);
  const previousScore =
    hasHistory(yearScore) && yearScore.previous_score !== "N/A"
      ? formatScore(yearScore.previous_score)
      : "N/A";
  const trendPositive = hasHistory(yearScore) ? yearScore.trend_flag === "positive" : true;

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
        { label: previousYearLabel, value: previousScore },
        {
          // An edited FY labels this year's row; else the run's own year, as before.
          label: fyOverride !== null ? fyShort(fyOverride) : reportYearLabel(yearScore, fy),
          value: score,
        },
      ]}
      status={
        firstAssessment ? (
          "First assessment"
        ) : trendPositive ? (
          <>
            Improved
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
              style={{ verticalAlign: "middle", marginLeft: 4 }}
            >
              <path
                d="M11.0002 15.84H5.00016V7.84H0.160156L8.00016 0L15.8402 7.84H11.0002V15.84Z"
                fill="#76AB37"
              />
            </svg>
          </>
        ) : (
          <>
            Impaired
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
              style={{ verticalAlign: "middle", marginLeft: 4 }}
            >
              <path
                d="M11.0002 0.16H5.00016V8.16H0.160156L8.00016 16L15.8402 8.16H11.0002V0.16Z"
                fill="#AB3737"
              />
            </svg>
          </>
        )
      }
      statusTone={firstAssessment ? undefined : trendPositive ? "positive" : "negative"}
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
