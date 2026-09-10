"use client";

import { useState } from "react";
import { Loader2, Send } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import { apiUpload, ApiError } from "@/lib/api";

const TEAM_EMAIL = "info@esgratings.co.in";

type SendReportButtonProps = {
  /** Renders the report and returns the PDF(s) to attach — e.g. `[await
   * pdfBlob(reportRef.current)]`. Called only after the send is confirmed. */
  getPdfs: () => Promise<Blob[]>;
  /** `/api/admin/esg/submissions/{id}/send` or the BFSI equivalent. */
  endpoint: string;
  email: string;
  /** Field name(s) the API expects the PDF blob(s) under (default `"pdf"`). */
  fieldName?: string;
};

type Status = "idle" | "sending" | "success" | "error";

/** Confirm → build the PDF client-side → POST it multipart. Mirrors the ESG
 * report's "Send report" action (there is no admin send flow to mirror in
 * esg-report.php itself — see the W6 brief's interface). */
export default function SendReportButton({
  getPdfs,
  endpoint,
  email,
  fieldName = "pdf",
}: SendReportButtonProps) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);

  const disabled = !email;

  function close() {
    if (status === "sending") return;
    setOpen(false);
    setStatus("idle");
    setMessage(null);
  }

  async function handleConfirm() {
    setStatus("sending");
    setMessage(null);
    try {
      const pdfs = await getPdfs();
      const body = new FormData();
      pdfs.forEach((blob) => body.append(fieldName, blob, "esg_report.pdf"));
      await apiUpload(endpoint, body);
      setStatus("success");
      setMessage(`Report sent to ${email}.`);
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof ApiError ? err.message : "Something went wrong.");
    }
  }

  return (
    <>
      <Button variant="outline" disabled={disabled} onClick={() => setOpen(true)}>
        <Send className="h-4 w-4" aria-hidden="true" />
        Send report
      </Button>

      <Modal open={open} onClose={close} title="Send report">
        <div className="flex flex-col gap-4">
          {status === "success" || status === "error" ? (
            <Alert variant={status === "success" ? "success" : "error"}>{message}</Alert>
          ) : (
            <p className="text-sm text-ink">
              Send the report to {email}? A copy goes to {TEAM_EMAIL}.
            </p>
          )}

          <div className="flex justify-end gap-3">
            {status === "success" ? (
              <Button variant="calcBlue" onClick={close}>
                Done
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={close} disabled={status === "sending"}>
                  Cancel
                </Button>
                <Button variant="calcBlue" onClick={handleConfirm} disabled={status === "sending"}>
                  {status === "sending" ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      Sending…
                    </>
                  ) : status === "error" ? (
                    "Try again"
                  ) : (
                    "Send"
                  )}
                </Button>
              </>
            )}
          </div>
        </div>
      </Modal>
    </>
  );
}
