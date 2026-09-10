"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import clsx from "clsx";
import { apiUpload, ApiError } from "@/lib/api";
import { RATED_COMPANIES_HREF } from "@/lib/admin-nav";
import PageHeader from "@/components/admin/PageHeader";
import FileDrop from "@/components/admin/FileDrop";
import { CARD } from "@/components/admin/styles";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";

// Port of esgratings/site/dashboard/import.php (now under ESG Submissions): title, field label, help line
// and button caption verbatim. The API (POST /api/admin/ratings/import)
// checks the exact header and inserts the rows; the PHP then redirected to the
// list, here the result message is shown with a way back.

const EXPECTED_HEADER = "Company_Name, Sector, ESG_Rating, Date_of_Rating, Grade, Category";
const HEADER_ROW = "Company_Name,Sector,ESG_Rating,Date_of_Rating,Grade,Category";
const SAMPLE_ROW =
  "Hexaware Technologies Limited,Computers - Software & Consulting,75,2026-06-10,B+,Very Good";

export default function ImportRatingsPage() {
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  // Bumped after a successful import to reset the file input.
  const [inputKey, setInputKey] = useState(0);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Same client-side messages as the BFSI import (the API re-checks the file).
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
      const res = await apiUpload<{ message: string }>("/api/admin/ratings/import", body);
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
          { label: "ESG Submissions", href: "/admin/esg" },
          { label: "Import" },
        ]}
        title="Import ESG Data (CSV Only)"
        description="Add many companies to the ESG Rating List at once from a CSV file."
        actions={
          <Button variant="adminSecondary" href={RATED_COMPANIES_HREF}>
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Rated companies
          </Button>
        }
      />

      <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <form onSubmit={handleSubmit} noValidate className={clsx(CARD, "flex flex-col gap-5 p-5 sm:p-6")}>
          {error ? <Alert variant="error">{error}</Alert> : null}
          {success ? (
            <Alert variant="success">
              <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                {success}
                <Link
                  href={RATED_COMPANIES_HREF}
                  className="font-semibold underline underline-offset-2"
                >
                  View rated companies
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
            hint={`Expected Header Format: ${EXPECTED_HEADER}`}
            file={file}
            onFile={(f) => {
              setFile(f);
              setError(null);
            }}
          />

          <div className="flex flex-col-reverse gap-2 border-t border-line pt-4 sm:flex-row sm:justify-end">
            <Button variant="adminSecondary" href={RATED_COMPANIES_HREF}>
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
          <p className="mt-1 text-[13px] text-muted">
            The first row must be exactly this header (case-sensitive):
          </p>
          <pre className="mt-3 overflow-x-auto rounded-lg border border-line bg-slate-50 p-3 font-mono text-[11px] leading-relaxed text-ink">
            {HEADER_ROW}
            {"\n"}
            {SAMPLE_ROW}
          </pre>
          <ul className="mt-4 flex list-disc flex-col gap-1.5 pl-4 text-[13px] text-muted">
            <li>Dates can be YYYY-MM-DD, DD-MM-YYYY, DD/MM/YYYY or MM/DD/YYYY.</li>
            <li>Rows with a blank company name, or fewer than six columns, are skipped.</li>
            <li>Imported rows are added to the list; existing rows are not changed.</li>
          </ul>
        </aside>
      </div>
    </div>
  );
}
