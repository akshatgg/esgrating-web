// Editable reports (docs/specs/2026-09-10-editable-reports-design.md). The one
// place that knows the `…/report` API shapes and maps its `effective` report
// onto the props the report components already take. The browser never
// computes scores: every number shown in edit mode comes from the server's
// `effective` (GET, or the debounced POST …/report/preview).
import { apiFetch, apiUpload } from "@/lib/api";
import type {
  BfsiAi,
  BfsiCategory,
  BfsiOverall,
  BfsiReason,
  BfsiSubmission,
  EsgFinal,
  Grade,
} from "@/lib/types";

export type ReportKind = "esg" | "bfsi";
export type Cat = BfsiCategory;
export const CATS: ReadonlyArray<readonly [Cat, string]> = [
  ["E", "Environment"],
  ["S", "Social"],
  ["G", "Governance"],
];

/** One scored page of a category (`pages[cat][]`). */
export type PageRow = {
  page: number;
  score: number | null;
  original_score: number | null;
  reason: string;
};
export type Pages = Partial<Record<Cat, PageRow[]>>;

/** `report_edits` (the body of preview/PUT, `logo` aside). */
export type ReportEdits = {
  headings?: Record<string, string>;
  fields?: Record<string, unknown>;
  page_scores?: Partial<Record<Cat, Record<string, number>>>;
  pillar_overrides?: Partial<Record<Cat, number | null>>;
  logo?: string | null;
  updated_at?: string;
  updated_by?: string;
};

type Common = {
  headings?: Record<string, string>;
  logo_url?: string | null;
  pillar_manual?: Partial<Record<Cat, boolean>>;
  company?: string;
  fy?: string;
};

export type BfsiEffective = Common & {
  ai_analysis: BfsiAi;
  e_score: number;
  s_score: number;
  g_score: number;
  overall: BfsiOverall;
  recommendation: string;
  grades?: Partial<Record<Cat, { grade: Grade; label: string }>>;
  sector?: string;
  industry?: string;
  report_date?: string;
};

export type EsgEffective = Common & { final: EsgFinal };

export type Effective = BfsiEffective | EsgEffective;

/** GET …/report and PUT …/report/edits. */
export type ReportState<E extends Effective = Effective> = {
  effective: E;
  original?: E;
  edits: ReportEdits | null;
  pages: Pages;
  edited: boolean;
  heading_keys?: string[];
  field_keys?: string[];
};

export type PreviewResult<E extends Effective = Effective> = { effective: E; pages: Pages };

const base = (kind: ReportKind, id: string) => `/api/admin/${kind}/submissions/${id}/report`;

const JSON_HEADERS = { "Content-Type": "application/json" };

export function getReport<E extends Effective>(kind: ReportKind, id: string, signal?: AbortSignal) {
  return apiFetch<ReportState<E>>(base(kind, id), { signal });
}

export function previewReport<E extends Effective>(
  kind: ReportKind,
  id: string,
  edits: ReportEdits,
  signal?: AbortSignal,
) {
  return apiFetch<PreviewResult<E>>(`${base(kind, id)}/preview`, {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify(stripMeta(edits)),
    signal,
  });
}

export function saveReportEdits<E extends Effective>(kind: ReportKind, id: string, edits: ReportEdits) {
  return apiFetch<ReportState<E>>(`${base(kind, id)}/edits`, {
    method: "PUT",
    headers: JSON_HEADERS,
    body: JSON.stringify(stripMeta(edits)),
  });
}

export function resetReportEdits(kind: ReportKind, id: string) {
  return apiFetch<unknown>(`${base(kind, id)}/edits`, { method: "DELETE" });
}

/** POST …/report/logo — stored at once (not part of Save); returns the GET body. */
export function uploadReportLogo<E extends Effective>(kind: ReportKind, id: string, file: File) {
  const body = new FormData();
  body.append("logo", file);
  return apiUpload<ReportState<E>>(`${base(kind, id)}/logo`, body);
}

/** DELETE …/report/logo — back to the default logo; returns the GET body. */
export function deleteReportLogo<E extends Effective>(kind: ReportKind, id: string) {
  return apiFetch<ReportState<E>>(`${base(kind, id)}/logo`, { method: "DELETE" });
}

/** The edits object without server bookkeeping. The logo is never sent: it
 * is managed only by POST/DELETE …/report/logo (PUT ignores it). */
function stripMeta(edits: ReportEdits): ReportEdits {
  return {
    headings: edits.headings ?? {},
    fields: edits.fields ?? {},
    page_scores: edits.page_scores ?? {},
    pillar_overrides: edits.pillar_overrides ?? {},
  };
}

/** A fresh, deep-copied draft from the saved edits. */
export function draftFrom(edits: ReportEdits | null | undefined): ReportEdits {
  return structuredClone(stripMeta(edits ?? {}));
}

// --- Mapping `effective` onto the existing component props --------------------

/** BFSI: the detail page's submission/overall/recommendation with the
 * effective report laid over them. `reasons` come from `pages` where the AI
 * stored page objects, so edited scores and reason text show in the rationale. */
export function bfsiView(
  sub: BfsiSubmission,
  eff: BfsiEffective,
  pages: Pages | undefined,
): { submission: BfsiSubmission; overall: BfsiOverall; recommendation: string } {
  const ai: BfsiAi = { ...(sub.ai_analysis as BfsiAi), ...eff.ai_analysis };
  if (pages) {
    const reasons: BfsiAi["reasons"] = { ...ai.reasons };
    for (const [cat] of CATS) {
      const rows = pages[cat];
      const orig = ai.reasons?.[cat];
      const objectShaped = Array.isArray(orig) && orig.length > 0 && typeof orig[0] === "object";
      if (rows && rows.length > 0 && (objectShaped || !orig || orig.length === 0)) {
        reasons[cat] = rows.map<BfsiReason>((r) => ({ page: r.page, score: r.score, reason: r.reason }));
      }
    }
    ai.reasons = reasons;
  }
  const submission: BfsiSubmission = {
    ...sub,
    ai_analysis: ai,
    e_score: eff.e_score,
    s_score: eff.s_score,
    g_score: eff.g_score,
    borrower_name: eff.company ?? sub.borrower_name,
  };
  return { submission, overall: eff.overall, recommendation: eff.recommendation };
}

/** The logo `<img>` src for an effective report, or null for the default.
 * `bust` changes after every upload so the browser refetches. */
export function logoSrcOf(eff: Effective | null | undefined, bust: number): string | null {
  const url = eff?.logo_url;
  if (!url) return null;
  return bust ? `${url}${url.includes("?") ? "&" : "?"}v=${bust}` : url;
}
