"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import type { BfsiOptions } from "@/lib/types";
import { apiFetch, ApiError } from "@/lib/api";
import Modal from "@/components/ui/Modal";
import Field from "@/components/ui/Field";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";

// The dashboard's "Add New BFSI Record" modal (dashboard/index.php:883-965):
// same fields, labels, options and defaults; posts `POST /api/admin/bfsi/records`.

type RecordForm = {
  borrower_name: string;
  cin_gstin: string;
  contact_email: string;
  industry: string;
  sub_sector: string;
  loan_amount: string;
  outstanding_loans: string;
  loan_purpose: string;
  loan_type: string;
  overall_score: string;
  grade: string;
  status: string;
};

const INITIAL: RecordForm = {
  borrower_name: "",
  cin_gstin: "",
  contact_email: "",
  industry: "",
  sub_sector: "",
  loan_amount: "",
  outstanding_loans: "0",
  loan_purpose: "",
  loan_type: "",
  overall_score: "",
  grade: "",
  status: "new",
};

const GRADES = ["A+", "A", "B+", "B", "C", "D"];
const STATUSES = ["new", "report_generated", "sent"];

/** PHP `(float)` of a posted value — blank / non-numeric → 0. */
function phpFloatCast(value: string): number {
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

type AddRecordModalProps = {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  options: BfsiOptions | null;
};

export default function AddRecordModal({ open, onClose, onCreated, options }: AddRecordModalProps) {
  const [form, setForm] = useState<RecordForm>(INITIAL);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update(field: keyof RecordForm) {
    return (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  function close() {
    if (submitting) return;
    setError(null);
    onClose();
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    // create_bfsi (dashboard/index.php:154-188): blank score/grade → null,
    // amounts cast like PHP `(float)`; trimming/uppercasing happens server-side.
    const payload = {
      borrower_name: form.borrower_name,
      cin_gstin: form.cin_gstin,
      contact_email: form.contact_email,
      industry: form.industry,
      sub_sector: form.sub_sector,
      loan_amount: phpFloatCast(form.loan_amount),
      outstanding_loans: phpFloatCast(form.outstanding_loans),
      loan_purpose: form.loan_purpose,
      loan_type: form.loan_type,
      overall_score: form.overall_score === "" ? null : phpFloatCast(form.overall_score),
      grade: form.grade === "" ? null : form.grade,
      status: form.status,
    };

    try {
      const res = await apiFetch<{ inserted: boolean; id?: string }>("/api/admin/bfsi/records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res?.inserted) {
        // The PHP silently skipped an invalid record; surface it instead.
        setError("The record was not saved. Check the industry, loan purpose and loan type.");
        return;
      }
      setForm(INITIAL);
      onCreated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={close} title="Add New BFSI Record" className="max-w-2xl">
      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {!options ? (
          <div className="col-span-full">
            <Alert variant="info">Loading form options…</Alert>
          </div>
        ) : null}
        <Field
          label="Borrower Name:"
          name="b_borrower_name"
          required
          value={form.borrower_name}
          onChange={update("borrower_name")}
        />
        <Field
          label="CIN/GSTIN:"
          name="b_cin_gstin"
          required
          value={form.cin_gstin}
          onChange={update("cin_gstin")}
        />
        <Field
          label="Contact Email:"
          name="b_contact_email"
          type="email"
          value={form.contact_email}
          onChange={update("contact_email")}
        />
        <Field
          as="select"
          label="Industry:"
          name="b_industry"
          required
          value={form.industry}
          onChange={update("industry")}
        >
          <option value="">-- Select Industry --</option>
          {Object.entries(options?.industries ?? {}).map(([key, ind]) => (
            <option key={key} value={key}>
              {ind.label}
            </option>
          ))}
        </Field>
        <Field
          label="Sub-Sector:"
          name="b_sub_sector"
          required
          value={form.sub_sector}
          onChange={update("sub_sector")}
        />
        <Field
          label="Loan Amount:"
          name="b_loan_amount"
          type="number"
          step={0.01}
          required
          value={form.loan_amount}
          onChange={update("loan_amount")}
        />
        <Field
          label="Outstanding Loans:"
          name="b_outstanding_loans"
          type="number"
          step={0.01}
          value={form.outstanding_loans}
          onChange={update("outstanding_loans")}
        />
        <Field
          as="select"
          label="Loan Purpose:"
          name="b_loan_purpose"
          required
          value={form.loan_purpose}
          onChange={update("loan_purpose")}
        >
          <option value="">-- Select Loan Purpose --</option>
          {(options?.loan_purposes ?? []).map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </Field>
        <Field
          as="select"
          label="Loan Type:"
          name="b_loan_type"
          required
          value={form.loan_type}
          onChange={update("loan_type")}
        >
          <option value="">-- Select Loan Type --</option>
          {(options?.loan_types ?? []).map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </Field>
        <Field
          label="Overall Score:"
          name="b_overall_score"
          type="number"
          step={0.01}
          value={form.overall_score}
          onChange={update("overall_score")}
        />
        <Field
          as="select"
          label="Grade:"
          name="b_grade"
          value={form.grade}
          onChange={update("grade")}
        >
          <option value="">-- None --</option>
          {GRADES.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </Field>
        <Field
          as="select"
          label="Status:"
          name="b_status"
          value={form.status}
          onChange={update("status")}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Field>

        {error ? (
          <div className="col-span-full">
            <Alert variant="error">{error}</Alert>
          </div>
        ) : null}

        <div className="col-span-full flex justify-end gap-3">
          <Button variant="outline" onClick={close} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" variant="calcBlue" disabled={submitting || !options}>
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Saving…
              </>
            ) : (
              "Submit"
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
