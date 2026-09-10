"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** `to` plus the current page's query; `to`'s own parameters win. */
function withCurrentQuery(to: string): string {
  const target = new URL(to, window.location.origin);
  new URLSearchParams(window.location.search).forEach((value, key) => {
    if (!target.searchParams.has(key)) target.searchParams.append(key, value);
  });
  return `${target.pathname}${target.search}${target.hash}`;
}

/** Client-side redirect for a retired admin URL (there's no middleware):
 * replaces the history entry, so Back skips the old page. The query string
 * carries over, so `/admin/ratings?search=x` keeps its search. */
export default function ClientRedirect({ to, label }: { to: string; label: string }) {
  const router = useRouter();

  useEffect(() => {
    router.replace(withCurrentQuery(to));
  }, [router, to]);

  return (
    <p role="status" className="text-sm text-muted">
      Redirecting to {label}…
    </p>
  );
}
