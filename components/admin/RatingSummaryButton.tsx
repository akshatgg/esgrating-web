"use client";

import { useState } from "react";
import { FileText, Loader2 } from "lucide-react";
import Button from "@/components/ui/Button";
import { ApiError, apiFetchBlob } from "@/lib/api";

type RatingSummaryButtonProps = {
  /** `/api/admin/{esg|bfsi}/submissions/{id}/summary`. */
  endpoint: string;
  /** Saved file name, e.g. `esg-rating-summary-acme-1a2b3c.docx`. */
  fileName: string;
  /** Called with a message when the download fails (the page shows it). */
  onError: (message: string | null) => void;
};

/** Downloads the ESG Rating Summary (.docx, built on the server from the saved report).
 * The first download writes the summary text with AI, so it can take a few seconds. */
export default function RatingSummaryButton({ endpoint, fileName, onError }: RatingSummaryButtonProps) {
  const [busy, setBusy] = useState(false);

  async function handleClick() {
    setBusy(true);
    onError(null);
    try {
      const blob = await apiFetchBlob(endpoint);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      onError(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button variant="adminSecondary" onClick={handleClick} disabled={busy} aria-busy={busy}>
      {busy ? (
        <Loader2 className="h-4 w-4 motion-safe:animate-spin" aria-hidden="true" />
      ) : (
        <FileText className="h-4 w-4" aria-hidden="true" />
      )}
      {busy ? "Writing summary…" : "Download summary (Word)"}
    </Button>
  );
}
