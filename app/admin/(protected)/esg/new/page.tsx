"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import Card from "@/components/ui/Card";
import Field from "@/components/ui/Field";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import { apiUpload, ApiError } from "@/lib/api";

// Same fields/validation as the public ESG form (components/calc/EsgCalculatorForm.tsx),
// ported from esg-report.php's client validation (esg.md §B4).
const EMAIL_RE = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const MOBILE_RE = /^(\+91[\-\s]?)?[0]?(91)?[789]\d{9}$/;

const MAX_FILE_MB = 5;
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
  if (!MOBILE_RE.test(form.mobile_number.trim())) return "Please enter a valid phone number";
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
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold text-ink">New ESG Assessment</h1>

      <Card className="max-w-3xl">
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 gap-x-[22px] gap-y-[18px] min-[701px]:grid-cols-2"
          noValidate
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
            label="Company Name"
            name="company_name"
            placeholder="Enter the company name"
            required
            value={form.company_name}
            onChange={update("company_name")}
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
              onChange={(e: ChangeEvent<HTMLInputElement>) => setFile(e.target.files?.[0] ?? null)}
            />
          </div>

          {status === "error" && error ? (
            <div className="col-span-full">
              <Alert variant="error">{error}</Alert>
            </div>
          ) : null}

          <div className="col-span-full">
            <Button type="submit" variant="calcBlue" disabled={status === "submitting"}>
              {status === "submitting" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Creating…
                </>
              ) : (
                "Create assessment"
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
