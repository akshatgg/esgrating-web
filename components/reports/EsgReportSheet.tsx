import { forwardRef, type ReactNode } from "react";
import { EditableHeading, EditableLogo } from "@/components/reports/edit/ReportEdit";
import styles from "@/components/reports/EsgReport.module.css";

// The esg_template.html sheet (esg.md §A8), as a presentational component:
// EsgReport (the calculator report) and EsgRatingOnePager (a rated company)
// are thin mappers onto it, so the two stay one template. Headings and the
// logo read their overrides from a ReportEditProvider when there is one
// (editable reports); without one they render the template's own copy.

/** Same-origin copy of the template's logo (byte-identical to the
 * esgratings.co.in WhatsApp-Image-2024-10-09 upload), so html2canvas can draw
 * it into the PDF under `useCORS: false`. */
export const ESG_REPORT_LOGO = "/brand/logo.jpg";

export type EsgSheetPillarRow = {
  pillar: string;
  score: ReactNode;
  rating: ReactNode;
  performance: ReactNode;
};

export type EsgSheetRow = { label: ReactNode; value: ReactNode };

export type EsgReportSheetProps = {
  /** The title card's four fields and the grade badge beside them. */
  header: { company: ReactNode; sector: ReactNode; fy: ReactNode; reportDate: ReactNode; badge: ReactNode };
  /** Rating Summary: one row per pillar. */
  pillars: EsgSheetPillarRow[];
  /** An italic line under the pillar rows. */
  pillarNote?: ReactNode;
  /** A bold row under a top rule, after the pillars (and the note). */
  overall?: EsgSheetPillarRow;
  /** Result: Overall Score / Performance / Rating. */
  result: { score: ReactNode; performance: ReactNode; rating: ReactNode };
  /** Score Summary: the year rows (the label gets the colon), then Status. */
  scoreSummary: EsgSheetRow[];
  status: ReactNode;
  /** Colours the Status cell like the template's Improved / Impaired. */
  statusTone?: "positive" | "negative";
  /** The navy panel's doughnut, and the score shown in its centre. */
  chart: ReactNode;
  chartScore: ReactNode;
  /** The navy panel's content under the chart. */
  rightPanel: ReactNode;
};

/** Fixed 736px sheet inside a horizontally-scrolling wrapper for narrow
 * viewports. The ref points at the sheet root, for `lib/pdf.ts`. */
const EsgReportSheet = forwardRef<HTMLDivElement, EsgReportSheetProps>(function EsgReportSheet(
  { header, pillars, pillarNote, overall, result, scoreSummary, status, statusTone, chart, chartScore, rightPanel },
  ref,
) {
  const statusClass =
    statusTone === "positive"
      ? `${styles.item_bold} ${styles.green_color}`
      : statusTone === "negative"
        ? `${styles.item_bold} ${styles.red_color}`
        : styles.item_bold;

  return (
    <div className="overflow-x-auto">
      <div ref={ref} className={styles["report-container"]}>
        <div className={styles["esg-title"]}>
          <div>
            <EditableLogo defaultSrc={ESG_REPORT_LOGO} alt="ESG Logo" width={100} height={100} />
          </div>
          <EditableHeading k="sebi_line" as="div">
            SEBI Registered ERP
          </EditableHeading>
        </div>

        <div className={styles["esg-card"]}>
          <div className={styles["esg-header"]}>
            <EditableHeading k="esg_rating_report" as="h1" className={styles["main-heading"]}>
              ESG Rating Report
            </EditableHeading>
          </div>
          <div className={styles.report}>
            <div className={styles["left-section"]}>
              <table className={styles["table-group"]}>
                <tbody>
                  <tr>
                    <td>Company:</td>
                    <td className={styles.item_bold}>{header.company}</td>
                  </tr>
                  <tr>
                    <td>Sector:</td>
                    <td className={styles.item_bold}>{header.sector}</td>
                  </tr>
                  <tr>
                    <td>FY:</td>
                    <td className={styles.item_bold}>{header.fy}</td>
                  </tr>
                  <tr>
                    <td>Report Date:</td>
                    <td className={styles.item_bold}>{header.reportDate}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className={styles["right-section"]}>
              <div className={styles.badge}>
                <div className={styles.rating}>{header.badge}</div>
              </div>
            </div>
          </div>
        </div>

        <div className={styles["esg-content"]}>
          <div className={styles["left-section"]}>
            <div className={styles["esg-card"]}>
              <div className={styles["esg-header"]}>
                <EditableHeading k="rating_summary" as="h1" className={styles["esg-heading"]}>
                  Rating Summary
                </EditableHeading>
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
                    {pillars.map((row) => (
                      <tr key={row.pillar}>
                        <td>{row.pillar}</td>
                        <td className={styles.item_bold}>{row.score}</td>
                        <td className={styles["center-text"]}>{row.rating}</td>
                        <td>{row.performance}</td>
                      </tr>
                    ))}
                    {pillarNote ? (
                      <tr className={styles["pillar-note"]}>
                        <td colSpan={4}>{pillarNote}</td>
                      </tr>
                    ) : null}
                    {overall ? (
                      <tr className={styles["overall-row"]}>
                        <td>{overall.pillar}</td>
                        <td>{overall.score}</td>
                        <td className={styles["center-text"]}>{overall.rating}</td>
                        <td>{overall.performance}</td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>

            <div className={styles["esg-card"]}>
              <div className={styles["esg-header"]}>
                <EditableHeading k="result" as="h1" className={styles["esg-heading"]}>
                  Result
                </EditableHeading>
              </div>
              <div className={`${styles.details} ${styles["esg-summary"]}`}>
                <table className={styles["table-group"]}>
                  <tbody>
                    <tr>
                      <td>Overall Score:</td>
                      <td className={styles.item_bold}>{result.score}</td>
                    </tr>
                    <tr>
                      <td>Performance:</td>
                      <td className={styles.item_bold}>{result.performance}</td>
                    </tr>
                    <tr>
                      <td>Rating:</td>
                      <td className={styles.item_bold}>{result.rating}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className={styles["esg-card"]} style={{ margin: 0 }}>
              <div className={styles["esg-header"]}>
                <EditableHeading k="score_summary" as="h1" className={styles["esg-heading"]}>
                  Score Summary
                </EditableHeading>
              </div>
              <div className={`${styles.details} ${styles["esg-summary"]}`}>
                <table className={styles["table-group"]}>
                  <tbody>
                    {scoreSummary.map((row, i) => (
                      <tr key={i}>
                        <td>{row.label}:</td>
                        <td className={styles.item_bold}>{row.value}</td>
                      </tr>
                    ))}
                    <tr>
                      <td>Status:</td>
                      <td className={statusClass}>{status}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className={styles["esg-right-section"]}>
            <div className={styles["esg-score-heading"]}>
              <EditableHeading k="esg_score" as="h2">
                ESG Score
              </EditableHeading>
            </div>
            <div className={styles["chart-container"]}>
              <div className={styles.chart}>
                {chart}
                <div className={styles["content-chart"]}>
                  <span className={styles.heading}>ESG Score</span>
                  <span className={styles.score}>{chartScore}</span>
                </div>
              </div>
            </div>
            {rightPanel}
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

export default EsgReportSheet;
