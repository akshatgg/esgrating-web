"use client";

import { useState } from "react";
import { Loader2, Paperclip, Send } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import Field from "@/components/ui/Field";
import { apiFetch, apiUpload, ApiError } from "@/lib/api";

const TEAM_EMAIL = "info@esgratings.co.in";
/** One address, as the API's resolve_recipient() accepts it (app/core/mail.py). */
const EMAIL_RE = /^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/;

/** `GET/PUT/DELETE …/mail-template` (esgratings-api app/core/mail_templates.py). */
type MailTemplate = {
  subject: string;
  body: string;
  is_default: boolean;
  placeholders: Array<{ key: string; label: string }>;
};

type SendReportButtonProps = {
  /** Renders the report(s) and returns the PDF(s) to attach, in the order the API
   * names them. Called only after the send is confirmed. */
  getPdfs: () => Promise<Blob[]>;
  /** `/api/admin/esg/submissions/{id}/send` or the BFSI equivalent. */
  endpoint: string;
  /** `/api/admin/esg/mail-template` or the BFSI equivalent: the email's saved text. */
  templateEndpoint: string;
  /** Pre-fills the recipient: whoever filled in the form. Empty when unknown. */
  email?: string | null;
  /** Field name the API expects the PDF blobs under (default `"pdf"`). */
  fieldName?: string;
  /** Extra reason the button is unavailable (e.g. the saved report hasn't loaded). */
  unavailableReason?: string | null;
  /** What gets attached, listed in the dialog, e.g. ["ESG Rating Report", "Detailed Report"]. */
  attachments?: string[];
};

type Status = "idle" | "loading" | "sending" | "success" | "error";

/** Confirm the recipient and the email's text → build the PDF(s) client-side →
 * POST them multipart. The address starts as the submitter's own; the subject and
 * message start as the saved template and can be saved back for future reports. */
export default function SendReportButton({
  getPdfs,
  endpoint,
  templateEndpoint,
  email,
  fieldName = "pdf",
  unavailableReason,
  attachments,
}: SendReportButtonProps) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [placeholders, setPlaceholders] = useState<MailTemplate["placeholders"]>([]);
  const [isDefault, setIsDefault] = useState(true);
  const [saveTemplate, setSaveTemplate] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const recipient = to.trim();
  const valid = EMAIL_RE.test(recipient) && subject.trim() !== "" && body.trim() !== "";
  const busy = status === "sending" || status === "loading";

  function applyTemplate(t: MailTemplate) {
    setSubject(t.subject);
    setBody(t.body);
    setPlaceholders(t.placeholders);
    setIsDefault(t.is_default);
  }

  async function openDialog() {
    setTo((email ?? "").trim());
    setMessage(null);
    setNotice(null);
    setSaveTemplate(false);
    setOpen(true);
    setStatus("loading");
    try {
      applyTemplate(await apiFetch<MailTemplate>(templateEndpoint));
      setStatus("idle");
    } catch (err) {
      setStatus("error");
      setMessage(
        `Couldn't load the email text (${err instanceof ApiError ? err.message : "network error"}). Close and try again.`,
      );
    }
  }

  async function resetToStandard() {
    setStatus("loading");
    setNotice(null);
    try {
      applyTemplate(await apiFetch<MailTemplate>(templateEndpoint, { method: "DELETE" }));
      setNotice("Back to the standard text. Future reports use it too.");
      setStatus("idle");
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof ApiError ? err.message : "Something went wrong.");
    }
  }

  function close() {
    if (busy) return;
    setOpen(false);
    setStatus("idle");
    setMessage(null);
  }

  async function handleConfirm() {
    if (!valid || busy) return;
    setStatus("sending");
    setMessage(null);
    try {
      if (saveTemplate) {
        applyTemplate(
          await apiFetch<MailTemplate>(templateEndpoint, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ subject, body }),
          }),
        );
      }
      const pdfs = await getPdfs();
      const form = new FormData();
      form.append("email", recipient);
      form.append("subject", subject);
      form.append("body", body);
      pdfs.forEach((blob, i) => form.append(fieldName, blob, `report-${i + 1}.pdf`));
      await apiUpload(endpoint, form);
      setStatus("success");
      setMessage(
        `Report sent to ${recipient}.${saveTemplate ? " The subject and message are saved for future reports." : ""}`,
      );
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof ApiError ? err.message : "Something went wrong.");
    }
  }

  const placeholderHint = placeholders.length
    ? `${placeholders.map((p) => `{${p.key}}`).join(", ")} ${
        placeholders.length === 1 ? "is" : "are"
      } filled in for each report (${placeholders.map((p) => p.label).join(", ")}).`
    : undefined;

  return (
    <>
      <Button
        variant="adminSecondary"
        disabled={!!unavailableReason}
        onClick={() => void openDialog()}
        title={unavailableReason ?? undefined}
      >
        <Send className="h-4 w-4" aria-hidden="true" />
        Send report
      </Button>

      <Modal open={open} onClose={close} title="Send report" className="max-w-2xl">
        <div className="flex flex-col gap-4">
          {status === "success" || status === "error" ? (
            <Alert variant={status === "success" ? "success" : "error"}>{message}</Alert>
          ) : null}
          {notice && status !== "success" ? <Alert variant="success">{notice}</Alert> : null}

          {status !== "success" ? (
            <form
              id="send-report-form"
              className="flex flex-col gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                void handleConfirm();
              }}
            >
              <Field
                label="Send to"
                name="send_to"
                type="email"
                autoComplete="email"
                placeholder="name@company.com"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                disabled={busy}
                required
                error={recipient && !EMAIL_RE.test(recipient) ? "Enter a single valid email address." : undefined}
                hint={`A copy goes to ${TEAM_EMAIL}.`}
              />
              <Field
                label="Subject"
                name="send_subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                disabled={busy}
                maxLength={200}
                required
              />
              <Field
                as="textarea"
                label="Message"
                name="send_body"
                rows={10}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                disabled={busy}
                maxLength={10000}
                required
                hint={placeholderHint}
              />
              {attachments?.length ? (
                <p className="flex items-center gap-2 text-sm text-muted">
                  <Paperclip className="h-4 w-4 shrink-0" aria-hidden="true" />
                  Attached: {attachments.join(" + ")}
                </p>
              ) : null}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-ink">
                  <input
                    type="checkbox"
                    className="h-4 w-4 cursor-pointer accent-calc-blue"
                    checked={saveTemplate}
                    onChange={(e) => setSaveTemplate(e.target.checked)}
                    disabled={busy}
                  />
                  Save as the default for future reports
                </label>
                {!isDefault ? (
                  <button
                    type="button"
                    className="text-sm font-medium text-calc-blue underline disabled:opacity-50"
                    onClick={() => void resetToStandard()}
                    disabled={busy}
                  >
                    Reset to standard text
                  </button>
                ) : null}
              </div>
            </form>
          ) : null}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            {status === "success" ? (
              <Button variant="adminPrimary" onClick={close}>
                Done
              </Button>
            ) : (
              <>
                <Button variant="adminSecondary" onClick={close} disabled={busy}>
                  Cancel
                </Button>
                <Button
                  variant="adminPrimary"
                  type="submit"
                  form="send-report-form"
                  disabled={busy || !valid}
                >
                  {status === "sending" ? (
                    <>
                      <Loader2 className="h-4 w-4 motion-safe:animate-spin" aria-hidden="true" />
                      Sending…
                    </>
                  ) : status === "loading" ? (
                    <>
                      <Loader2 className="h-4 w-4 motion-safe:animate-spin" aria-hidden="true" />
                      Loading…
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
