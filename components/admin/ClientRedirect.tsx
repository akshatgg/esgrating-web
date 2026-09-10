"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Client-side redirect for a retired admin URL (there's no middleware):
 * replaces the history entry, so Back skips the old page. */
export default function ClientRedirect({ to, label }: { to: string; label: string }) {
  const router = useRouter();

  useEffect(() => {
    router.replace(to);
  }, [router, to]);

  return (
    <p role="status" className="text-sm text-muted">
      Redirecting to {label}…
    </p>
  );
}
