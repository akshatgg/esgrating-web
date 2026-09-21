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

/** The largest capture scale that still fits one canvas of the whole sheet inside every
 * browser's limits. Past them the browser hands back a blank canvas with no error. */
function fittedScale(el: HTMLElement, opts: PdfOpts): number {
  const wanted = Number(html2canvasOpts(opts).scale ?? 2) || 1;
  const { width, height } = sheetSize(el);
  if (!width || !height) return wanted;
  const bySide = MAX_CANVAS_SIDE / Math.max(width, height);
  const byArea = Math.sqrt(MAX_CANVAS_AREA / (width * height));
  return Math.floor(Math.min(wanted, bySide, byArea) * 100) / 100;
}

/** The sheet as a ONE-page jsPDF document.
 *
 * html2pdf is not asked to paginate at all here. Computing a page height for it and
 * trusting it to fit means matching its own rounding -- floor(canvasWidth * pageHeight /
 * pageWidth) against the canvas html2canvas actually produced -- and a sheet a pixel over
 * that line comes out as a second, empty page (production, 2026-09-21). Instead the canvas
 * is drawn first and the page is cut to it, so there is exactly one page by construction
 * and no arithmetic left to get wrong. The page keeps the configured width, and its height
 * follows the sheet's own proportions, never shorter than the configured page.
 */
async function onePageDoc(el: HTMLElement, opts: PdfOpts) {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);
  const h2c = html2canvasOpts(opts);
  const [pageWidth, minHeight] = pageSize(opts);
  const canvas = await html2canvas(el, {
    scale: fittedScale(el, opts),
    backgroundColor: "#ffffff",
    useCORS: Boolean(h2c.useCORS),
    onclone: h2c.onclone as ((doc: Document) => void) | undefined,
  });
  const height = Math.max(minHeight, (canvas.height * pageWidth) / (canvas.width || 1));
  const doc = new jsPDF({ unit: "px", format: [pageWidth, height], orientation: "portrait" });
  // Drawn at the sheet's own proportions and pinned to the top, so a sheet shorter than
  // the minimum page leaves its white space at the bottom rather than being stretched.
  const drawn = (canvas.height * pageWidth) / (canvas.width || 1);
  doc.addImage(canvas.toDataURL("image/jpeg", 0.92), "JPEG", 0, 0, pageWidth, drawn);
  return doc;
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
const MAX_PAGES = 500;
/** A page cut short to keep a block whole must still be at least this full. */
const MIN_PAGE_FILL = 0.15;
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

/** The blocks a page must not be cut through: every element that fits inside one page,
 * as a [top, bottom] range measured from the top of the sheet. An element taller than a
 * page cannot be kept whole, so its children are considered instead.
 *
 * html2canvas draws a picture; CSS `break-inside` means nothing to it, and slicing that
 * picture at fixed page heights cut headings and banners in half (user, 2026-09-21). */
function unbreakableRanges(root: HTMLElement, maxHeight: number): Array<[number, number]> {
  const ranges: Array<[number, number]> = [];
  const rootTop = root.getBoundingClientRect().top;
  const visit = (el: Element) => {
    for (const child of Array.from(el.children)) {
      const box = child.getBoundingClientRect();
      if (box.height <= 0) continue;
      const top = box.top - rootTop;
      if (box.height <= maxHeight) ranges.push([top, top + box.height]);
      else visit(child); // too tall to keep whole: look for smaller blocks inside it
    }
  };
  visit(root);
  return ranges;
}

/** Where each page starts and ends, in sheet pixels. A page ends at the page height
 * unless that lands inside a block, in which case it ends where that block begins and
 * the rest of the page is left white -- the same bargain a print stylesheet makes. */
function pageCuts(height: number, pageHeight: number, ranges: Array<[number, number]>): number[] {
  const cuts = [0];
  let cur = 0;
  let guard = 0;
  while (cur + pageHeight < height && guard++ < MAX_PAGES) {
    let next = cur + pageHeight;
    for (const [top, bottom] of ranges) {
      // A block that starts after this page began and is cut by the page's end: the
      // page ends where it starts instead.
      if (top > cur && top < next && bottom > next) next = Math.min(next, top);
    }
    // Moving the cut up is worth it only if the page still carries something. A block
    // that begins just inside a page and runs past its end would otherwise leave an
    // almost blank sheet, which is worse than splitting the block.
    if (next - cur < pageHeight * MIN_PAGE_FILL) next = cur + pageHeight;
    cuts.push(next);
    cur = next;
  }
  cuts.push(height);
  return cuts;
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
  // Pages end on a block boundary, so one is never cut through a heading or a banner.
  const cuts = pageCuts(height, pageHeight, unbreakableRanges(el, pageHeight));
  const pages = cuts.length - 1;

  const doc = new jsPDF({ unit: "px", format: [pageWidth, pageHeight], orientation: "portrait" });
  const page = document.createElement("canvas");
  page.width = Math.round(pageWidth * scale);
  page.height = Math.round(pageHeight * scale);
  const ctx = page.getContext("2d");
  if (!ctx) throw new Error("canvas unavailable");

  for (let first = 0; first < pages; first += PAGES_PER_BAND) {
    const last = Math.min(first + PAGES_PER_BAND, pages);
    const top = cuts[first];
    const band = await html2canvas(el, {
      x: 0,
      y: top,
      width,
      height: cuts[last] - top,
      scale,
      backgroundColor: "#ffffff",
      useCORS: Boolean(h2c.useCORS),
      onclone: h2c.onclone as ((doc: Document) => void) | undefined,
    });
    const fit = page.width / band.width; // the sheet is scaled to the page width
    for (let i = first; i < last; i++) {
      const sourceTop = Math.round((cuts[i] - top) * scale);
      const sourceHeight = Math.min(
        Math.round((cuts[i + 1] - cuts[i]) * scale),
        band.height - sourceTop,
      );
      if (sourceHeight <= 0) break;
      if (i > 0) doc.addPage([pageWidth, pageHeight], "portrait");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, page.width, page.height);
      // Drawn at the top: a page cut short to keep a block whole leaves white below it.
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
  if (fitsOnePage(opts)) return (await onePageDoc(el, opts)).output("blob");
  if (tooTallForOneCanvas(el, opts)) {
    return (await bandedDoc(el, opts)).output("blob");
  }
  const html2pdf = (await import("html2pdf.js")).default;
  return html2pdf().set(opts).from(el).outputPdf("blob");
}

/** Renders `el` to a PDF and triggers a browser download as `filename`. */
export async function downloadPdf(
  el: HTMLElement,
  filename: string,
  opts: PdfOpts = ESG_PDF_OPTS,
): Promise<void> {
  if (fitsOnePage(opts)) {
    (await onePageDoc(el, opts)).save(filename);
    return;
  }
  if (tooTallForOneCanvas(el, opts)) {
    (await bandedDoc(el, opts)).save(filename);
    return;
  }
  const html2pdf = (await import("html2pdf.js")).default;
  await html2pdf()
    .set({ ...opts, filename })
    .from(el)
    .save();
}
