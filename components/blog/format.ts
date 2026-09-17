/** "4 May 2025", or "" when unpublished. */
export function formatPostDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

/** Uploaded images are served by the API (`/api/blog/images/...`); the Next
 * image optimizer is skipped for those, as it is for any non-`public/` file. */
export function isApiImage(src: string): boolean {
  return src.startsWith("/api/");
}
