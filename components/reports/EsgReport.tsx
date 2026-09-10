import { forwardRef } from "react";
import type { EsgFinal, YearScore } from "@/lib/types";
import { fyShort, prevFy } from "@/lib/grades";
import { formatScore, capitalizeFirst } from "@/lib/format";
import Doughnut from "@/components/reports/Doughnut";
import styles from "@/components/reports/EsgReport.module.css";

/** Same-origin copy of the template's logo (byte-identical to the
 * esgratings.co.in WhatsApp-Image-2024-10-09 upload), so html2canvas can draw
 * it into the PDF under `useCORS: false`. */
const LOGO_SRC = "/brand/logo.jpg";

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
 * builder (esg.md §A8/§B4). Fixed 736px width — the caller wraps it (or relies
 * on this component's own wrapper) in a horizontally-scrolling container for
 * narrow viewports. The returned ref points at the report root, suitable for
 * `lib/pdf.ts`'s `pdfBlob`/`downloadPdf`. */
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

  return (
    <div className="overflow-x-auto">
      <div ref={ref} className={styles["report-container"]}>
        <div className={styles["esg-title"]}>
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element -- plain <img>
                so html2canvas can capture it into the PDF */}
            <img src={LOGO_SRC} alt="ESG Logo" width={100} height={100} />
          </div>
          <div>SEBI Registered ERP</div>
        </div>

        <div className={styles["esg-card"]}>
          <div className={styles["esg-header"]}>
            <h1 className={styles["main-heading"]}>ESG Rating Report</h1>
          </div>
          <div className={styles.report}>
            <div className={styles["left-section"]}>
              <table className={styles["table-group"]}>
                <tbody>
                  <tr>
                    <td>Company:</td>
                    <td className={styles.item_bold}>{companyName}</td>
                  </tr>
                  <tr>
                    <td>Sector:</td>
                    <td className={styles.item_bold}>{final.sector}</td>
                  </tr>
                  <tr>
                    <td>FY:</td>
                    <td className={styles.item_bold}>{fy}</td>
                  </tr>
                  <tr>
                    <td>Report Date:</td>
                    <td className={styles.item_bold}>{final.report_date}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className={styles["right-section"]}>
              <div className={styles.badge}>
                <div className={styles.rating}>{final.composite_score_performance}</div>
              </div>
            </div>
          </div>
        </div>

        <div className={styles["esg-content"]}>
          <div className={styles["left-section"]}>
            <div className={styles["esg-card"]}>
              <div className={styles["esg-header"]}>
                <h1 className={styles["esg-heading"]}>Rating Summary</h1>
              </div>
              <div className={styles.details}>
                <table className={styles["table-group"]}>
                  <tbody>
                    <tr>
                      <th>Pillar</th>
                      <th>Score</th>
                      <th className={styles["center-text"]}>Rating</th>
                      <th>Performance</th>
                    </tr>
                    <tr>
                      <td>Environment</td>
                      <td className={styles.item_bold}>{formatScore(final.environmental_score)}</td>
                      <td className={styles["center-text"]}>{final.environmental_score_performance}</td>
                      <td>{final.environmental_score_performance_label}</td>
                    </tr>
                    <tr>
                      <td>Social</td>
                      <td className={styles.item_bold}>{formatScore(final.social_score)}</td>
                      <td className={styles["center-text"]}>{final.social_score_performance}</td>
                      <td>{final.social_score_performance_label}</td>
                    </tr>
                    <tr>
                      <td>Governance</td>
                      <td className={styles.item_bold}>{formatScore(final.governance_score)}</td>
                      <td className={styles["center-text"]}>{final.governance_score_performance}</td>
                      <td>{final.governance_score_performance_label}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className={styles["esg-card"]}>
              <div className={styles["esg-header"]}>
                <h1 className={styles["esg-heading"]}>Result</h1>
              </div>
              <div className={`${styles.details} ${styles["esg-summary"]}`}>
                <table className={styles["table-group"]}>
                  <tbody>
                    <tr>
                      <td>Overall Score:</td>
                      <td className={styles.item_bold}>{formatScore(final.composite_score)}</td>
                    </tr>
                    <tr>
                      <td>Performance:</td>
                      <td className={styles.item_bold}>{final.composite_score_performance_label}</td>
                    </tr>
                    <tr>
                      <td>Rating:</td>
                      <td className={styles.item_bold}>{final.composite_score_performance}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className={styles["esg-card"]} style={{ margin: 0 }}>
              <div className={styles["esg-header"]}>
                <h1 className={styles["esg-heading"]}>Score Summary</h1>
              </div>
              <div className={`${styles.details} ${styles["esg-summary"]}`}>
                <table className={styles["table-group"]}>
                  <tbody>
                    <tr>
                      <td>{previousYearLabel}:</td>
                      <td className={styles.item_bold}>{previousScore}</td>
                    </tr>
                    <tr>
                      <td>{reportYearLabel(yearScore, fy)}:</td>
                      <td className={styles.item_bold}>{formatScore(final.composite_score)}</td>
                    </tr>
                    <tr>
                      <td>Status:</td>
                      {firstAssessment ? (
                        <td className={styles.item_bold}>First assessment</td>
                      ) : trendPositive ? (
                        <td className={`${styles.item_bold} ${styles.green_color}`}>
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
                        </td>
                      ) : (
                        <td className={`${styles.item_bold} ${styles.red_color}`}>
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
                        </td>
                      )}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className={styles["esg-right-section"]}>
            <div className={styles["esg-score-heading"]}>
              <h2>ESG Score</h2>
            </div>
            <div className={styles["chart-container"]}>
              <div className={styles.chart}>
                <Doughnut
                  environmental={final.environmental_score}
                  social={final.social_score}
                  governance={final.governance_score}
                />
                <div className={styles["content-chart"]}>
                  <span className={styles.heading}>ESG Score</span>
                  <span className={styles.score}>{formatScore(final.composite_score)}</span>
                </div>
              </div>
            </div>
            <h3 className={styles.subheading}>Environment KPI&apos;s</h3>
            <p>{joinKeywords(final.environmental_top_keywords)}</p>
            <h3 className={styles.subheading}>Social KPI&apos;s</h3>
            <p>{joinKeywords(final.social_top_keywords)}</p>
            <h3 className={styles.subheading}>Governance KPI&apos;s</h3>
            <p>{joinKeywords(final.governance_top_keywords)}</p>
          </div>
        </div>

        <div className={styles["esg-footer"]}>
          <div className={styles["esg-scale"]}>
            <table>
              <thead>
                <tr>
                  <th>Score</th>
                  <th>&gt;90</th>
                  <th>80-90</th>
                  <th>71-79</th>
                  <th>61-70</th>
                  <th>40-60</th>
                  <th>&lt; 40</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>ESG Rating</td>
                  <td>A+</td>
                  <td>A</td>
                  <td>B+</td>
                  <td>B</td>
                  <td>C</td>
                  <td>D</td>
                </tr>
                <tr>
                  <td>Category</td>
                  <td>Outstanding</td>
                  <td>Excellent</td>
                  <td>Very Good</td>
                  <td>Good</td>
                  <td>Average</td>
                  <td>Below Average</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
});

export default EsgReport;
