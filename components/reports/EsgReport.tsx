import { forwardRef } from "react";
import type { EsgFinal, YearScore } from "@/lib/types";
import { fyShort, prevFy } from "@/lib/grades";
import { formatScore, capitalizeFirst } from "@/lib/format";
import Doughnut from "@/components/reports/Doughnut";
import EsgReportSheet from "@/components/reports/EsgReportSheet";
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
 * `pdfBlob`/`downloadPdf`. */
const EsgReport = forwardRef<HTMLDivElement, EsgReportProps>(function EsgReport(
  { final, yearScore, companyName, fy },
  ref,
) {
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
        company: companyName,
        sector: final.sector,
        fy,
        reportDate: final.report_date,
        badge: final.composite_score_performance,
      }}
      pillars={[
        {
          pillar: "Environment",
          score: formatScore(final.environmental_score),
          rating: final.environmental_score_performance,
          performance: final.environmental_score_performance_label,
        },
        {
          pillar: "Social",
          score: formatScore(final.social_score),
          rating: final.social_score_performance,
          performance: final.social_score_performance_label,
        },
        {
          pillar: "Governance",
          score: formatScore(final.governance_score),
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
        { label: reportYearLabel(yearScore, fy), value: score },
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
          <h3 className={styles.subheading}>Environment KPI&apos;s</h3>
          <p>{joinKeywords(final.environmental_top_keywords)}</p>
          <h3 className={styles.subheading}>Social KPI&apos;s</h3>
          <p>{joinKeywords(final.social_top_keywords)}</p>
          <h3 className={styles.subheading}>Governance KPI&apos;s</h3>
          <p>{joinKeywords(final.governance_top_keywords)}</p>
        </>
      }
    />
  );
});

export default EsgReport;
