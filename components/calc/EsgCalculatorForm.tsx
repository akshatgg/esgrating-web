"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import CalculatorCard, { CALC_GRID_CLASSES } from "@/components/calc/CalculatorCard";
import Field from "@/components/ui/Field";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import { apiUpload, ApiError } from "@/lib/api";

// Regexes ported verbatim from the admin ESG form's client validation
// (esg.md §B4 — `site/dashboard/esg-report.php`), reused here since the
// public CF7 form otherwise relies only on native `type=` validation.
const EMAIL_RE = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
// Any country: optional +, then 7-15 digits (E.164 maximum); separators ignored.
const MOBILE_RE = /^\+?\d{7,15}$/;
const PHONE_SEPARATORS_RE = /[\s\-().]/g;

const MAX_FILE_MB = 20;
const ACCEPT = ".pdf,.doc,.docx";

const SUCCESS_MESSAGE = "Your ESG Rating will be sent to your registered email. Thank you!";

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

type Status = "idle" | "submitting" | "success" | "error";

// Required-field messages below are inferred — no verbatim source in esg.md
// §B1 (CF7's field config documents labels/placeholders, not JS error copy).
function validate(form: FormState, file: File | null): string | null {
  if (!form.name.trim()) return "Please enter your name.";
  if (!EMAIL_RE.test(form.email.trim())) return "Please enter a valid email";
  if (!form.designation.trim()) return "Please enter your designation.";
  if (!form.company_name.trim()) return "Please enter your company name.";
  if (!MOBILE_RE.test(form.mobile_number.trim().replace(PHONE_SEPARATORS_RE, "")))
    return "Please enter a valid phone number";
  if (!form.report_year.trim()) return "Please enter the report financial year.";

  if (!file) return "Please upload your BRSR / Sustainability / Integrated Report.";
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext !== "pdf" && ext !== "doc" && ext !== "docx") return "Only PDF, DOC or DOCX accepted.";
  if (file.size > MAX_FILE_MB * 1024 * 1024) return `Report must be under ${MAX_FILE_MB} MB.`;

  return null;
}

export default function EsgCalculatorForm() {
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function update(field: keyof FormState) {
    return (e: ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    setFile(e.target.files?.[0] ?? null);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const validationError = validate(form, file);
    if (validationError) {
      setStatus("error");
      setErrorMessage(validationError);
      return;
    }

    setStatus("submitting");
    setErrorMessage(null);

    const body = new FormData();
    body.append("name", form.name.trim());
    body.append("email", form.email.trim());
    body.append("designation", form.designation.trim());
    body.append("company_name", form.company_name.trim());
    body.append("mobile_number", form.mobile_number.trim());
    body.append("report_year", form.report_year.trim());
    body.append("file", file as File);

    try {
      await apiUpload("/api/esg/submissions", body);
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof ApiError ? err.message : "Something went wrong.");
    }
  }

  if (status === "success") {
    return (
      <CalculatorCard className="flex flex-col items-center gap-3 py-12 text-center">
        <CheckCircle2 className="h-10 w-10 text-grade-a" aria-hidden="true" />
        <p className="text-base text-ink">{SUCCESS_MESSAGE}</p>
      </CalculatorCard>
    );
  }

  return (
    <CalculatorCard>
      <form onSubmit={handleSubmit} className={CALC_GRID_CLASSES} noValidate>
        <Field
          label="Name"
          name="name"
          placeholder="Enter your name"
          required
          value={form.name}
          onChange={update("name")}
        />
        <Field
          label="Email"
          name="email"
          type="email"
          placeholder="Enter your email"
          required
          value={form.email}
          onChange={update("email")}
        />
        <Field
          label="Designation"
          name="designation"
          placeholder="Enter your designation"
          required
          value={form.designation}
          onChange={update("designation")}
        />
        <Field
          label="Company Name"
          name="company_name"
          placeholder="Enter your company name"
          required
          value={form.company_name}
          onChange={update("company_name")}
        />
        <Field
          label="Mobile Number"
          name="mobile_number"
          type="tel"
          placeholder="Enter your mobile number"
          required
          value={form.mobile_number}
          onChange={update("mobile_number")}
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
          <Field
            label="Upload BRSR/Sustainability/Integrated Report"
            name="report-file"
            type="file"
            accept={ACCEPT}
            required
            hint={`PDF, DOC or DOCX, max ${MAX_FILE_MB} MB.`}
            onChange={handleFileChange}
          />
        </div>

        {status === "error" && errorMessage ? (
          <div className="col-span-full">
            <Alert variant="error">{errorMessage}</Alert>
          </div>
        ) : null}

        <div className="col-span-full">
          <Button type="submit" variant="calcBlue" disabled={status === "submitting"}>
            {status === "submitting" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Submitting…
              </>
            ) : (
              "Submit"
            )}
          </Button>
        </div>
      </form>
    </CalculatorCard>
  );
}
