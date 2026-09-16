"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import clsx from "clsx";
import Field from "@/components/ui/Field";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import PageHeader from "@/components/admin/PageHeader";
import FileDrop from "@/components/admin/FileDrop";
import NextSteps from "@/components/admin/NextSteps";
import { FormFooter, FormSection } from "@/components/admin/FormSection";
import { CARD } from "@/components/admin/styles";
import { apiUpload, ApiError } from "@/lib/api";

// Same fields/validation as the public ESG form (components/calc/EsgCalculatorForm.tsx),
// ported from esg-report.php's client validation (esg.md §B4).
const EMAIL_RE = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
// Any country: optional +, then 7-15 digits (E.164 maximum); separators ignored.
const MOBILE_RE = /^\+?\d{7,15}$/;
const PHONE_SEPARATORS_RE = /[\s\-().]/g;

const MAX_FILE_MB = 20;
const ACCEPT = ".pdf,.doc,.docx";

type FormState = {
  name: string;
  email: string;
  designation: string;
  company_name: string;
  mobile_number: string;
  report_year: string;
};

const INITIAL_FORM: FormState = {
  name: "",
  email: "",
  designation: "",
  company_name: "",
  mobile_number: "",
  report_year: "",
};

type Status = "idle" | "submitting" | "error";

function validate(form: FormState, file: File | null): string | null {
  if (!form.name.trim()) return "Please enter the name.";
  if (!EMAIL_RE.test(form.email.trim())) return "Please enter a valid email";
  if (!form.designation.trim()) return "Please enter the designation.";
  if (!form.company_name.trim()) return "Please enter the company name.";
  if (!MOBILE_RE.test(form.mobile_number.trim().replace(PHONE_SEPARATORS_RE, "")))
    return "Please enter a valid phone number";
  if (!form.report_year.trim()) return "Please enter the report financial year.";

  if (!file) return "Please upload a BRSR / Sustainability / Integrated Report.";
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext !== "pdf" && ext !== "doc" && ext !== "docx") return "Only PDF, DOC or DOCX accepted.";
  if (file.size > MAX_FILE_MB * 1024 * 1024) return `Report must be under ${MAX_FILE_MB} MB.`;

  return null;
}

/** "New ESG Assessment" — posts the same fields as the public calculator to
 * the admin-only `POST /api/admin/esg/submissions`, which also kicks off the
 * background analysis job, then hands off to the detail page's
 * `AnalyzePanel`. */
export default function NewEsgAssessmentPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  function update(field: keyof FormState) {
    return (e: ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const validationError = validate(form, file);
    if (validationError) {
      setStatus("error");
      setError(validationError);
      return;
    }

    setStatus("submitting");
    setError(null);

    const body = new FormData();
    body.append("name", form.name.trim());
    body.append("email", form.email.trim());
    body.append("designation", form.designation.trim());
    body.append("company_name", form.company_name.trim());
    body.append("mobile_number", form.mobile_number.trim());
    body.append("report_year", form.report_year.trim());
    body.append("file", file as File);

    try {
      const res = await apiUpload<{ id: string }>("/api/admin/esg/submissions", body);
      router.push(`/admin/esg/${res.id}`);
    } catch (err) {
      setStatus("error");
      setError(err instanceof ApiError ? err.message : "Something went wrong.");
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        crumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "ESG Submissions", href: "/admin/esg" },
          { label: "New assessment" },
        ]}
        title="New ESG Assessment"
        description="Upload a company's report on its behalf and rate it with the ESG model."
        actions={
          <Button variant="adminSecondary" href="/admin/esg">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            ESG Submissions
          </Button>
        }
      />

      <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <form onSubmit={handleSubmit} className={clsx(CARD, "min-w-0")} noValidate>
          <FormSection
            id="esg-contact"
            title="Contact person"
            description="Who the finished report is addressed and emailed to."
          >
            <Field
              label="Name"
              name="name"
              placeholder="Enter the name"
              required
              value={form.name}
              onChange={update("name")}
            />
            <Field
              label="Email"
              name="email"
              type="email"
              placeholder="Enter the email"
              required
              value={form.email}
              onChange={update("email")}
            />
            <Field
              label="Designation"
              name="designation"
              placeholder="Enter the designation"
              required
              value={form.designation}
              onChange={update("designation")}
            />
            <Field
              label="Mobile Number"
              name="mobile_number"
              type="tel"
              placeholder="Enter the mobile number"
              required
              value={form.mobile_number}
              onChange={update("mobile_number")}
            />
          </FormSection>

          <FormSection
            id="esg-company"
            title="Company and report"
            description="The disclosure the rating is built from."
          >
            <Field
              label="Company Name"
              name="company_name"
              placeholder="Enter the company name"
              required
              value={form.company_name}
              onChange={update("company_name")}
            />
            <Field
              label="Report Financial Year"
              name="report_year"
              placeholder="2024-2025"
              required
              value={form.report_year}
              onChange={update("report_year")}
            />
            <div className="col-span-full">
              <FileDrop
                id="field-report-file"
                name="report-file"
                label="Upload BRSR/Sustainability/Integrated Report"
                accept={ACCEPT}
                required
                prompt="Drop PDF/DOCX or browse"
                hint={`PDF, DOC or DOCX, max ${MAX_FILE_MB} MB.`}
                file={file}
                onFile={setFile}
              />
            </div>
          </FormSection>

          {status === "error" && error ? (
            <div className="px-5 pb-5 sm:px-6">
              <Alert variant="error">{error}</Alert>
            </div>
          ) : null}

          <FormFooter>
            <Button variant="adminSecondary" href="/admin/esg">
              Cancel
            </Button>
            <Button type="submit" variant="adminPrimary" disabled={status === "submitting"}>
              {status === "submitting" ? (
                <>
                  <Loader2 className="h-4 w-4 motion-safe:animate-spin" aria-hidden="true" />
                  Creating…
                </>
              ) : (
                "Create assessment"
              )}
            </Button>
          </FormFooter>
        </form>

        <NextSteps
          steps={[
            "The report is saved to ESG Submissions.",
            "AI analysis starts straight away and takes about 4 minutes.",
            "You land on the submission, where the report appears when it's ready.",
          ]}
        />
      </div>
    </div>
  );
}
