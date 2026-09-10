import { forwardRef } from "react";
import type { BfsiDetail, BfsiOverall, BfsiSubmission } from "@/lib/types";
import { bfsiGrade } from "@/lib/grades";
import { asArray, capitalizeFirst, formatUtc, numberFormat, parseApiDate } from "@/lib/format";
import Doughnut from "@/components/reports/Doughnut";
import { BFSI_REPORT_LOGO } from "@/components/reports/BfsiDetailedReport";
import styles from "@/components/reports/BfsiOnePager.module.css";

// All dates are read in UTC: one_pager.php formats `created_at` via PHP
// `date()` with no timezone configured (UTC) and `UTCDateTime->toDateTime()`.

/** `bfsi_fy_bounds()` — the Indian FY (1 Apr – 31 Mar) containing `d` (now if null). */
function fyBounds(d: Date | null): [number, number] {
  const x = d ?? new Date();
  const y = x.getUTCFullYear();
  const start = x.getUTCMonth() + 1 >= 4 ? y : y - 1;
  return [start, start + 1];
}

/** `bfsi_fy_full()` — "2024-2025". */
function fyFull(d: Date | null): string {
  const [a, b] = fyBounds(d);
  return `${a}-${b}`;
}

/** `bfsi_fy_short()` — "FY 24-25", optionally shifted by whole years. */
function fyShortOf(d: Date | null, offsetYears = 0): string {
  const [a, b] = fyBounds(d);
  return `FY ${String(a + offsetYears).slice(-2)}-${String(b + offsetYears).slice(-2)}`;
}

/** `bfsi_kpi_list()` — trimmed, non-empty, first-letter-capitalised, ", "-joined, or "—". */
function kpiList(keywords: string[] | string | undefined): string {
  const out = asArray(keywords)
    .map((k) => String(k).trim())
    .filter((k) => k !== "")
    .map(capitalizeFirst);
  return out.length ? out.join(", ") : "—";
}

const round2 = (n: number) => Math.round(n * 100) / 100;

const LEGEND = [
  { color: "#8BC34A", label: "Environment" },
  { color: "#FF6B6B", label: "Social" },
  { color: "#FFEB3B", label: "Governance" },
];

type BfsiOnePagerProps = {
  submission: BfsiSubmission;
  overall: BfsiOverall;
  previous: BfsiDetail["previous"];
  industryLabel: string;
};

/** Port of admin/one_pager.php (itself a port of the ESG calculator's
 * esg_template.html) — same markup, CSS and palette. Fixed 736px sheet inside
 * a horizontally-scrolling wrapper; the ref points at the sheet, for
 * `lib/pdf.ts`. Renders nothing without an `ai_analysis`. */
const BfsiOnePager = forwardRef<HTMLDivElement, BfsiOnePagerProps>(function BfsiOnePager(
  { submission: sub, overall, previous, industryLabel },
  ref,
) {
  const ai = sub.ai_analysis;
  if (!ai) return null;

  const e = sub.e_score ?? 0;
  const s = sub.s_score ?? 0;
  const g = sub.g_score ?? 0;
  const eGrade = bfsiGrade(e);
  const sGrade = bfsiGrade(s);
  const gGrade = bfsiGrade(g);

  const created = parseApiDate(sub.created_at);
  const reportDate = formatUtc(sub.created_at, "Y-m-d");
  const fyThis = fyShortOf(created);

  // Prior-period score: the borrower's last scored submission under the same
  // CIN/GSTIN. Its FY labels the row; without one, it's this FY minus one.
  const prevScore = typeof previous?.overall === "number" ? previous.overall : null;
  const fyPrev = previous ? fyShortOf(parseApiDate(previous.created_at)) : fyShortOf(created, -1);
  // No trend without something to compare against (one_pager.php:98-100).
  const trend =
    prevScore === null ? "none" : overall.overall >= prevScore ? "positive" : "negative";

  const pillars = [
    { label: "Environment", score: e, grade: eGrade },
    { label: "Social", score: s, grade: sGrade },
    { label: "Governance", score: g, grade: gGrade },
  ];

  return (
    <div className="overflow-x-auto">
      <div ref={ref} className={styles["report-container"]}>
        <div className={styles["esg-title"]}>
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element -- plain <img> so html2canvas can capture it */}
            <img src={BFSI_REPORT_LOGO} alt="ESG Logo" width={100} height={100} />
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
                    <td className={styles.item_bold}>{sub.borrower_name}</td>
                  </tr>
                  <tr>
                    <td>Sector:</td>
                    <td className={styles.item_bold}>{industryLabel}</td>
                  </tr>
                  <tr>
                    <td>FY:</td>
                    <td className={styles.item_bold}>{fyFull(created)}</td>
                  </tr>
                  <tr>
                    <td>Report Date:</td>
                    <td className={styles.item_bold}>{reportDate}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className={styles["right-section"]}>
              <div className={styles.badge}>
                <div className={styles.rating}>{overall.grade}</div>
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
                    {pillars.map((p) => (
                      <tr key={p.label}>
                        <td>{p.label}</td>
                        <td className={styles.item_bold}>{numberFormat(p.score, 2)}</td>
                        <td className={styles["center-text"]}>{p.grade.grade}</td>
                        <td>{p.grade.label}</td>
                      </tr>
                    ))}
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
                      <td className={styles.item_bold}>{numberFormat(overall.overall, 2)}</td>
                    </tr>
                    <tr>
                      <td>Performance:</td>
                      <td className={styles.item_bold}>{overall.label}</td>
                    </tr>
                    <tr>
                      <td>Rating:</td>
                      <td className={styles.item_bold}>{overall.grade}</td>
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
                      <td>{fyPrev}:</td>
                      <td className={styles.item_bold}>
                        {prevScore === null ? "N/A" : numberFormat(prevScore, 2)}
                      </td>
                    </tr>
                    <tr>
                      <td>{fyThis}:</td>
                      <td className={styles.item_bold}>{numberFormat(overall.overall, 2)}</td>
                    </tr>
                    <tr>
                      <td>Status:</td>
                      {trend === "positive" ? (
                        <td className={`${styles.item_bold} ${styles.green_color}`}>
                          Improved{" "}
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 16 16"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            aria-hidden="true"
                          >
                            <path
                              d="M11.0002 15.84H5.00016V7.84H0.160156L8.00016 0L15.8402 7.84H11.0002V15.84Z"
                              fill="#76AB37"
                            />
                          </svg>
                        </td>
                      ) : trend === "negative" ? (
                        <td className={`${styles.item_bold} ${styles.red_color}`}>
                          Impaired{" "}
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 16 16"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            aria-hidden="true"
                          >
                            <path
                              d="M11.0002 0.16H5.00016V8.16H0.160156L8.00016 16L15.8402 8.16H11.0002V0.16Z"
                              fill="#AB3737"
                            />
                          </svg>
                        </td>
                      ) : (
                        <td className={`${styles.item_bold} ${styles.grey_color}`}>
                          First assessment
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
                <Doughnut environmental={round2(e)} social={round2(s)} governance={round2(g)} />
                <div className={styles["content-chart"]}>
                  <span className={styles.heading}>ESG Score</span>
                  <span className={styles.score}>{numberFormat(overall.overall, 2)}</span>
                </div>
              </div>
            </div>
            <div className={styles.legend}>
              {LEGEND.map((item) => (
                <div key={item.label} className={styles["legend-item"]}>
                  <div className={styles.color} style={{ backgroundColor: item.color }} />
                  <div>{item.label}</div>
                </div>
              ))}
            </div>
            <h3 className={styles.subheading}>Environment KPI&apos;s</h3>
            <p>{kpiList(ai.keywords?.E)}</p>
            <h3 className={styles.subheading}>Social KPI&apos;s</h3>
            <p>{kpiList(ai.keywords?.S)}</p>
            <h3 className={styles.subheading}>Governance KPI&apos;s</h3>
            <p>{kpiList(ai.keywords?.G)}</p>
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

export default BfsiOnePager;
