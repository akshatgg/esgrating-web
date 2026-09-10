"use client";

// State for editing a report in place (docs/specs/2026-09-10-editable-reports-design.md):
// loads GET …/report, keeps a draft of the edits object, previews every change
// through the server (debounced ~300ms; the browser never computes scores),
// saves with PUT, resets with DELETE, uploads the logo, and guards unsaved
// changes against closing the tab or following an in-app link.

import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError } from "@/lib/api";
import {
  deleteReportLogo,
  draftFrom,
  getReport,
  logoSrcOf,
  previewReport,
  resetReportEdits,
  saveReportEdits,
  uploadReportLogo,
  type Cat,
  type Effective,
  type PreviewResult,
  type ReportEdits,
  type ReportKind,
  type ReportState,
} from "@/lib/reportEdits";
import type { ReportEditApi } from "@/components/reports/edit/ReportEdit";

const PREVIEW_DELAY_MS = 300;
const LOGO_MAX_BYTES = 1024 * 1024;
const LOGO_TYPES = ["image/png", "image/jpeg", "image/webp"];
const LEAVE_MESSAGE = "You have unsaved changes to this report. Leave without saving?";

const message = (err: unknown) => (err instanceof ApiError ? err.message : "Something went wrong.");

export type ReportEditor<E extends Effective> = ReturnType<typeof useReportEditor<E>>;

export function useReportEditor<E extends Effective>(
  kind: ReportKind,
  id: string,
  {
    enabled,
    onSaved,
  }: {
    /** True once the submission has a report (ESG `final` / BFSI `ai_analysis`). */
    enabled: boolean;
    /** Called after save/reset so the page can reload its detail. */
    onSaved?: () => void | Promise<void>;
  },
) {
  const [report, setReport] = useState<ReportState<E> | null>(null);
  /** The report API isn't there (older backend) or refused: editing hidden. */
  const [unavailable, setUnavailable] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<ReportEdits>({});
  const [dirty, setDirty] = useState(false);
  const [preview, setPreview] = useState<PreviewResult<E> | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [logoBusy, setLogoBusy] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [logoBust, setLogoBust] = useState(0);
  const [version, setVersion] = useState(0);

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inflight = useRef<AbortController | null>(null);
  const seq = useRef(0);

  useEffect(() => {
    if (!enabled) return;
    const ctrl = new AbortController();
    getReport<E>(kind, id, ctrl.signal)
      .then((res) => {
        setReport(res);
        setUnavailable(false);
      })
      .catch((err: unknown) => {
        if (ctrl.signal.aborted) return;
        setReport(null);
        setUnavailable(err instanceof ApiError && err.status !== 0);
      });
    return () => ctrl.abort();
  }, [kind, id, enabled, version]);

  // Cancel a pending preview on unmount.
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
      inflight.current?.abort();
    },
    [],
  );

  // Unsaved-changes guard: closing/reloading the tab, and in-app links (capture
  // phase, ahead of Next's <Link> handler at the React root).
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const url = new URL(a.href, window.location.href);
      if (url.origin === window.location.origin && url.pathname === window.location.pathname && url.hash) return;
      if (!window.confirm(LEAVE_MESSAGE)) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onClick, true);
    };
  }, [dirty]);

  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  function runPreview(next: ReportEdits) {
    if (timer.current) clearTimeout(timer.current);
    setPreviewing(true);
    timer.current = setTimeout(() => {
      inflight.current?.abort();
      const ctrl = new AbortController();
      inflight.current = ctrl;
      const mine = ++seq.current;
      previewReport<E>(kind, id, next, ctrl.signal)
        .then((res) => {
          if (mine !== seq.current) return;
          setPreview(res);
          setError(null);
          setPreviewing(false);
        })
        .catch((err: unknown) => {
          if (ctrl.signal.aborted || mine !== seq.current) return;
          setError(message(err));
          setPreviewing(false);
        });
    }, PREVIEW_DELAY_MS);
  }

  /** Apply a change to the draft and preview it. Score changes need the server;
   * text-only changes (`recalc: false`) render straight from the draft. */
  function update(fn: (d: ReportEdits) => void, recalc = true) {
    const next = structuredClone(draft);
    fn(next);
    setDraft(next);
    setDirty(true);
    if (recalc) runPreview(next);
  }

  function stopPreview() {
    if (timer.current) clearTimeout(timer.current);
    inflight.current?.abort();
    seq.current++;
    setPreviewing(false);
  }

  function start() {
    if (!report) return;
    setDraft(draftFrom(report.edits));
    setPreview(null);
    setError(null);
    setLogoError(null);
    setDirty(false);
    setEditing(true);
  }

  function cancel() {
    stopPreview();
    setEditing(false);
    setDirty(false);
    setPreview(null);
    setError(null);
    setLogoError(null);
  }

  async function save() {
    stopPreview();
    setSaving(true);
    setError(null);
    try {
      const res = await saveReportEdits<E>(kind, id, draft);
      setReport(res);
      setEditing(false);
      setDirty(false);
      setPreview(null);
      setLogoBust(Date.now());
      await onSaved?.();
    } catch (err) {
      setError(message(err));
    } finally {
      setSaving(false);
    }
  }

  /** DELETE …/report/edits. Throws so the confirm dialog can show the error. */
  async function reset() {
    stopPreview();
    await resetReportEdits(kind, id);
    setEditing(false);
    setDirty(false);
    setPreview(null);
    setError(null);
    // Swap in the reset report before touching the cache-buster, so the
    // just-deleted custom logo isn't requested again.
    const res = await getReport<E>(kind, id).catch(() => null);
    if (res) setReport(res);
    await onSaved?.();
  }

  async function uploadLogo(file: File) {
    setLogoError(null);
    if (!LOGO_TYPES.includes(file.type)) {
      setLogoError("Use a PNG, JPEG or WebP image.");
      return;
    }
    if (file.size > LOGO_MAX_BYTES) {
      setLogoError("The logo must be 1 MB or smaller.");
      return;
    }
    await logoRequest(() => uploadReportLogo<E>(kind, id, file));
  }

  /** The logo is stored immediately by POST/DELETE …/report/logo (Save and
   * Cancel don't touch it); both return the GET body. */
  async function logoRequest(req: () => Promise<ReportState<E>>) {
    setLogoBusy(true);
    try {
      const res = await req();
      setReport(res);
      setPreview((p) => (p ? { ...p, effective: { ...p.effective, logo_url: res.effective.logo_url } } : p));
      setLogoBust(Date.now());
    } catch (err) {
      setLogoError(message(err));
    } finally {
      setLogoBusy(false);
    }
  }

  const liveEffective: E | null = editing
    ? (preview?.effective ?? report?.effective ?? null)
    : report?.edited
      ? report.effective
      : null;

  const savedEdits = report?.edits ?? null;

  /** Read-only context for the saved report (the view, PDFs and Send). */
  const savedCtx: ReportEditApi | null = report
    ? {
        editing: false,
        headings: { ...(report.effective.headings ?? {}), ...(savedEdits?.headings ?? {}) },
        fields: savedEdits?.fields ?? {},
        pageScores: savedEdits?.page_scores ?? {},
        pillarOverrides: savedEdits?.pillar_overrides ?? {},
        pillarManual: report.effective.pillar_manual ?? {},
        pages: report.pages ?? {},
        logoSrc: logoSrcOf(report.effective, logoBust),
      }
    : null;

  const editCtx: ReportEditApi | null =
    editing && report
      ? {
          editing: true,
          headings: draft.headings ?? {},
          fields: draft.fields ?? {},
          pageScores: draft.page_scores ?? {},
          pillarOverrides: draft.pillar_overrides ?? {},
          pillarManual: liveEffective?.pillar_manual ?? {},
          pages: preview?.pages ?? report.pages ?? {},
          logoSrc: logoSrcOf(liveEffective, logoBust),
          logoBusy,
          logoError,
          setHeading: (k, v) =>
            update((d) => {
              d.headings = { ...d.headings };
              if (v === "") delete d.headings[k];
              else d.headings[k] = v;
            }, false),
          setField: (k, v) =>
            update((d) => {
              d.fields = { ...d.fields, [k]: v };
            }, k === "recommendation" ? false : true),
          setPillar: (cat: Cat, v) =>
            update((d) => {
              d.pillar_overrides = { ...d.pillar_overrides, [cat]: v };
            }),
          setPageScore: (cat: Cat, page, v) =>
            update((d) => {
              const catMap = { ...(d.page_scores?.[cat] ?? {}) };
              if (v === null) delete catMap[String(page)];
              else catMap[String(page)] = v;
              d.page_scores = { ...d.page_scores, [cat]: catMap };
            }),
          setReason: (cat: Cat, page, text) =>
            update((d) => {
              const reasons = { ...((d.fields?.reasons as Record<string, Record<string, string>>) ?? {}) };
              reasons[cat] = { ...(reasons[cat] ?? {}), [String(page)]: text };
              d.fields = { ...d.fields, reasons };
            }),
          uploadLogo: (file) => void uploadLogo(file),
          useDefaultLogo: () => {
            setLogoError(null);
            void logoRequest(() => deleteReportLogo<E>(kind, id));
          },
        }
      : null;

  return {
    report,
    unavailable,
    editing,
    dirty,
    saving,
    previewing,
    error,
    /** The effective report to render, or null to render the detail as today. */
    liveEffective,
    pages: editing ? (preview?.pages ?? report?.pages ?? {}) : (report?.pages ?? {}),
    editCtx,
    savedCtx,
    start,
    cancel,
    save,
    reset,
    refresh,
    setError,
  };
}
