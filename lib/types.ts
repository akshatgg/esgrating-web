// Shared API response/request shapes for the ESG and BFSI calculators (and,
// later, the admin dashboard). Field names mirror the Mongo documents and API
// contract documented in ../docs/analysis/esg.md §A6/§B1 and
// ../docs/analysis/bfsi.md §1a/§1d — see ../docs/specs/2026-09-10-esgratings-rebuild-design.md
// for the endpoint list.

/** `GET /api/bfsi/options` — verbatim from `bfsi-calculator/config/options.php`. */
export type BfsiOptions = {
  industries: Record<
    string,
    { label: string; step3_set: string; sub_sectors: string[] }
  >;
  loan_purposes: string[];
  loan_types: string[];
  weightage: Record<string, { e: number; s: number; g: number }>;
  loantype_to_weightage: Record<string, string>;
  max_upload_mb: number;
};

/** Grade letters shared by both calculators (`bfsi_grade` / `evaluate_score`). */
export type Grade = "A+" | "A" | "B+" | "B" | "C" | "D";

/** Year-over-year comparison returned by `get_esg_score` (esg.md §A6). */
export type YearScore =
  | {
      latest_year: string;
      latest_score: number;
      previous_year: string | "N/A";
      previous_score: number | "N/A";
      difference: number | "N/A";
      trend_flag: "positive" | "negative";
      history: Array<{ report_year: string; composite_score: number }>;
    }
  | { status: false; message: string };

/** A KPI's best result in a report. ESG KPI scoring (esgratings-api
 * app/esg/scoring.py): strong = 61–100, partial = 1–60, none = 0. Older reports
 * and BFSI: strong = 100 points, partial = 50, none = 0. */
export type KpiLevel = "strong" | "partial" | "none";

/** `method` value of a category scored KPI by KPI, 0–100 (app/esg/scoring.py METHOD). */
export const KPI_SCORE_METHOD = "kpi_score";

export type KpiCoverageCategory = {
  /** The pillar score: the KPIs' best scores as a percentage of the maximum. */
  score: number;
  /** "kpi_score" when each KPI was scored 0–100; absent on strong/partial results. */
  method?: string;
  /** The pillar score an analyst typed in the report editor, when it differs from the
   * KPI total (`score`). Every report shows this number, with the KPI total beside it. */
  analyst_score?: number;
  kpis: Array<{
    kpi: string;
    level: KpiLevel;
    /** The KPI's best score, 0–100 (equals `score` on KPI-scored results). */
    points: number;
    score?: number;
    pages: Array<number | string>;
  }>;
};

export type KpiCoverage = Partial<Record<"Environment" | "Social" | "Governance", KpiCoverageCategory>>;

/** One page of an ESG report: each pillar's page score and how many KPIs it proved. */
export type PageScoreRow = { page: number | string } & Partial<
  Record<
    "Environment" | "Social" | "Governance",
    {
      score: number | string | null;
      kpis: number;
      /** The KPIs on this page: "… (80)" with their scores, or "… (partial)" on older reports. */
      kpi_names?: string[];
      /** The AI's reason for the page score. */
      reason?: string;
    }
  >
>;

/** `final_report_data` / `llm_response` shape (esg.md §A6). */
export type EsgFinal = {
  environmental_score: number;
  social_score: number;
  governance_score: number;
  composite_score: number;
  sector: string;
  industry: string;
  environmental_top_keywords: string[];
  social_top_keywords: string[];
  governance_top_keywords: string[];
  report_date: string;
  environmental_score_performance: Grade;
  social_score_performance: Grade;
  governance_score_performance: Grade;
  composite_score_performance: Grade;
  environmental_score_performance_label: string;
  social_score_performance_label: string;
  governance_score_performance_label: string;
  composite_score_performance_label: string;
  /** Reports scored on KPIs only; older and imported reports lack it. */
  kpi_coverage?: KpiCoverage;
  /** "kpi_score" on reports scored KPI by KPI (weights 35/30/35); absent on older ones (30/30/40). */
  scoring_method?: string;
  page_scores?: PageScoreRow[];
};

export type AnalysisStatus = "idle" | "running" | "done" | "failed";

/** `esg_submissions` document (new collection — the CF7 form stored nothing). */
export type EsgSubmission = {
  _id: string;
  name: string;
  email: string;
  designation: string;
  company_name: string;
  mobile_number: string;
  report_year: string;
  /** null for reports imported from the old calculator (no stored upload). */
  file_path: string | null;
  file_sha256: string | null;
  submit_ip: string;
  status: "new" | "report_generated" | "sent";
  created_at: string;
  final?: EsgFinal;
  year_score?: YearScore;
  company_id?: string;
  analysis_status: AnalysisStatus;
  analysis_error?: string | null;
  analysis_started_at?: string | null;
  sent_at?: string | null;
};

/** `bfsi_submissions` document (bfsi.md §1d). */
export type BfsiSubmission = {
  _id: string;
  created_at: string;
  borrower_name: string;
  cin_gstin: string;
  industry: string;
  sub_sector: string;
  loan_amount: number;
  loan_purpose: string;
  loan_type: string;
  outstanding_loans: number;
  contact_email: string;
  answers: unknown[];
  file_path: string;
  file_sha256: string;
  submit_ip: string;
  /** Missing on some legacy rows — the dashboard shows `new` then. */
  status?: "new" | "report_generated" | "sent";
  e_score?: number;
  s_score?: number;
  g_score?: number;
  /** null for hand-added / imported rows without a score. */
  overall_score?: number | null;
  /** Free text for hand-added / imported rows (only A+…D in practice). */
  grade?: string | null;
  ai_analysis?: BfsiAi;
  text_sha256?: string;
  text_source?: "text" | "ocr";
  text_truncated?: boolean;
  imported?: boolean;
  // Background-job bookkeeping (esgratings-api app/core/jobs.py).
  analysis_status?: AnalysisStatus;
  analysis_error?: string | null;
  analysis_started_at?: string | null;
  sent_at?: string | null;
};

export type BfsiCategory = "E" | "S" | "G";

/** One page-level scoring reason. Pre-page-scoring analyses stored plain
 * strings instead (report.php:238), so readers must accept both shapes. */
export type BfsiReason = { page: number; score: number | null; reason: string };

/** `ai_analysis` — the return of `bfsi_analyze()` (bfsi.md §4c). */
export type BfsiAi = {
  e_score: number;
  s_score: number;
  g_score: number;
  keywords: Partial<Record<BfsiCategory, string[]>>;
  negative_keywords: Partial<Record<BfsiCategory, string[]>>;
  reasons: Partial<Record<BfsiCategory, Array<BfsiReason | string>>>;
  detected_sector: string;
  detected_industry: string;
  top_risks: string[];
  top_improvements: string[];
  climate_risk: string;
  governance_summary: string;
  /** Reports scored on KPIs only; older analyses lack it. */
  kpi_coverage?: KpiCoverage;
  /** "kpi_score" when each KPI was scored 0–100 (grades on whole numbers); absent on older analyses. */
  scoring_method?: string;
  key_metrics: {
    employees: string;
    women_pct: string;
    attrition: string;
    complaints: string;
    csr: string;
  };
};

/** `bfsi_overall()` result (bfsi.md §4d). */
export type BfsiOverall = {
  overall: number;
  grade: Grade;
  label: string;
  weights: { e: number; s: number; g: number };
  weightage_row: string;
};

/** `GET /api/admin/bfsi/submissions/{id}` (esgratings-api app/bfsi/router_admin.py). */
export type BfsiDetail = {
  submission: BfsiSubmission;
  /** Recomputed from the stored E/S/G on every load (report.php:17); null until scored. */
  overall: BfsiOverall | null;
  recommendation: string | null;
  /** The borrower's previous scored submission under the same CIN/GSTIN. */
  previous: { overall: number | null; created_at: string | null } | null;
  industry_label: string;
};

// --- Superadmin console ---------------------------------------------------------

/** Paged admin list response (`{items, total, page, pages}`). */
export type Paged<T> = { items: T[]; total: number; page: number; pages: number };

/** Per-collection pipeline counts — every doc counted once, a running/failed
 * analysis taking priority over `status` (esgratings-api app/dashboard/router.py). */
export type StatusCounts = {
  total: number;
  new: number;
  running: number;
  report_generated: number;
  sent: number;
  failed: number;
  /** report_generated + sent */
  reports_generated: number;
};

export type DailyCount = { date: string; esg: number; bfsi: number };

export type RecentSubmission = {
  id: string;
  title: string | null;
  subtitle: string | null;
  created_at: string | null;
  status: string | null;
  analysis_status: string | null;
  score: number | null;
  grade: string | null;
};

export type RecentMessage = {
  id: string;
  title: string | null;
  subtitle: string | null;
  created_at: string | null;
  preview: string;
};

export type AttentionItem = {
  kind: "esg" | "bfsi";
  id: string;
  title: string | null;
  reason: string;
  detail: string | null;
  created_at: string | null;
};

/** `GET /api/admin/stats` (esgratings-api app/dashboard/router.py). */
export type AdminStats = {
  generated_at: string;
  esg: StatusCounts;
  bfsi: StatusCounts;
  ratings: { total: number; average: number; by_grade: Record<Grade, number> };
  messages: { total: number; last_7_days: number };
  /** 30 UTC days, oldest first. */
  daily: DailyCount[];
  recent: { esg: RecentSubmission[]; bfsi: RecentSubmission[]; messages: RecentMessage[] };
  attention: AttentionItem[];
};

/** One `esg_ratings` row as the admin list returns it (esgratings-api app/ratings). */
export type RatingRow = {
  s_no: number;
  company_name: string;
  sector: string;
  esg_rating: number;
  /** Stored `YYYY-MM-DD` (unparseable imports are kept as-is). */
  date_of_rating: string;
  grade: string;
  category: string;
};

/** One row of the merged ESG list — `GET /api/admin/esg/combined` items and
 * `GET /api/admin/ratings/{s_no}` (esgratings-api app/esg/combined.py
 * `_calc_item` / `rating_item`). */
export type EsgListItem = {
  source: "calculator" | "rating";
  /** Submission ObjectId (calculator) or `s_no` as a string (rating). */
  id: string;
  company: string | null;
  sector: string | null;
  /** Composite score rounded to 1 dp (calculator; null until analysed) or `esg_rating`. */
  rating: number | null;
  grade: string | null;
  category: string | null;
  /** `YYYY-MM-DD` (calculator `created_at` in UTC, or the stored `date_of_rating`). */
  date: string;
  status: "new" | "running" | "failed" | "sent" | "report_generated" | "rated";
  contact: { name: string | null; email: string | null } | null;
  report_year: string | null;
};

/** `contact_messages` document (esgratings-api app/contact/router.py). */
export type ContactMessage = {
  _id: string;
  name: string;
  email: string;
  number: string;
  message: string;
  created_at: string;
  submit_ip?: string;
};
