"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import clsx from "clsx";
import { apiUpload, ApiError } from "@/lib/api";
import PageHeader from "@/components/admin/PageHeader";
import FileDrop from "@/components/admin/FileDrop";
import { CARD } from "@/components/admin/styles";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";

// Port of bfsi-calculator/admin/import.php — help text and sample row verbatim.
const EXPECTED_HEADER =
  "borrower_name,cin_gstin,contact_email,industry,sub_sector,loan_amount,loan_purpose,loan_type,outstanding_loans,overall_score,grade,status";
const SAMPLE_ROW =
  "ACME Pvt Ltd,27AAAAA0000A1Z5,contact@acme.com,it,SaaS,1000000,Working Capital,Working Capital,0,85,B,new";

export default function ImportBfsiPage() {
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  // Bumped after a successful import to clear the file input.
  const [inputKey, setInputKey] = useState(0);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Same messages as import.php (the API re-checks both).
    if (!file) {
      setError("File upload failed or file was not received.");
      return;
    }
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setError("Invalid file type. Please upload a .csv file.");
      return;
    }

    setSubmitting(true);
    const body = new FormData();
    body.append("file", file);
    try {
      const res = await apiUpload<{ message: string }>("/api/admin/bfsi/import", body);
      setSuccess(res.message);
      setFile(null);
      setInputKey((k) => k + 1);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        crumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "BFSI Submissions", href: "/admin/bfsi" },
          { label: "Import" },
        ]}
        title="Import BFSI Data (CSV Only)"
        description="Add many borrower records at once from a CSV file."
        actions={
          <Button variant="adminSecondary" href="/admin/bfsi">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            BFSI Data
          </Button>
        }
      />

      <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <form
          onSubmit={handleSubmit}
          noValidate
          className={clsx(CARD, "flex flex-col gap-5 p-5 sm:p-6")}
        >
          {error ? <Alert variant="error">{error}</Alert> : null}
          {success ? (
            <Alert variant="success">
              <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                {success}
                <Link href="/admin/bfsi" className="font-semibold underline underline-offset-2">
                  Back to BFSI Data
                </Link>
              </span>
            </Alert>
          ) : null}

          <FileDrop
            key={inputKey}
            id="import_file_csv"
            name="import_file_csv"
            label="Choose CSV File:"
            accept=".csv"
            required
            prompt="Drop CSV or browse"
            hint="One borrower per row, with the header shown alongside."
            file={file}
            onFile={(f) => {
              setFile(f);
              setError(null);
            }}
          />

          <div className="flex flex-col-reverse gap-2 border-t border-line pt-4 sm:flex-row sm:justify-end">
            <Button variant="adminSecondary" href="/admin/bfsi">
              Cancel
            </Button>
            <Button type="submit" variant="adminPrimary" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 motion-safe:animate-spin" aria-hidden="true" />
                  Importing…
                </>
              ) : (
                "Import CSV Data"
              )}
            </Button>
          </div>
        </form>

        <aside aria-labelledby="csv-format-title" className={clsx(CARD, "min-w-0 p-5 sm:p-6")}>
          <h2 id="csv-format-title" className="text-[15px] font-semibold text-ink">
            CSV format
          </h2>
          <p className="mt-3 text-[13px] font-semibold text-ink">
            Expected CSV header row (case-sensitive):
          </p>
          <pre className="mt-1.5 overflow-x-auto rounded-lg border border-line bg-slate-50 p-3 font-mono text-[11px] leading-relaxed text-ink">
            {EXPECTED_HEADER}
          </pre>
          <p className="mt-3 text-[13px] font-semibold text-ink">Sample row:</p>
          <pre className="mt-1.5 overflow-x-auto rounded-lg border border-line bg-slate-50 p-3 font-mono text-[11px] leading-relaxed text-ink">
            {SAMPLE_ROW}
          </pre>
          <p className="mt-4 text-[13px] text-muted italic">
            overall_score, grade, and status are optional (leave blank; status defaults to
            &quot;new&quot;). contact_email may be blank. Rows with a blank borrower_name are
            skipped.
          </p>
        </aside>
      </div>
    </div>
  );
}
