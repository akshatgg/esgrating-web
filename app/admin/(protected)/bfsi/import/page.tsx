"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { apiUpload, ApiError } from "@/lib/api";
import Card from "@/components/ui/Card";
import Field from "@/components/ui/Field";
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
    <div className="mx-auto flex w-full max-w-[700px] flex-col gap-4">
      <h1 className="text-xl font-semibold text-ink">Import BFSI Data (CSV Only)</h1>
      <Link href="/admin/bfsi" className="text-sm font-medium text-calc-blue hover:underline">
        ← BFSI Data
      </Link>

      {error ? <Alert variant="error">{error}</Alert> : null}

      {success ? (
        <>
          <Alert variant="success">{success}</Alert>
          <Link href="/admin/bfsi" className="text-sm font-medium text-calc-blue hover:underline">
            ← Back to BFSI Data
          </Link>
        </>
      ) : null}

      <Card lift={false}>
        <div className="mb-5 break-all rounded-md border border-[#cdd6e4] bg-bg-soft p-3 text-[13px] text-[#333]">
          <strong>Expected CSV header row (case-sensitive):</strong>
          <br />
          {EXPECTED_HEADER}
          <br />
          <br />
          <strong>Sample row:</strong>
          <br />
          {SAMPLE_ROW}
          <br />
          <br />
          <em>
            overall_score, grade, and status are optional (leave blank; status defaults to
            &quot;new&quot;). contact_email may be blank. Rows with a blank borrower_name are
            skipped.
          </em>
        </div>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
          <Field
            key={inputKey}
            label="Choose CSV File:"
            name="import_file_csv"
            type="file"
            accept=".csv"
            required
            onChange={(e: ChangeEvent<HTMLInputElement>) => setFile(e.target.files?.[0] ?? null)}
          />
          <Button type="submit" variant="calcBlue" disabled={submitting} className="w-full">
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Importing…
              </>
            ) : (
              "Import CSV Data"
            )}
          </Button>
        </form>
      </Card>
    </div>
  );
}
