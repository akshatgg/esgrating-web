"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import type { EsgListItem, RatingRow } from "@/lib/types";
import { apiFetch, ApiError } from "@/lib/api";
import { GRADE_LABELS } from "@/lib/grades";
import Modal from "@/components/ui/Modal";
import Field from "@/components/ui/Field";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";

// The ESG Rating List's "Add New Entry" / "Edit Entry" modal
// (esgratings/site/dashboard/index.php:845-878 and its openModal() at 975-1010):
// same titles, labels, input types, step and required fields, and the same
// submit captions ("Add Entry" / "Save Changes"). Grade is a select of A+..D
// per web-task-W8-brief.md (the PHP took free text); Category suggests the
// grade labels but stays free text. Posts to POST/PUT /api/admin/ratings.

const GRADES = Object.keys(GRADE_LABELS);
const CATEGORY_SUGGESTIONS = Object.values(GRADE_LABELS);

type RatingForm = {
  company_name: string;
  sector: string;
  esg_rating: string;
  date_of_rating: string;
  grade: string;
  category: string;
};

function initialForm(row: RatingRow | null): RatingForm {
  return {
    company_name: row?.company_name ?? "",
    sector: row?.sector ?? "",
    esg_rating: row?.esg_rating === null || row?.esg_rating === undefined ? "" : String(row.esg_rating),
    date_of_rating: row?.date_of_rating ?? "",
    grade: row?.grade ?? "",
    category: row?.category ?? "",
  };
}

/** A merged-list / `GET /api/admin/ratings/{s_no}` item as the modal's row. */
export function ratingRowFromItem(item: EsgListItem): RatingRow {
  return {
    s_no: Number(item.id),
    company_name: item.company ?? "",
    sector: item.sector ?? "",
    esg_rating: item.rating ?? 0,
    date_of_rating: item.date,
    grade: item.grade ?? "",
    category: item.category ?? "",
  };
}

type RatingModalProps = {
  /** The row being edited, or null to add a new one. Mount a fresh modal per
   * open so a cancelled edit never leaks into the next one. */
  row: RatingRow | null;
  onClose: () => void;
  onSaved: () => void;
};

export default function RatingModal({ row, onClose, onSaved }: RatingModalProps) {
  const [form, setForm] = useState<RatingForm>(() => initialForm(row));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const gradeOptions =
    form.grade && !GRADES.includes(form.grade) ? [...GRADES, form.grade] : GRADES;

  function update(field: keyof RatingForm) {
    return (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  function close() {
    if (!submitting) onClose();
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const payload = {
      company_name: form.company_name,
      sector: form.sector,
      esg_rating: Number(form.esg_rating),
      date_of_rating: form.date_of_rating,
      grade: form.grade,
      category: form.category,
    };

    try {
      await apiFetch(row ? `/api/admin/ratings/${row.s_no}` : "/api/admin/ratings", {
        method: row ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open onClose={close} title={row ? "Edit Entry" : "Add New Entry"} className="max-w-2xl">
      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Field
            label="Company Name:"
            name="company_name"
            required
            autoComplete="off"
            value={form.company_name}
            onChange={update("company_name")}
          />
        </div>
        <Field
          label="Sector:"
          name="sector"
          required
          autoComplete="off"
          value={form.sector}
          onChange={update("sector")}
        />
        <Field
          label="ESG Rating (Score):"
          name="esg_score"
          type="number"
          step={0.1}
          inputMode="decimal"
          required
          value={form.esg_rating}
          onChange={update("esg_rating")}
        />
        <Field
          label="Date Of Rating:"
          name="date_of_rating"
          type="date"
          required
          value={form.date_of_rating}
          onChange={update("date_of_rating")}
        />
        <Field
          as="select"
          label="Grade (Letter):"
          name="grade"
          required
          value={form.grade}
          onChange={update("grade")}
        >
          <option value="">-- Select Grade --</option>
          {gradeOptions.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </Field>
        <div className="sm:col-span-2">
          <Field
            label="Category:"
            name="category"
            required
            autoComplete="off"
            list="rating-category-options"
            value={form.category}
            onChange={update("category")}
          />
          <datalist id="rating-category-options">
            {CATEGORY_SUGGESTIONS.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>

        {error ? (
          <div className="sm:col-span-2">
            <Alert variant="error">{error}</Alert>
          </div>
        ) : null}

        <div className="flex flex-col-reverse gap-2 border-t border-line pt-4 sm:col-span-2 sm:flex-row sm:justify-end">
          <Button variant="adminSecondary" onClick={close} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" variant="adminPrimary" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 motion-safe:animate-spin" aria-hidden="true" />
                Saving…
              </>
            ) : row ? (
              "Save Changes"
            ) : (
              "Add Entry"
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
