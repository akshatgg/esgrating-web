// PDF generation for the report pages, ported from `esg-report.php`'s
// html2pdf call (esg.md §B4). `html2pdf.js` touches `window`/`document`, so it
// is imported dynamically inside each function — it must never end up in a
// server bundle.

/** html2canvas clones the page before drawing; open every <details> in that clone
 * so collapsed sections (the detailed reports' Scoring Rationale) print their
 * content. The page itself keeps them as they were. */
function openDetails(doc: Document): void {
  doc.querySelectorAll("details").forEach((d) => {
    d.open = true;
  });
}

/** Exact html2pdf options from esg-report.php (esg.md §B4), plus `onclone`
 * (openDetails above). */
export const ESG_PDF_OPTS = {
  html2canvas: { scale: 2, useCORS: false, onclone: openDetails },
  jsPDF: { unit: "px", format: [750, 1400], orientation: "portrait" },
  pagebreak: { mode: ["avoid-all", "css", "legacy"] },
} as const;

/** BFSI detailed report + one-pager. report.php:282 and one_pager.php:677 call
 * `html2pdf().from(el).save(name)` with no options at all (html2pdf's own
 * defaults: US letter, inches, no margin); per the W7 decision the BFSI PDFs
 * reuse the ESG options above instead — both sheets lay out inside its
 * 750px-wide page. */
export const BFSI_PDF_OPTS = ESG_PDF_OPTS;

/** Renders `el` to a PDF `Blob` — for attaching to the "send report" upload,
 * without triggering a browser download. */
export async function pdfBlob(
  el: HTMLElement,
  opts: Record<string, unknown> = ESG_PDF_OPTS,
): Promise<Blob> {
  const html2pdf = (await import("html2pdf.js")).default;
  return html2pdf().set(opts).from(el).outputPdf("blob");
}

/** Renders `el` to a PDF and triggers a browser download as `filename`. */
export async function downloadPdf(
  el: HTMLElement,
  filename: string,
  opts: Record<string, unknown> = ESG_PDF_OPTS,
): Promise<void> {
  const html2pdf = (await import("html2pdf.js")).default;
  await html2pdf()
    .set({ ...opts, filename })
    .from(el)
    .save();
}
