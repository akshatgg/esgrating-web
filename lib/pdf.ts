// PDF generation for the report pages, ported from `esg-report.php`'s
// html2pdf call (esg.md §B4). `html2pdf.js` touches `window`/`document`, so it
// is imported dynamically inside each function — it must never end up in a
// server bundle.

/** Exact html2pdf options from esg-report.php (esg.md §B4). */
export const ESG_PDF_OPTS = {
  html2canvas: { scale: 2, useCORS: false },
  jsPDF: { unit: "px", format: [750, 1400], orientation: "portrait" },
  pagebreak: { mode: ["avoid-all", "css", "legacy"] },
} as const;

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
