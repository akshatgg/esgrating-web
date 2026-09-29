// How a source page is named to the reader.
//
// A page is held internally by its SHEET -- what the PDF counts from the cover. That is not
// the number printed on the page: a report begins its own numbering after the front matter,
// so the two run a constant apart, and every citation read that many pages ahead of where
// the reader looked (user, 2026-09-29). The map from one to the other is measured at
// extraction (esgratings-api app/esg/extract.py folio_offset) and stored with the analysis.
//
// Mirrors `_page_label` / `_cite` in esgratings-api app/reports/summary.py, so the detailed
// report and the Word summary name the same page the same way.

export type PageNumbers = Record<string, number> | undefined;

const SHEET = "PDF sheet";

/** The number printed on that sheet, or null when there is none to cite. */
export function printedPage(page: number | string | undefined, numbers: PageNumbers): number | null {
  if (page === undefined || page === null) return null;
  const printed = numbers?.[String(page)];
  return typeof printed === "number" ? printed : null;
}

/** One page as a citation: "p.32", or "PDF sheet 34" where the folio is unknown. Named as a
 * sheet rather than passed off as a page number, so a reader who cannot find page 34 knows
 * which number they are holding. */
export function cite(page: number | string | undefined, numbers: PageNumbers): string {
  if (page === undefined || page === null) return "";
  const printed = printedPage(page, numbers);
  return printed !== null ? `p.${printed}` : `${SHEET} ${page}`;
}

/** A list of pages. All printed or all sheets, never a mixture: two numbering schemes in one
 * list is how the reader was misled in the first place. */
export function citeAll(pages: Array<number | string> | undefined, numbers: PageNumbers): string {
  const items = pages ?? [];
  if (items.length === 0) return "";
  const printed = items.map((p) => printedPage(p, numbers));
  return printed.every((n) => n !== null)
    ? `p. ${printed.join(", ")}`
    : `${SHEET} ${items.join(", ")}`;
}
