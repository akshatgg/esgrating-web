"use client";

// Inline editing for the report sheets (docs/specs/2026-09-10-editable-reports-design.md).
// The report components stay the one presentational template: they read
// heading/field overrides and the logo through this context and swap in these
// editors only while `editing`. With no provider (or no overrides) every
// helper renders exactly what the report rendered before, so the view and the
// PDFs are unchanged.

import {
  createContext,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ElementType,
  type InputHTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
  type TextareaHTMLAttributes,
} from "react";
import type { Cat, Kpis, KpisEditable, Pages, PagesEditable, ReportEdits } from "@/lib/reportEdits";
import s from "@/components/reports/edit/Editable.module.css";

export type ReportEditApi = {
  editing: boolean;
  /** Heading overrides (the draft while editing, else the saved ones). */
  headings: Record<string, string>;
  /** Field overrides, same rule. */
  fields: Record<string, unknown>;
  pageScores: NonNullable<ReportEdits["page_scores"]>;
  pillarOverrides: NonNullable<ReportEdits["pillar_overrides"]>;
  /** Whether the server treats a pillar as manually set (`effective.pillar_manual`). */
  pillarManual: Partial<Record<Cat, boolean>>;
  pages: Pages;
  /** Per category: page scores editable (missing = editable). */
  pagesEditable?: PagesEditable;
  /** KPI score overrides, 0–100 (the draft while editing, else the saved ones). */
  kpiScores: NonNullable<ReportEdits["kpi_scores"]>;
  kpis: Kpis;
  /** Per category: KPI scores editable (missing = not editable). */
  kpisEditable?: KpisEditable;
  /** Custom logo src, or null for the default. */
  logoSrc: string | null;
  logoBusy?: boolean;
  logoError?: string | null;
  setHeading?: (key: string, value: string) => void;
  setField?: (key: string, value: unknown) => void;
  setPillar?: (cat: Cat, value: number | null) => void;
  setPageScore?: (cat: Cat, page: number, value: number | null) => void;
  setKpiScore?: (cat: Cat, kpi: string, value: number | null) => void;
  setReason?: (cat: Cat, page: number, text: string) => void;
  uploadLogo?: (file: File) => void;
  useDefaultLogo?: () => void;
};

const Ctx = createContext<ReportEditApi | null>(null);

export function ReportEditProvider({ value, children }: { value: ReportEditApi | null; children: ReactNode }) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useReportEdit(): ReportEditApi | null {
  return useContext(Ctx);
}

export function useEditing(): boolean {
  return useContext(Ctx)?.editing ?? false;
}

/** A field override, else `fallback` (the value the report shows today). */
export function useField<T>(key: string, fallback: T): T {
  const ctx = useContext(Ctx);
  const fields = ctx?.fields;
  if (fields && Object.prototype.hasOwnProperty.call(fields, key)) return fields[key] as T;
  return fallback;
}

/** The heading text: its override, else the report's own copy. */
export function useHeading(key: string, fallback: string): string {
  const ctx = useContext(Ctx);
  const v = ctx?.headings?.[key];
  return typeof v === "string" && v.trim() !== "" ? v : fallback;
}

// --- Headings ------------------------------------------------------------------

type HeadingProps = {
  k: string;
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
  /** The heading's own copy (verbatim outside edit mode). */
  children: string;
};

/** A section heading. Edit mode: the same element holding a text input. */
export function EditableHeading({ k, as: Tag = "h3", className, style, children }: HeadingProps) {
  const ctx = useContext(Ctx);
  const text = useHeading(k, children);
  if (!ctx?.editing) {
    return (
      <Tag className={className} style={style}>
        {text}
      </Tag>
    );
  }
  return (
    <Tag className={className} style={style}>
      <DraftInput
        className={s.input}
        aria-label={`Heading: ${children}`}
        maxLength={200}
        placeholder={children}
        value={ctx.headings[k] ?? children}
        onCommit={(v) => ctx.setHeading?.(k, v)}
      />
    </Tag>
  );
}

// --- Draft text inputs -------------------------------------------------------------

/** Keeps what's typed while the field has focus. Blank commits "no override",
 * which makes `value` fall back to the default; without a local draft the
 * input would snap back to that default mid-typing. On blur the input shows
 * `value` again (the override, or the default when left blank). */
function useDraftText(value: string, onCommit: (v: string) => void) {
  const [draft, setDraft] = useState<string | null>(null);
  return {
    value: draft ?? value,
    onFocus: () => setDraft(value),
    onBlur: () => setDraft(null),
    onChange: (v: string) => {
      setDraft(v);
      onCommit(v);
    },
  };
}

type DraftProps<T> = Omit<T, "value" | "onChange" | "onFocus" | "onBlur"> & {
  value: string;
  onCommit: (v: string) => void;
};

function DraftInput({ value, onCommit, ...rest }: DraftProps<InputHTMLAttributes<HTMLInputElement>>) {
  const d = useDraftText(value, onCommit);
  return (
    <input
      type="text"
      {...rest}
      value={d.value}
      onFocus={d.onFocus}
      onBlur={d.onBlur}
      onChange={(e) => d.onChange(e.target.value)}
    />
  );
}

export function DraftTextarea({ value, onCommit, ...rest }: DraftProps<TextareaHTMLAttributes<HTMLTextAreaElement>>) {
  const d = useDraftText(value, onCommit);
  return (
    <AutoTextarea
      {...rest}
      value={d.value}
      onFocus={d.onFocus}
      onBlur={d.onBlur}
      onChange={(e) => d.onChange(e.target.value)}
    />
  );
}

const fieldSizingSupported = () =>
  typeof CSS !== "undefined" && typeof CSS.supports === "function" && CSS.supports("field-sizing", "content");

/** A textarea that grows with its content: CSS `field-sizing: content` where
 * supported, else its height is set from `scrollHeight` on every change. */
export function AutoTextarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || fieldSizingSupported()) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [props.value]);
  return <textarea ref={ref} {...props} />;
}

// --- Text ------------------------------------------------------------------------

type TextProps = {
  /** Field key the edit is stored under. */
  k: string;
  label: string;
  /** Current value (override or original). */
  value: string;
  multiline?: boolean;
  /** How the value renders outside edit mode (defaults to the plain text). */
  children?: ReactNode;
};

/** A text field or block. Outside edit mode renders `children` (or `value`). */
export function EditableText({ k, label, value, multiline, children }: TextProps) {
  const ctx = useContext(Ctx);
  if (!ctx?.editing) return <>{children ?? value}</>;
  const onCommit = (v: string) => ctx.setField?.(k, v);
  return multiline ? (
    <DraftTextarea className={s.input} aria-label={label} value={value} rows={2} onCommit={onCommit} />
  ) : (
    <DraftInput className={s.input} aria-label={label} value={value} onCommit={onCommit} />
  );
}

// --- Lists -------------------------------------------------------------------------

/** `<li>` items for a list field. Edit mode: an input per item with remove,
 * plus an add button (up to `max`). The caller keeps the `<ul>`, and passes the
 * full list in edit mode (so nothing is dropped on save) and the rendered slice
 * otherwise. `shown`: how many items the report renders, noted when exceeded. */
export function EditableListItems({
  k,
  label,
  items,
  max,
  shown,
}: {
  k: string;
  label: string;
  items: string[];
  max?: number;
  shown?: number;
}) {
  const ctx = useContext(Ctx);
  if (!ctx?.editing) {
    return (
      <>
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </>
    );
  }
  const set = (next: string[]) => ctx.setField?.(k, next);
  const canAdd = max === undefined || items.length < max;
  return (
    <>
      {items.map((item, i) => (
        <li key={i}>
          <div className={s.row}>
            <AutoTextarea
              className={s.input}
              rows={1}
              aria-label={`${label} ${i + 1}`}
              value={item}
              onChange={(e) => set(items.map((x, j) => (j === i ? e.target.value : x)))}
            />
            <button
              type="button"
              className={s.iconTool}
              aria-label={`Remove ${label.toLowerCase()} ${i + 1}`}
              onClick={() => set(items.filter((_, j) => j !== i))}
            >
              ✕
            </button>
          </div>
        </li>
      ))}
      <li style={{ listStyle: "none" }}>
        <button
          type="button"
          className={s.tool}
          disabled={!canAdd}
          onClick={() => set([...items, ""])}
          title={canAdd ? undefined : `Up to ${max} items`}
        >
          + Add {label.toLowerCase()}
        </button>
        {shown !== undefined && items.length > shown ? (
          <span className={s.note}> Only the first {shown} appear in the report.</span>
        ) : null}
      </li>
    </>
  );
}

// --- Keyword chips -------------------------------------------------------------------

/** Keyword chips with add/remove. Outside edit mode renders `children`. */
export function KeywordChips({
  label,
  values,
  onChange,
  children,
}: {
  label: string;
  values: string[];
  onChange: (next: string[]) => void;
  children: ReactNode;
}) {
  const editing = useEditing();
  const [text, setText] = useState("");
  if (!editing) return <>{children}</>;

  function add() {
    const parts = text
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);
    if (parts.length) onChange([...values, ...parts]);
    setText("");
  }
  function onKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add();
    } else if (e.key === "Backspace" && text === "" && values.length) {
      onChange(values.slice(0, -1));
    }
  }
  return (
    <span className={s.chips} role="group" aria-label={label}>
      {values.map((v, i) => (
        <span key={`${v}-${i}`} className={s.chip}>
          {v}
          <button
            type="button"
            aria-label={`Remove ${v}`}
            onClick={() => onChange(values.filter((_, j) => j !== i))}
          >
            ×
          </button>
        </span>
      ))}
      <input
        type="text"
        className={s.chipInput}
        aria-label={`Add to ${label}`}
        placeholder="Add…"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={onKey}
        onBlur={add}
      />
    </span>
  );
}

// --- Logo ---------------------------------------------------------------------------

/** The report logo. Outside edit mode a plain `<img>` (html2canvas draws it);
 * edit mode wraps it in a click-to-replace button plus "Use default logo". */
export function EditableLogo({
  defaultSrc,
  alt,
  width,
  height,
}: {
  defaultSrc: string;
  alt: string;
  width?: number;
  height?: number;
}) {
  const ctx = useContext(Ctx);
  const inputRef = useRef<HTMLInputElement>(null);
  const src = ctx?.logoSrc ?? defaultSrc;
  // eslint-disable-next-line @next/next/no-img-element -- plain <img> so html2canvas can capture it
  const img = <img src={src} alt={alt} width={width} height={height} />;
  if (!ctx?.editing) return img;
  return (
    <span className={s.logo}>
      <button
        type="button"
        className={s.logoButton}
        onClick={() => inputRef.current?.click()}
        disabled={ctx.logoBusy}
        aria-label="Replace logo (PNG, JPEG or WebP, up to 1 MB)"
        title="Replace logo"
      >
        {img}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) ctx.uploadLogo?.(file);
        }}
      />
      {ctx.logoBusy ? <span className={s.tag}>Uploading…</span> : null}
      <span className={s.note}>Logo changes save immediately.</span>
      {ctx.logoSrc ? (
        <button type="button" className={s.link} onClick={() => ctx.useDefaultLogo?.()}>
          Use default logo
        </button>
      ) : null}
      {ctx.logoError ? (
        <span role="alert" className={s.logoError}>
          {ctx.logoError}
        </span>
      ) : null}
    </span>
  );
}

// --- Scores ---------------------------------------------------------------------------

const fmt = (v: number | null | undefined) => (typeof v === "number" && Number.isFinite(v) ? String(v) : "");

/** 0–100 number input that keeps what's typed and commits valid values only.
 * Empty commits null when `allowEmpty`. */
export function ScoreInput({
  value,
  onCommit,
  label,
  allowEmpty,
  className,
}: {
  value: number | null | undefined;
  onCommit: (v: number | null) => void;
  label: string;
  allowEmpty?: boolean;
  className?: string;
}) {
  const [text, setText] = useState(fmt(value));
  const [prev, setPrev] = useState(value);
  const [focused, setFocused] = useState(false);
  if (prev !== value) {
    setPrev(value);
    if (!focused) setText(fmt(value));
  }
  const n = Number(text);
  const invalid = text.trim() === "" ? !allowEmpty : !(Number.isFinite(n) && n >= 0 && n <= 100);
  return (
    <input
      type="number"
      inputMode="decimal"
      min={0}
      max={100}
      step={0.01}
      aria-label={label}
      aria-invalid={invalid || undefined}
      className={[s.input, s.num, invalid ? s.invalid : "", className ?? ""].join(" ")}
      value={text}
      onFocus={() => setFocused(true)}
      onBlur={() => {
        setFocused(false);
        setText(fmt(value));
      }}
      onChange={(e) => {
        const t = e.target.value;
        setText(t);
        if (t.trim() === "") {
          if (allowEmpty) onCommit(null);
          return;
        }
        const v = Number(t);
        if (Number.isFinite(v) && v >= 0 && v <= 100) onCommit(v);
      }}
    />
  );
}

/** A pillar score cell. Outside edit mode renders `children` (today's text);
 * edit mode: the input, a "manual" tag and "↺ use page average". */
export function PillarScore({
  cat,
  pillar,
  score,
  children,
}: {
  cat: Cat;
  pillar: string;
  /** The effective pillar score from the server. */
  score: number;
  children: ReactNode;
}) {
  const ctx = useContext(Ctx);
  if (!ctx?.editing) return <>{children}</>;
  const override = ctx.pillarOverrides[cat];
  const manual = typeof override === "number";
  return (
    <span className={s.scoreCell}>
      <ScoreInput
        label={`${pillar} score (0 to 100)`}
        value={manual ? override : score}
        onCommit={(v) => v !== null && ctx.setPillar?.(cat, v)}
      />
      {manual ? (
        <>
          <span className={s.tag}>manual</span>
          <button type="button" className={s.link} onClick={() => ctx.setPillar?.(cat, null)}>
            {ctx.kpisEditable?.[cat] ? "↺ use KPI score" : "↺ use page average"}
          </button>
        </>
      ) : null}
    </span>
  );
}
