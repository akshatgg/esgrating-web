"use client";

import { useRef, useState, type ReactNode } from "react";
import { FileText, UploadCloud, X } from "lucide-react";
import clsx from "clsx";
import { ICON_BUTTON } from "./styles";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Dropzone-style file input: a dashed target you can click, drop onto, or
 * reach with Tab (the real `<input type="file">` is visually hidden inside
 * it), plus a filename chip with a remove button once a file is chosen. */
export default function FileDrop({
  id,
  name,
  label,
  accept,
  prompt,
  hint,
  file,
  onFile,
  required,
}: {
  id: string;
  name: string;
  label: string;
  accept?: string;
  /** The target's call to action, e.g. "Drop CSV or browse". */
  prompt: string;
  hint?: ReactNode;
  file: File | null;
  onFile: (file: File | null) => void;
  required?: boolean;
}) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function clear() {
    onFile(null);
    if (inputRef.current) inputRef.current.value = "";
    inputRef.current?.focus();
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-label">
        {label}
        {required ? <span className="text-grade-d"> *</span> : null}
      </label>
      <label
        htmlFor={id}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const dropped = e.dataTransfer.files?.[0];
          if (dropped) onFile(dropped);
        }}
        className={clsx(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-8 text-center motion-safe:transition-colors",
          "has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-brand",
          dragging
            ? "border-brand bg-brand/5"
            : "border-field bg-slate-50/70 hover:border-brand/50 hover:bg-brand/[0.03]",
        )}
      >
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-brand shadow-sm ring-1 ring-line">
          <UploadCloud className="h-5 w-5" aria-hidden="true" />
        </span>
        <span className="text-sm font-semibold text-brand">{prompt}</span>
        {hint ? <span className="max-w-md text-xs text-muted">{hint}</span> : null}
        <input
          ref={inputRef}
          id={id}
          name={name}
          type="file"
          accept={accept}
          required={required}
          className="sr-only"
          onChange={(e) => onFile(e.target.files?.[0] ?? null)}
        />
      </label>
      {file ? (
        <div className="flex max-w-full items-center gap-2 self-start rounded-lg border border-line bg-white py-1 pr-1 pl-2.5 text-sm text-ink">
          <FileText className="h-4 w-4 shrink-0 text-brand" aria-hidden="true" />
          <span className="min-w-0 truncate font-medium">{file.name}</span>
          <span className="shrink-0 text-xs text-muted tabular-nums">{formatBytes(file.size)}</span>
          <button
            type="button"
            onClick={clear}
            aria-label={`Remove ${file.name}`}
            className={clsx(ICON_BUTTON, "h-7 w-7")}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      ) : null}
    </div>
  );
}
