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

/** One KPI of a category's KPI Assessment (`kpis[cat][]`), scored 0–100. */
export type KpiRow = {
  kpi: string;
  score: number;
  original_score: number;
  pages: Array<number | string>;
};
export type Kpis = Partial<Record<Cat, KpiRow[]>>;
/** Per category: whether its KPI scores can be edited (ESG reports with a KPI Assessment). */
export type KpisEditable = Partial<Record<Cat, boolean>>;

/** `report_edits` (the body of preview/PUT, `logo` aside). */
export type ReportEdits = {
  headings?: Record<string, string>;
  fields?: Record<string, unknown>;
  page_scores?: Partial<Record<Cat, Record<string, number>>>;
  /** KPI name -> score 0–100. */
  kpi_scores?: Partial<Record<Cat, Record<string, number>>>;
  pillar_overrides?: Partial<Record<Cat, number | null>>;
  logo?: string | null;
  corner_logo?: string | null;
  updated_at?: string;
  updated_by?: string;
};

type Common = {
  headings?: Record<string, string>;
  logo_url?: string | null;
  /** The optional logo in the sheet's top-right corner, when one is uploaded. */
  corner_logo_url?: string | null;
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

/** Per category: whether its page scores can be edited. False when the page
 * list doesn't average to the stored pillar score (the server then rejects
 * page edits for it; the pillar score can still be set directly). */
export type PagesEditable = Partial<Record<Cat, boolean>>;

/** One strength or weakness of the rating: a headline, then the paragraph of
 * evidence behind it (esgratings-api app/reports/summary.py). */
export type RatingDriver = { headline?: string; detail?: string };

/** The rating narrative the AI wrote when the report was analysed. Absent on
 * reports analysed before it existed, and on ones whose run could not write it. */
export type RatingNarrative = {
  executive_summary?: string;
  favourable_factors?: string;
  constraints?: string;
  rating_rationale?: string;
  strengths?: RatingDriver[];
  weaknesses?: RatingDriver[];
  /** Per pillar, the written assessment: several paragraphs separated by blank lines. */
  pillar_narratives?: Partial<Record<Cat, string>>;
};

/** GET …/report and PUT …/report/edits. */
export type ReportState<E extends Effective = Effective> = {
  effective: E;
  original?: E;
  edits: ReportEdits | null;
  pages: Pages;
  pages_editable?: PagesEditable;
  kpis?: Kpis;
  kpis_editable?: KpisEditable;
  edited: boolean;
  heading_keys?: string[];
  field_keys?: string[];
  narrative?: RatingNarrative | null;
};

export type PreviewResult<E extends Effective = Effective> = {
  effective: E;
  pages: Pages;
  pages_editable?: PagesEditable;
  kpis?: Kpis;
  kpis_editable?: KpisEditable;
};

/** The server's cap on list fields (`LIST_MAX` in app/reports/editing.py). */
export const LIST_MAX = 20;

/** A field value with "no override" parts removed: blank text (after trim),
 * empty lists, and objects left empty. Returns undefined when nothing is
 * left, meaning the field key should be dropped (same rule as the server).
 * List items stay as typed, so a just-added empty item keeps its input. */
export function pruneField(value: unknown): unknown {
  if (typeof value === "string") return value.trim() === "" ? undefined : value;
  if (Array.isArray(value)) return value.length === 0 ? undefined : value;
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      const p = pruneField(v);
      if (p !== undefined) out[k] = p;
    }
    return Object.keys(out).length ? out : undefined;
  }
  return value ?? undefined;
}

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

/** Which logo: the report's own, or the one in the sheet's top-right corner. */
export type LogoSlot = "main" | "corner";

function logoUrl(kind: ReportKind, id: string, slot: LogoSlot) {
  const url = `${base(kind, id)}/logo`;
  return slot === "main" ? url : `${url}?slot=${slot}`;
}

/** POST …/report/logo — stored at once (not part of Save); returns the GET body. */
export function uploadReportLogo<E extends Effective>(
  kind: ReportKind,
  id: string,
  file: File,
  slot: LogoSlot = "main",
) {
  const body = new FormData();
  body.append("logo", file);
  return apiUpload<ReportState<E>>(logoUrl(kind, id, slot), body);
}

/** DELETE …/report/logo — back to the default logo (the corner one: to none);
 * returns the GET body. */
export function deleteReportLogo<E extends Effective>(
  kind: ReportKind,
  id: string,
  slot: LogoSlot = "main",
) {
  return apiFetch<ReportState<E>>(logoUrl(kind, id, slot), { method: "DELETE" });
}

/** The edits object without server bookkeeping. The logo is never sent: it
 * is managed only by POST/DELETE …/report/logo (PUT ignores it). */
function stripMeta(edits: ReportEdits): ReportEdits {
  return {
    headings: edits.headings ?? {},
    fields: edits.fields ?? {},
    page_scores: edits.page_scores ?? {},
    kpi_scores: edits.kpi_scores ?? {},
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
): {
  submission: BfsiSubmission;
  overall: BfsiOverall;
  recommendation: string;
  grades: BfsiEffective["grades"];
} {
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
  return { submission, overall: eff.overall, recommendation: eff.recommendation, grades: eff.grades };
}

/** The logo `<img>` src for an effective report, or null for the default.
 * `bust` changes after every upload so the browser refetches. */
export function logoSrcOf(eff: Effective | null | undefined, bust: number): string | null {
  return bustedSrc(eff?.logo_url, bust);
}

/** The corner logo's `<img>` src, or null when the corner holds no logo. */
export function cornerLogoSrcOf(eff: Effective | null | undefined, bust: number): string | null {
  return bustedSrc(eff?.corner_logo_url, bust);
}

function bustedSrc(url: string | null | undefined, bust: number): string | null {
  if (!url) return null;
  return bust ? `${url}${url.includes("?") ? "&" : "?"}v=${bust}` : url;
}
