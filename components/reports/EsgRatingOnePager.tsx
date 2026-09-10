import { forwardRef } from "react";
import type { EsgListItem, Grade } from "@/lib/types";
import { GRADE_COLORS, fyFull, fyShortOf } from "@/lib/grades";
import { formatScore, parseApiDate, slugify } from "@/lib/format";
import { GaugeDoughnut } from "@/components/reports/Doughnut";
import EsgReportSheet from "@/components/reports/EsgReportSheet";

// The one-pager for a company on the ESG Rating List
// (docs/sdd/web-task-esg-merge-brief.md). Same markup and CSS module as the
// calculator's EsgReport (esg_template.html), via the shared EsgReportSheet; a
// rated company has one rating and no pillar split, so the E/S/G rows show
// "—", the E/S/G doughnut is a single-value gauge and the KPI paragraphs
// become one line.

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

/** The rated company's fields mapped onto `EsgReportSheet`; the ref points at
 * the sheet, for `lib/pdf.ts`. */
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
      <EsgReportSheet
        ref={ref}
        header={{
          company: item.company,
          sector: item.sector,
          fy: rated ? fyFull(rated) : "N/A",
          reportDate: item.date || "N/A",
          badge: grade,
        }}
        pillars={PILLARS.map((pillar) => ({ pillar, score: "—", rating: "—", performance: "—" }))}
        pillarNote="Pillar scores not available for this rating"
        overall={{ pillar: "Overall", score, rating: grade, performance: category }}
        result={{ score, performance: category, rating: grade }}
        scoreSummary={[
          { label: rated ? fyShortOf(rated, -1) : "Previous FY", value: "N/A" },
          { label: rated ? fyShortOf(rated) : "This FY", value: score },
        ]}
        status="First assessment"
        chart={<GaugeDoughnut value={item.rating ?? 0} color={color} />}
        chartScore={score}
        rightPanel={<p>Rated on the ESG Ratings Methodology · Category: {category}</p>}
      />
    );
  },
);

export default EsgRatingOnePager;
