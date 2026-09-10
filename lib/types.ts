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
  file_path: string;
  file_sha256: string;
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
  status: "new" | "report_generated" | "sent";
  e_score?: number;
  s_score?: number;
  g_score?: number;
  overall_score?: number;
  grade?: Grade;
  ai_analysis?: BfsiAi;
  text_sha256?: string;
  text_source?: "text" | "ocr";
  text_truncated?: boolean;
  imported?: boolean;
};

/** `ai_analysis` — the return of `bfsi_analyze()` (bfsi.md §4c). */
export type BfsiAi = {
  e_score: number;
  s_score: number;
  g_score: number;
  keywords: { E: string[]; S: string[]; G: string[] };
  negative_keywords: { E: string[]; S: string[]; G: string[] };
  reasons: {
    E: Array<{ page: number; score: number | null; reason: string }>;
    S: Array<{ page: number; score: number | null; reason: string }>;
    G: Array<{ page: number; score: number | null; reason: string }>;
  };
  detected_sector: string;
  detected_industry: string;
  top_risks: string[];
  top_improvements: string[];
  climate_risk: string;
  governance_summary: string;
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
