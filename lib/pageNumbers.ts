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

/** The number printed on that sheet, or null when there is none to cite. */
export function printedPage(page: number | string | undefined, numbers: PageNumbers): number | null {
  if (page === undefined || page === null) return null;
  const printed = numbers?.[String(page)];
  return typeof printed === "number" ? printed : null;
}

/** One page as a citation, always "p.32": the number printed on the page where it is known,
 * the sheet number otherwise. One form everywhere -- a page with no readable number used to
 * be cited as "PDF sheet 34", which read as a different kind of reference (user, 2026-10-02). */
export function cite(page: number | string | undefined, numbers: PageNumbers): string {
  if (page === undefined || page === null) return "";
  return `p.${printedPage(page, numbers) ?? page}`;
}

/** A list of pages, as "p. 32, 33". */
export function citeAll(pages: Array<number | string> | undefined, numbers: PageNumbers): string {
  const items = pages ?? [];
  if (items.length === 0) return "";
  return `p. ${items.map((p) => printedPage(p, numbers) ?? p).join(", ")}`;
}
