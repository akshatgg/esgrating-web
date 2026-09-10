"use client";

import { useState } from "react";
import { apiFetch, ApiError } from "@/lib/api";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";

/** The ESG Rating List's delete confirm (formerly on /admin/ratings), shared by
 * the merged ESG list and the rated-company page. Copy is verbatim. */
export default function RatingDeleteModal({
  target,
  onClose,
  onDeleted,
}: {
  /** The rated company to delete, or null when closed. */
  target: { sNo: string | number; company: string | null } | null;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function close() {
    if (deleting) return;
    setError(null);
    onClose();
  }

  async function confirmDelete() {
    if (!target) return;
    setDeleting(true);
    setError(null);
    try {
      await apiFetch(`/api/admin/ratings/${target.sNo}`, { method: "DELETE" });
      onDeleted();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Modal open={target !== null} onClose={close} title="Delete entry">
      <div className="flex flex-col gap-4">
        {error ? <Alert variant="error">{error}</Alert> : null}
        {/* Verbatim confirm() text from dashboard/index.php:757. */}
        <p className="text-sm font-medium text-ink">Are you sure you want to delete?</p>
        {target ? (
          <p className="text-sm text-muted">
            {target.company} will be removed from the ESG Rating List and the public ESG Rating
            page.
          </p>
        ) : null}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="adminSecondary" onClick={close} disabled={deleting}>
            Cancel
          </Button>
          <Button variant="adminDanger" onClick={confirmDelete} disabled={deleting}>
            {deleting ? "Deleting…" : "Delete"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
