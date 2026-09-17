"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ImageUp, Loader2, Trash2 } from "lucide-react";
import { uploadBlogImage } from "@/lib/blog-api";
import { ApiError } from "@/lib/api";
import { isApiImage } from "@/components/blog/format";

export const IMAGE_ACCEPT = "image/png,image/jpeg,image/webp";

/** The post's cover image: a dashed upload tile, or the image with Replace /
 * Remove. Uploads go to `POST /api/admin/blog/images`. */
export default function CoverImageField({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (url: string | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File) {
    setBusy(true);
    setError(null);
    try {
      const { url } = await uploadBlogImage(file);
      onChange(url);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "The image could not be uploaded.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-label">Cover image</span>
      <input
        ref={inputRef}
        type="file"
        accept={IMAGE_ACCEPT}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) void upload(file);
        }}
      />
      {value ? (
        <div className="overflow-hidden rounded-xl border border-line">
          <div className="relative aspect-[16/9] w-full bg-bg-soft">
            <Image src={value} alt="Cover" fill unoptimized={isApiImage(value)} sizes="320px" className="object-cover" />
            {busy ? (
              <div className="absolute inset-0 grid place-items-center bg-white/70">
                <Loader2 className="h-5 w-5 text-muted motion-safe:animate-spin" aria-hidden="true" />
              </div>
            ) : null}
          </div>
          <div className="flex border-t border-line text-[13px] font-medium">
            <button
              type="button"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
              className="flex flex-1 items-center justify-center gap-1.5 py-2 text-ink hover:bg-slate-50 disabled:opacity-60"
            >
              <ImageUp className="h-4 w-4" aria-hidden="true" />
              Replace
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => onChange(null)}
              className="flex flex-1 items-center justify-center gap-1.5 border-l border-line py-2 text-red-600 hover:bg-red-50 disabled:opacity-60"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              Remove
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="flex aspect-[16/9] w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-field bg-bg-soft/50 text-sm text-muted hover:border-calc-blue hover:text-calc-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:opacity-60 motion-safe:transition-colors"
        >
          {busy ? (
            <Loader2 className="h-5 w-5 motion-safe:animate-spin" aria-hidden="true" />
          ) : (
            <ImageUp className="h-5 w-5" aria-hidden="true" />
          )}
          {busy ? "Uploading…" : "Upload cover image"}
          <span className="text-xs">PNG, JPEG or WebP, up to 5 MB</span>
        </button>
      )}
      {error ? <p className="text-sm text-grade-d">{error}</p> : null}
    </div>
  );
}
