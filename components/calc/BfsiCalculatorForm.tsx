"use client";

import { useEffect, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import clsx from "clsx";
import CalculatorCard, { CALC_GRID_CLASSES } from "@/components/calc/CalculatorCard";
import Field from "@/components/ui/Field";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import FileDrop from "@/components/admin/FileDrop";
import { FormFooter, FormSection } from "@/components/admin/FormSection";
import { CARD } from "@/components/admin/styles";
import { apiFetch, apiUpload, ApiError } from "@/lib/api";
import type { BfsiOptions } from "@/lib/types";

// Loose email check mirroring PHP's FILTER_VALIDATE_EMAIL closely enough for
// client-side UX; the server has the last word either way.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CIN_GSTIN_RE = /^([A-Z0-9]{21}|[0-9A-Z]{15})$/;

const DEFAULT_MAX_FILE_MB = 20;
const ACCEPT = ".pdf,.docx";

type FormState = {
  borrower_name: string;
  cin_gstin: string;
  contact_email: string;
  industry: string;
  sub_sector: string;
  loan_amount: string;
  loan_purpose: string;
  loan_type: string;
  outstanding_loans: string;
};

const INITIAL_FORM: FormState = {
  borrower_name: "",
  cin_gstin: "",
  contact_email: "",
  industry: "",
  sub_sector: "",
  loan_amount: "",
  loan_purpose: "",
  loan_type: "",
  outstanding_loans: "",
};

// "error" is reserved for genuine API/server failures (a `detail` from a
// failed fetch) and triggers the full-page "Go back" replacement that wipes
// the form. Client-side pre-submit validation errors use "validation-error"
// instead, which shows an inline Alert without touching `form`/`file` state
// — mirroring EsgCalculatorForm's inline-error pattern — so a typo doesn't
// cost the user their attached file.
type Status = "idle" | "submitting" | "success" | "error" | "validation-error";

// Validation order + messages ported verbatim from `bfsi_store_submission`
// (bfsi.md §1c).
function validate(form: FormState, file: File | null, options: BfsiOptions | null): string | null {
  const borrower = form.borrower_name.trim();
  if (!borrower || borrower.length > 255) return "Borrower name is required.";

  const cin = form.cin_gstin.trim().toUpperCase();
  if (!CIN_GSTIN_RE.test(cin)) return "CIN must be 21 characters or GSTIN 15 characters.";

  const email = form.contact_email.trim();
  if (!EMAIL_RE.test(email)) return "A valid contact email is required.";
  if (email.length > 255) return "Contact email is too long.";

  if (!options) return "Options are still loading — please wait and try again.";
  if (!(form.industry in options.industries)) return "Invalid industry.";

  const sub = form.sub_sector.trim();
  if (!sub || !options.industries[form.industry].sub_sectors.includes(sub)) {
    return "Invalid sub-sector.";
  }

  const amount = Number.parseFloat(form.loan_amount);
  if (!Number.isFinite(amount) || amount <= 0) return "Loan amount must be positive.";

  if (!options.loan_purposes.includes(form.loan_purpose)) return "Invalid loan purpose.";
  if (!options.loan_types.includes(form.loan_type)) return "Invalid loan type.";

  const outstanding = Number.parseFloat(form.outstanding_loans);
  if (!Number.isFinite(outstanding) || outstanding < 0) return "Outstanding loans must be 0 or more.";

  if (!file) return "Report upload failed.";
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext !== "pdf" && ext !== "docx") return "Only PDF or DOCX accepted.";
  const maxMb = options.max_upload_mb || DEFAULT_MAX_FILE_MB;
  if (file.size > maxMb * 1024 * 1024) return `Report must be under ${maxMb} MB.`;

  return null;
}

type BfsiCalculatorFormProps = {
  /** Defaults to the public `POST /api/bfsi/submissions`. The admin "New BFSI
   * Assessment" page passes `/api/admin/bfsi/submissions`. */
  endpoint?: string;
  /** Admin mode (admin/calculator.php): called with the new submission id
   * instead of showing the public thank-you card, and API errors stay inline
   * with the form values kept ("re-fills values on error", bfsi.md §3). */
  onCreated?: (id: string) => void;
  /** "public" (default) is the calculator card on the website. "admin" lays
   * the same fields out in the superadmin console's form style: section
   * headings, a dropzone and a sticky Cancel / Submit footer. */
  appearance?: "public" | "admin";
  /** Admin appearance: where the footer's Cancel goes. */
  cancelHref?: string;
};

/** The card around the loading / options-error states: the website's
 * calculator card, or a console card in admin appearance. */
function FormShell({
  admin,
  className,
  children,
}: {
  admin: boolean;
  className?: string;
  children: ReactNode;
}) {
  return admin ? (
    <div className={clsx(CARD, "p-6", className)}>{children}</div>
  ) : (
    <CalculatorCard className={className}>{children}</CalculatorCard>
  );
}

export default function BfsiCalculatorForm({
  endpoint = "/api/bfsi/submissions",
  onCreated,
  appearance = "public",
  cancelHref,
}: BfsiCalculatorFormProps = {}) {
  const admin = appearance === "admin";
  const [options, setOptions] = useState<BfsiOptions | null>(null);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [optionsError, setOptionsError] = useState<string | null>(null);
  const [optionsReloadKey, setOptionsReloadKey] = useState(0);

  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    apiFetch<BfsiOptions>("/api/bfsi/options")
      .then((data) => {
        if (!cancelled) setOptions(data);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setOptionsError(
          err instanceof ApiError ? err.message : "Couldn't load the form options.",
        );
      })
      .finally(() => {
        if (!cancelled) setOptionsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [optionsReloadKey]);

  function update(field: keyof FormState) {
    return (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  function handleIndustryChange(e: ChangeEvent<HTMLSelectElement>) {
    const industry = e.target.value;
    setForm((f) => ({ ...f, industry, sub_sector: "" }));
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    setFile(e.target.files?.[0] ?? null);
  }

  function resetForm() {
    setForm(INITIAL_FORM);
    setFile(null);
    setStatus("idle");
    setErrorMessage(null);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const validationError = validate(form, file, options);
    if (validationError) {
      setStatus("validation-error");
      setErrorMessage(validationError);
      return;
    }

    setStatus("submitting");
    setErrorMessage(null);

    const body = new FormData();
    body.append("borrower_name", form.borrower_name.trim());
    body.append("cin_gstin", form.cin_gstin.trim().toUpperCase());
    body.append("contact_email", form.contact_email.trim());
    body.append("industry", form.industry);
    body.append("sub_sector", form.sub_sector.trim());
    body.append("loan_amount", form.loan_amount);
    body.append("loan_purpose", form.loan_purpose);
    body.append("loan_type", form.loan_type);
    body.append("outstanding_loans", form.outstanding_loans);
    body.append("report_file", file as File);

    try {
      const res = await apiUpload<{ id?: string } | undefined>(endpoint, body);
      if (onCreated) {
        // Without an id there is no detail page to go to — say so rather than
        // navigating to a broken `/admin/bfsi/` URL.
        if (!res?.id) {
          setStatus("validation-error");
          setErrorMessage(
            "The assessment was saved, but the server didn't return its id. Open it from BFSI Submissions.",
          );
          return;
        }
        // Stay in "submitting" (button disabled) while the caller navigates away.
        onCreated(res.id);
        return;
      }
      setStatus("success");
    } catch (err) {
      setStatus(onCreated ? "validation-error" : "error");
      setErrorMessage(err instanceof ApiError ? err.message : "Something went wrong.");
    }
  }

  if (status === "success") {
    return (
      <CalculatorCard className="border-t-4 border-t-grade-a py-10 text-center">
        <h2 className="font-display text-2xl font-semibold text-navy">Thank you!</h2>
        <p className="mx-auto mt-3 max-w-md text-body">
          Your details and report were submitted successfully. Our team will analyse them and
          send your ESG Credit Risk Report to your email.
        </p>
      </CalculatorCard>
    );
  }

  if (optionsLoading) {
    return (
      <FormShell admin={admin} className="flex flex-col items-center gap-3 py-16 text-center text-muted">
        <Loader2 className="h-6 w-6 motion-safe:animate-spin" aria-hidden="true" />
        <p>Loading form options…</p>
      </FormShell>
    );
  }

  if (optionsError || !options) {
    return (
      <FormShell admin={admin} className="flex flex-col items-center gap-4 py-16 text-center">
        <Alert variant="error">{optionsError ?? "Couldn't load the form options."}</Alert>
        <Button
          variant={admin ? "adminPrimary" : "calcNavy"}
          onClick={() => {
            setOptionsLoading(true);
            setOptionsError(null);
            setOptionsReloadKey((k) => k + 1);
          }}
        >
          Retry
        </Button>
      </FormShell>
    );
  }

  const maxFileMb = options.max_upload_mb || DEFAULT_MAX_FILE_MB;
  const subSectors = form.industry ? options.industries[form.industry]?.sub_sectors ?? [] : [];

  if (status === "error" && errorMessage) {
    return (
      <CalculatorCard className="flex flex-col items-center gap-4 py-16 text-center">
        <Alert variant="error">{errorMessage}</Alert>
        <button
          type="button"
          onClick={resetForm}
          className="text-sm font-medium text-calc-blue hover:underline"
        >
          ← Go back
        </button>
      </CalculatorCard>
    );
  }

  const fileLabel = `Upload BRSR / Sustainability / Integrated Report (PDF/DOCX, max ${maxFileMb} MB)`;

  const borrowerName = (
    <Field
      label="Borrower Name"
      name="borrower_name"
      required
      maxLength={255}
      value={form.borrower_name}
      onChange={update("borrower_name")}
    />
  );
  const cinGstin = (
    <Field
      label="CIN / GSTIN"
      name="cin_gstin"
      placeholder="21-char CIN or 15-char GSTIN"
      required
      maxLength={30}
      value={form.cin_gstin}
      onChange={update("cin_gstin")}
    />
  );
  const contactEmail = (
    <Field
      label="Contact Email"
      name="contact_email"
      type="email"
      required
      maxLength={255}
      value={form.contact_email}
      onChange={update("contact_email")}
    />
  );
  const industry = (
    <Field
      as="select"
      label="Industry"
      name="industry"
      required
      value={form.industry}
      onChange={handleIndustryChange}
    >
      <option value="">Select…</option>
      {Object.entries(options.industries).map(([key, data]) => (
        <option key={key} value={key}>
          {data.label}
        </option>
      ))}
    </Field>
  );
  const subSector = (
    <Field
      as="select"
      label="Sub-sector"
      name="sub_sector"
      required
      disabled={!form.industry}
      value={form.sub_sector}
      onChange={update("sub_sector")}
    >
      <option value="">Select…</option>
      {subSectors.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </Field>
  );
  const loanAmount = (
    <Field
      label="Loan Amount (₹)"
      name="loan_amount"
      type="number"
      min={1}
      step={0.01}
      required
      value={form.loan_amount}
      onChange={update("loan_amount")}
    />
  );
  const loanPurpose = (
    <Field
      as="select"
      label="Loan Purpose"
      name="loan_purpose"
      required
      value={form.loan_purpose}
      onChange={update("loan_purpose")}
    >
      <option value="">Select…</option>
      {options.loan_purposes.map((p) => (
        <option key={p} value={p}>
          {p}
        </option>
      ))}
    </Field>
  );
  const loanType = (
    <Field
      as="select"
      label="Loan Type"
      name="loan_type"
      required
      value={form.loan_type}
      onChange={update("loan_type")}
    >
      <option value="">Select…</option>
      {options.loan_types.map((t) => (
        <option key={t} value={t}>
          {t}
        </option>
      ))}
    </Field>
  );
  const outstandingLoans = (
    <Field
      label="Existing Outstanding Loans (₹)"
      name="outstanding_loans"
      type="number"
      min={0}
      step={0.01}
      required
      value={form.outstanding_loans}
      onChange={update("outstanding_loans")}
    />
  );
  const inlineError =
    status === "validation-error" && errorMessage ? (
      <Alert variant="error">{errorMessage}</Alert>
    ) : null;
  const submitLabel =
    status === "submitting" ? (
      <>
        <Loader2 className="h-4 w-4 motion-safe:animate-spin" aria-hidden="true" />
        Submitting…
      </>
    ) : (
      "Submit"
    );

  if (admin) {
    return (
      <form onSubmit={handleSubmit} className={clsx(CARD, "min-w-0")} noValidate>
        <FormSection
          id="bfsi-borrower"
          title="Borrower"
          description="The company applying for the loan."
        >
          {borrowerName}
          {cinGstin}
          {industry}
          {subSector}
        </FormSection>
        <FormSection id="bfsi-loan" title="Loan" description="What the borrower is asking for.">
          {loanAmount}
          {loanPurpose}
          {loanType}
          {outstandingLoans}
        </FormSection>
        <FormSection
          id="bfsi-report"
          title="Contact and report"
          description="The report is scored; the finished rating goes to this email."
        >
          {contactEmail}
          <div className="col-span-full">
            <FileDrop
              id="field-report_file"
              name="report_file"
              label={fileLabel}
              accept={ACCEPT}
              required
              prompt="Drop PDF/DOCX or browse"
              file={file}
              onFile={setFile}
            />
          </div>
        </FormSection>

        {inlineError ? <div className="px-5 pb-5 sm:px-6">{inlineError}</div> : null}

        <FormFooter>
          {cancelHref ? (
            <Button variant="adminSecondary" href={cancelHref}>
              Cancel
            </Button>
          ) : null}
          <Button type="submit" variant="adminPrimary" disabled={status === "submitting"}>
            {submitLabel}
          </Button>
        </FormFooter>
      </form>
    );
  }

  return (
    <CalculatorCard>
      <form onSubmit={handleSubmit} className={CALC_GRID_CLASSES} noValidate>
        {borrowerName}
        {cinGstin}
        {contactEmail}
        {industry}
        {subSector}
        {loanAmount}
        {loanPurpose}
        {loanType}
        {outstandingLoans}

        <div className="col-span-full">
          <Field
            label={fileLabel}
            name="report_file"
            type="file"
            accept={ACCEPT}
            required
            onChange={handleFileChange}
          />
        </div>

        {inlineError ? <div className="col-span-full">{inlineError}</div> : null}

        <div className="col-span-full">
          <Button type="submit" variant="calcNavy" disabled={status === "submitting"}>
            {submitLabel}
          </Button>
        </div>
      </form>
    </CalculatorCard>
  );
}
