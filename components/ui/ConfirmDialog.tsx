"use client";

import { useState, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import { ApiError } from "@/lib/api";

type ConfirmDialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  confirmLabel: string;
  /** Red confirm button for destructive actions. */
  danger?: boolean;
  /** May throw; the error shows in the dialog and it stays open. */
  onConfirm: () => Promise<void> | void;
};

/** A yes/no confirmation on top of Modal (focus trap, Escape, focus return). */
export default function ConfirmDialog({
  open,
  onClose,
  title,
  children,
  confirmLabel,
  danger,
  onConfirm,
}: ConfirmDialogProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function close() {
    if (busy) return;
    setError(null);
    onClose();
  }

  async function confirm() {
    setBusy(true);
    setError(null);
    try {
      await onConfirm();
      setBusy(false);
      onClose();
    } catch (err) {
      setBusy(false);
      setError(err instanceof ApiError ? err.message : "Something went wrong.");
    }
  }

  return (
    <Modal open={open} onClose={close} title={title}>
      <div className="flex flex-col gap-4">
        <div className="text-sm text-ink">{children}</div>
        {error ? <Alert variant="error">{error}</Alert> : null}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="adminSecondary" onClick={close} disabled={busy}>
            Cancel
          </Button>
          <Button variant={danger ? "adminDanger" : "adminPrimary"} onClick={confirm} disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 motion-safe:animate-spin" aria-hidden="true" /> : null}
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
