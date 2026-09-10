"use client";

import { useState } from "react";
import { Loader2, PencilLine, RotateCcw, Save, X } from "lucide-react";
import clsx from "clsx";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { CARD } from "@/components/admin/styles";

type ReportEditBarProps = {
  dirty: boolean;
  saving: boolean;
  previewing: boolean;
  /** A logo upload/removal is in flight: Save waits for it. */
  logoBusy?: boolean;
  error: string | null;
  /** Whether a saved edit exists to reset. */
  edited: boolean;
  onSave: () => void;
  onCancel: () => void;
  onReset: () => Promise<void>;
};

/** Sticky bar shown while a report is in edit mode: Save, Cancel and
 * "Reset to AI version" (confirmed). Sits just under the console's glass header.
 * The status line is visual only; saved/reset are announced by
 * `ReportEditAnnouncer` and errors by the Alert (role="alert"). */
export default function ReportEditBar({
  dirty,
  saving,
  previewing,
  logoBusy,
  error,
  edited,
  onSave,
  onCancel,
  onReset,
}: ReportEditBarProps) {
  const [confirmReset, setConfirmReset] = useState(false);
  const status = saving
    ? "Saving…"
    : logoBusy
      ? "Updating logo…"
      : previewing
        ? "Recalculating…"
        : dirty
          ? "Unsaved changes"
          : "No changes yet";

  return (
    <div className="sticky top-[84px] z-20 flex flex-col gap-2">
      <div
        role="region"
        aria-label="Report editing"
        className={clsx(
          CARD,
          "flex flex-wrap items-center justify-between gap-2 border-brand/30 bg-white/95 p-3 shadow-[0_6px_20px_rgba(11,28,57,0.10)] backdrop-blur",
        )}
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand/10 text-brand">
            <PencilLine className="h-4 w-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink">Editing report</p>
            <p className="flex items-center gap-1.5 text-xs text-muted">
              {previewing || saving || logoBusy ? (
                <Loader2 className="h-3 w-3 motion-safe:animate-spin" aria-hidden="true" />
              ) : null}
              {status}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {edited ? (
            <Button variant="adminGhost" size="sm" onClick={() => setConfirmReset(true)} disabled={saving}>
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Reset to AI version
            </Button>
          ) : null}
          <Button variant="adminSecondary" size="sm" onClick={onCancel} disabled={saving}>
            <X className="h-4 w-4" aria-hidden="true" />
            Cancel
          </Button>
          <Button
            variant="adminPrimary"
            size="sm"
            onClick={onSave}
            disabled={saving || !dirty || logoBusy}
            title={logoBusy ? "Wait for the logo to finish updating" : undefined}
          >
            <Save className="h-4 w-4" aria-hidden="true" />
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>
      {error ? <Alert variant="error">{error}</Alert> : null}

      <ConfirmDialog
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        title="Reset to AI version?"
        confirmLabel="Reset report"
        danger
        onConfirm={onReset}
      >
        This discards every edit to this report (scores, headings, content and the custom logo) and
        restores the AI&apos;s original result. This can&apos;t be undone.
      </ConfirmDialog>
    </div>
  );
}

/** Screen-reader announcement of the editor's outcomes (saved / reset). Keep it
 * mounted outside the edit bar: the bar unmounts as soon as a save finishes. */
export function ReportEditAnnouncer({ message }: { message: string }) {
  return (
    <p className="sr-only" role="status" aria-live="polite">
      {message}
    </p>
  );
}
