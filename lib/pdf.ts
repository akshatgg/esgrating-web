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

/** The one-pagers (ESG Rating Report, ESG Rating List, BFSI one-pager): the whole
 * sheet on ONE page, however tall it is -- see "One page" below. */
export const ONE_PAGER_PDF_OPTS = { ...ESG_PDF_OPTS, fitPage: true } as const;

/** BFSI detailed report + one-pager. report.php:282 and one_pager.php:677 call
 * `html2pdf().from(el).save(name)` with no options at all (html2pdf's own
 * defaults: US letter, inches, no margin); per the W7 decision the BFSI PDFs
 * reuse the ESG options above instead — both sheets lay out inside its
 * 750px-wide page. */
export const BFSI_PDF_OPTS = ESG_PDF_OPTS;

// --- One page ---------------------------------------------------------------
//
// A one-pager is one page only while its content is short enough. The page was a
// fixed 750x1400 px, and html2pdf slices the canvas into pages of
// floor(canvasWidth * pageHeight / pageWidth) px (worker.js:182), so a sheet a
// pixel past that height becomes two pages -- and `avoid-all` first inserts a
// padding div (pagebreaks.js:115-121) to push the straddling block to the next
// page, so the spill arrives as a page of white space. A report whose KPI
// keywords ran long came out as three mostly blank pages that way, while a
// shorter one (95% of the same page height) was fine (user, 2026-09-20).
//
// With `fitPage` the page grows to the sheet instead: the height html2pdf's own
// arithmetic needs for a single page, never less than the configured one, so
// short reports keep exactly the page they have today. `+ 1` absorbs the floor().
//
// A sheet tall enough to bust the canvas limits below would come back blank, so
// the capture scale drops just far enough to stay inside them -- a softer image,
// but still one page, and still every pixel of the sheet.

function fitsOnePage(opts: PdfOpts): boolean {
  return opts.fitPage === true;
}

function fittedFormat(el: HTMLElement, opts: PdfOpts): [number, number] {
  const [pageWidth, pageHeight] = pageSize(opts);
  const { width, height } = sheetSize(el);
  if (!width || !height) return [pageWidth, pageHeight];
  return [pageWidth, Math.max(pageHeight, Math.ceil((pageWidth * height) / width) + 1)];
}

function fittedScale(el: HTMLElement, opts: PdfOpts): number {
  const wanted = Number(html2canvasOpts(opts).scale ?? 2) || 1;
  const { width, height } = sheetSize(el);
  if (!width || !height) return wanted;
  const bySide = MAX_CANVAS_SIDE / Math.max(width, height);
  const byArea = Math.sqrt(MAX_CANVAS_AREA / (width * height));
  return Math.floor(Math.min(wanted, bySide, byArea) * 100) / 100;
}

/** `opts` with the page grown to the sheet, when the caller asked for one page. */
function fitPageToSheet(el: HTMLElement, opts: PdfOpts): PdfOpts {
  if (!fitsOnePage(opts)) return opts;
  const jspdf = (typeof opts.jsPDF === "object" && opts.jsPDF !== null ? opts.jsPDF : {}) as Record<
    string,
    unknown
  >;
  return {
    ...opts,
    jsPDF: { ...jspdf, format: fittedFormat(el, opts) },
    html2canvas: { ...html2canvasOpts(opts), scale: fittedScale(el, opts) },
  };
}

// --- Tall sheets ------------------------------------------------------------
//
// html2pdf draws the whole sheet into ONE canvas, and a canvas has limits: about
// 16.7M pixels of area and 8,192 px on a side in Safari (much lower on iOS).
// Past them the browser hands back a blank canvas with no error, so every page
// of the PDF comes out empty while the same report looks right on screen and
// prints fine in Chrome. A detailed report is easily 6,000+ CSS px tall, which
// is 12,000 px and 18M pixels at scale 2 — over the line.
//
// So a sheet that would bust the budget is captured in bands of a few pages at
// a time and the PDF is assembled from those. Each band stays far inside every
// browser's limit, and the sheet keeps the same scale, width and page size as
// the single-canvas path.

const MAX_CANVAS_AREA = 16_000_000;
const MAX_CANVAS_SIDE = 8_192;
const PAGES_PER_BAND = 2;
const DEFAULT_PAGE: [number, number] = [750, 1400];

type PdfOpts = Record<string, unknown>;

function html2canvasOpts(opts: PdfOpts): Record<string, unknown> {
  const value = opts.html2canvas;
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
}

function pageSize(opts: PdfOpts): [number, number] {
  const jspdf = opts.jsPDF as { format?: unknown } | undefined;
  const format = jspdf?.format;
  return Array.isArray(format) && format.length === 2 && format.every((n) => typeof n === "number")
    ? [format[0] as number, format[1] as number]
    : DEFAULT_PAGE;
}

function sheetSize(el: HTMLElement): { width: number; height: number } {
  return {
    width: el.scrollWidth || el.offsetWidth || DEFAULT_PAGE[0],
    height: el.scrollHeight || el.offsetHeight || 0,
  };
}

/** True when one canvas of the whole sheet would exceed what browsers draw. */
function tooTallForOneCanvas(el: HTMLElement, opts: PdfOpts): boolean {
  const { width, height } = sheetSize(el);
  const scale = Number(html2canvasOpts(opts).scale ?? 2) || 1;
  return height * scale > MAX_CANVAS_SIDE || width * scale * height * scale > MAX_CANVAS_AREA;
}

/** The sheet as a jsPDF document, captured band by band (see above). */
async function bandedDoc(el: HTMLElement, opts: PdfOpts) {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);
  const h2c = html2canvasOpts(opts);
  const scale = Number(h2c.scale ?? 2) || 1;
  const [pageWidth, pageHeight] = pageSize(opts);
  const { width, height } = sheetSize(el);
  const pages = Math.max(1, Math.ceil(height / pageHeight));

  const doc = new jsPDF({ unit: "px", format: [pageWidth, pageHeight], orientation: "portrait" });
  const page = document.createElement("canvas");
  page.width = Math.round(pageWidth * scale);
  page.height = Math.round(pageHeight * scale);
  const ctx = page.getContext("2d");
  if (!ctx) throw new Error("canvas unavailable");

  for (let first = 0; first < pages; first += PAGES_PER_BAND) {
    const top = first * pageHeight;
    const band = await html2canvas(el, {
      x: 0,
      y: top,
      width,
      height: Math.min(PAGES_PER_BAND * pageHeight, height - top),
      scale,
      backgroundColor: "#ffffff",
      useCORS: Boolean(h2c.useCORS),
      onclone: h2c.onclone as ((doc: Document) => void) | undefined,
    });
    const fit = page.width / band.width; // the sheet is scaled to the page width
    for (let i = 0; first + i < pages && i < PAGES_PER_BAND; i++) {
      const sourceTop = Math.round(i * pageHeight * scale);
      const sourceHeight = Math.min(page.height, band.height - sourceTop);
      if (sourceHeight <= 0) break;
      if (first + i > 0) doc.addPage([pageWidth, pageHeight], "portrait");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, page.width, page.height);
      ctx.drawImage(band, 0, sourceTop, band.width, sourceHeight,
                    0, 0, page.width, sourceHeight * fit);
      doc.addImage(page.toDataURL("image/jpeg", 0.92), "JPEG", 0, 0, pageWidth, pageHeight);
    }
  }
  return doc;
}

/** Renders `el` to a PDF `Blob` — for attaching to the "send report" upload,
 * without triggering a browser download. */
export async function pdfBlob(
  el: HTMLElement,
  opts: PdfOpts = ESG_PDF_OPTS,
): Promise<Blob> {
  const fitted = fitPageToSheet(el, opts);
  // Banding is what splits a tall sheet across pages; a one-pager never takes it.
  if (!fitsOnePage(fitted) && tooTallForOneCanvas(el, fitted)) {
    return (await bandedDoc(el, fitted)).output("blob");
  }
  const html2pdf = (await import("html2pdf.js")).default;
  return html2pdf().set(fitted).from(el).outputPdf("blob");
}

/** Renders `el` to a PDF and triggers a browser download as `filename`. */
export async function downloadPdf(
  el: HTMLElement,
  filename: string,
  opts: PdfOpts = ESG_PDF_OPTS,
): Promise<void> {
  const fitted = fitPageToSheet(el, opts);
  if (!fitsOnePage(fitted) && tooTallForOneCanvas(el, fitted)) {
    (await bandedDoc(el, fitted)).save(filename);
    return;
  }
  const html2pdf = (await import("html2pdf.js")).default;
  await html2pdf()
    .set({ ...fitted, filename })
    .from(el)
    .save();
}
