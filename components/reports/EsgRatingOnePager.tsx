import { forwardRef } from "react";
import type { EsgListItem, Grade } from "@/lib/types";
import { GRADE_COLORS, fyFull, fyShortOf } from "@/lib/grades";
import { formatScore, parseApiDate, slugify } from "@/lib/format";
import { GaugeDoughnut } from "@/components/reports/Doughnut";
import { ESG_REPORT_LOGO } from "@/components/reports/EsgReport";
import styles from "@/components/reports/EsgReport.module.css";

// The one-pager for a company on the ESG Rating List
// (docs/sdd/web-task-esg-merge-brief.md). Same markup and CSS module as the
// calculator's EsgReport (esg_template.html); a rated company has one rating
// and no pillar split, so the E/S/G rows show "—", the E/S/G doughnut is a
// single-value gauge and the KPI paragraphs become one line.

const PILLARS = ["Environment", "Social", "Governance"];
/** Gauge fill when the grade isn't one of the six known letters. */
const FALLBACK_COLOR = "#8BC34A";

/** `esg-rating-{slug(company)}-{s_no}.pdf` */
export function ratingPdfFilename(item: Pick<EsgListItem, "company" | "id">): string {
  return `esg-rating-${slugify(item.company)}-${item.id}.pdf`;
}

type EsgRatingOnePagerProps = {
  /** A `source: "rating"` item (`GET /api/admin/ratings/{s_no}` or the merged list). */
  item: EsgListItem;
};

/** Fixed 736px sheet inside a horizontally-scrolling wrapper, like EsgReport;
 * the ref points at the sheet, for `lib/pdf.ts`. */
const EsgRatingOnePager = forwardRef<HTMLDivElement, EsgRatingOnePagerProps>(
  function EsgRatingOnePager({ item }, ref) {
    // `date_of_rating` is a stored YYYY-MM-DD; the FY is the Indian FY
    // (Apr–Mar) it falls in, read in UTC like the BFSI one-pager.
    const rated = parseApiDate(item.date);
    const grade = item.grade ?? "—";
    const category = item.category ?? "—";
    const score = formatScore(item.rating);
    const color = GRADE_COLORS[item.grade as Grade] ?? FALLBACK_COLOR;

    return (
      <div className="overflow-x-auto">
        <div ref={ref} className={styles["report-container"]}>
          <div className={styles["esg-title"]}>
            <div>
              {/* eslint-disable-next-line @next/next/no-img-element -- plain <img>
                  so html2canvas can capture it into the PDF */}
              <img src={ESG_REPORT_LOGO} alt="ESG Logo" width={100} height={100} />
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
                      <td className={styles.item_bold}>{item.company}</td>
                    </tr>
                    <tr>
                      <td>Sector:</td>
                      <td className={styles.item_bold}>{item.sector}</td>
                    </tr>
                    <tr>
                      <td>FY:</td>
                      <td className={styles.item_bold}>{rated ? fyFull(rated) : "N/A"}</td>
                    </tr>
                    <tr>
                      <td>Report Date:</td>
                      <td className={styles.item_bold}>{item.date || "N/A"}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className={styles["right-section"]}>
                <div className={styles.badge}>
                  <div className={styles.rating}>{grade}</div>
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
                      {PILLARS.map((pillar) => (
                        <tr key={pillar}>
                          <td>{pillar}</td>
                          <td className={styles.item_bold}>—</td>
                          <td className={styles["center-text"]}>—</td>
                          <td>—</td>
                        </tr>
                      ))}
                      <tr className={styles["pillar-note"]}>
                        <td colSpan={4}>Pillar scores not available for this rating</td>
                      </tr>
                      <tr className={styles["overall-row"]}>
                        <td>Overall</td>
                        <td>{score}</td>
                        <td className={styles["center-text"]}>{grade}</td>
                        <td>{category}</td>
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
                        <td className={styles.item_bold}>{score}</td>
                      </tr>
                      <tr>
                        <td>Performance:</td>
                        <td className={styles.item_bold}>{category}</td>
                      </tr>
                      <tr>
                        <td>Rating:</td>
                        <td className={styles.item_bold}>{grade}</td>
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
                        <td>{rated ? fyShortOf(rated, -1) : "Previous FY"}:</td>
                        <td className={styles.item_bold}>N/A</td>
                      </tr>
                      <tr>
                        <td>{rated ? fyShortOf(rated) : "This FY"}:</td>
                        <td className={styles.item_bold}>{score}</td>
                      </tr>
                      <tr>
                        <td>Status:</td>
                        <td className={styles.item_bold}>First assessment</td>
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
                  <GaugeDoughnut value={item.rating ?? 0} color={color} />
                  <div className={styles["content-chart"]}>
                    <span className={styles.heading}>ESG Score</span>
                    <span className={styles.score}>{score}</span>
                  </div>
                </div>
              </div>
              <p>Rated on the ESG Ratings Methodology · Category: {category}</p>
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
  },
);

export default EsgRatingOnePager;
