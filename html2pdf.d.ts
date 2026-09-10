// Minimal ambient types for html2pdf.js@0.10.1 (pinned — see package.json),
// which ships no TypeScript declarations of its own. Only the surface used by
// lib/pdf.ts is typed.
declare module "html2pdf.js" {
  type Html2PdfOptions = {
    margin?: number | [number, number, number, number];
    filename?: string;
    image?: { type?: string; quality?: number };
    html2canvas?: Record<string, unknown>;
    jsPDF?: Record<string, unknown>;
    pagebreak?: {
      mode?: string[];
      before?: string | string[];
      after?: string | string[];
      avoid?: string | string[];
    };
  };

  interface Html2PdfWorker {
    from(src: HTMLElement | string, type?: "element" | "string" | "canvas" | "img"): Html2PdfWorker;
    set(opt: Html2PdfOptions): Html2PdfWorker;
    save(filename?: string): Promise<void>;
    outputPdf(type: "blob"): Promise<Blob>;
    outputPdf(type?: string, options?: unknown): Promise<unknown>;
  }

  function html2pdf(): Html2PdfWorker;
  function html2pdf(src: HTMLElement | string, opt?: Html2PdfOptions): Promise<void>;

  export default html2pdf;
}
