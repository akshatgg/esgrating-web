/** True when `href` is the active nav item for `pathname`. Exact match for "/",
 * otherwise an exact match or a match of a deeper path segment (so
 * "/esg-rating-calculator" does not activate "/esg-rating"). */
export function isActivePath(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export const ADMIN_LOGIN_PATH = "/admin/login";

/** Sanitises a post-login `?next=` target: same-origin absolute paths only
 * (no `//host`, backslashes or control characters), never the login page
 * itself. Anything else falls back to the Dashboard. */
export function safeNextPath(
  value: string | string[] | null | undefined,
  fallback = "/admin",
): string {
  const v = Array.isArray(value) ? value[0] : value;
  if (!v || !v.startsWith("/") || v.startsWith("//") || v.includes("\\")) return fallback;
  if ([...v].some((ch) => ch.charCodeAt(0) < 32 || ch.charCodeAt(0) === 127)) return fallback;
  if (
    v === ADMIN_LOGIN_PATH ||
    v.startsWith(`${ADMIN_LOGIN_PATH}?`) ||
    v.startsWith(`${ADMIN_LOGIN_PATH}/`)
  ) {
    return fallback;
  }
  return v;
}

/** `/admin/login?next=<path>` — slashes left readable, everything else encoded. */
export function adminLoginHref(next: string): string {
  return `${ADMIN_LOGIN_PATH}?next=${encodeURIComponent(next).replace(/%2F/gi, "/")}`;
}
