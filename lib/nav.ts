/** True when `href` is the active nav item for `pathname`. Exact match for "/",
 * otherwise an exact match or a match of a deeper path segment (so
 * "/esg-rating-calculator" does not activate "/esg-rating"). */
export function isActivePath(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}
