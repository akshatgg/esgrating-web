"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { adminLoginHref } from "@/lib/nav";

/** Rendered by the protected admin layout instead of the page when there is
 * no valid session. A server layout can't see the request path (layouts don't
 * re-render on navigation), so the `?next=` bounce happens here on the client;
 * the protected page itself is never rendered. */
export default function LoginRedirect() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    router.replace(adminLoginHref(pathname + window.location.search));
  }, [pathname, router]);

  return (
    <div className="grid min-h-screen place-items-center bg-bg-soft px-4 text-sm text-muted">
      <p role="status">
        Redirecting to{" "}
        <Link href={adminLoginHref(pathname)} className="font-medium text-calc-blue underline">
          the login page
        </Link>
        …
      </p>
    </div>
  );
}
