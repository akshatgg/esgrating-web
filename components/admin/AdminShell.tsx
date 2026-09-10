"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Menu, X } from "lucide-react";
import clsx from "clsx";
import { isActivePath } from "@/lib/nav";
import { apiFetch } from "@/lib/api";

const TABS = [
  { label: "ESG Submissions", href: "/admin/esg" },
  { label: "BFSI Submissions", href: "/admin/bfsi" },
  { label: "ESG Rating List", href: "/admin/ratings" },
  { label: "Messages", href: "/admin/messages" },
];

const NEW_ESG_HREF = "/admin/esg/new";
const NEW_BFSI_HREF = "/admin/bfsi/new";

type AdminShellProps = {
  username: string;
  children: ReactNode;
};

/** The admin dashboard chrome: top bar (logo, username, New/Logout actions)
 * plus the section tabs. Rendered by `admin/(protected)/layout.tsx` once the
 * server guard confirms a valid session. */
export default function AdminShell({ username, children }: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Ignore — redirect to login regardless, so an already-expired
      // session doesn't strand the admin on a page that just bounces back.
    } finally {
      router.replace("/admin/login");
    }
  }

  return (
    <div className="min-h-screen bg-bg-soft">
      <header className="sticky top-0 z-30 border-b border-line bg-white">
        <div className="container-site flex h-16 items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <Link href="/admin/esg" className="flex shrink-0 items-center">
              <Image
                src="/brand/logo.jpg"
                alt="ESG Ratings"
                width={40}
                height={23}
                className="h-auto w-10"
              />
            </Link>
            <span className="hidden shrink-0 text-sm font-semibold text-ink sm:inline">
              Superadmin
            </span>
            <span className="truncate text-sm text-muted">{username}</span>
          </div>

          <div className="hidden items-center gap-2 md:flex">
            <Link
              href={NEW_ESG_HREF}
              className="rounded-full border border-line px-4 py-2 text-sm font-medium text-ink hover:border-calc-blue hover:text-calc-blue"
            >
              New ESG Assessment
            </Link>
            <Link
              href={NEW_BFSI_HREF}
              className="rounded-full border border-line px-4 py-2 text-sm font-medium text-ink hover:border-calc-blue hover:text-calc-blue"
            >
              New BFSI Assessment
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="inline-flex items-center gap-1.5 rounded-full bg-calc-navy px-4 py-2 text-sm font-medium text-white hover:bg-calc-navy-hover disabled:opacity-60"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Logout
            </button>
          </div>

          <button
            type="button"
            aria-expanded={menuOpen}
            aria-controls="admin-menu"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen((v) => !v)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-ink hover:bg-bg-soft md:hidden"
          >
            {menuOpen ? (
              <X className="h-6 w-6" aria-hidden="true" />
            ) : (
              <Menu className="h-6 w-6" aria-hidden="true" />
            )}
          </button>
        </div>

        {menuOpen ? (
          <div id="admin-menu" className="border-t border-line bg-white px-4 py-3 md:hidden">
            <div className="flex flex-col gap-2">
              <Link
                href={NEW_ESG_HREF}
                onClick={() => setMenuOpen(false)}
                className="rounded-lg border border-line px-4 py-2.5 text-sm font-medium text-ink hover:border-calc-blue hover:text-calc-blue"
              >
                New ESG Assessment
              </Link>
              <Link
                href={NEW_BFSI_HREF}
                onClick={() => setMenuOpen(false)}
                className="rounded-lg border border-line px-4 py-2.5 text-sm font-medium text-ink hover:border-calc-blue hover:text-calc-blue"
              >
                New BFSI Assessment
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-calc-navy px-4 py-2.5 text-sm font-medium text-white hover:bg-calc-navy-hover disabled:opacity-60"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Logout
              </button>
            </div>
          </div>
        ) : null}

        <nav aria-label="Admin sections" className="container-site overflow-x-auto">
          <ul className="flex gap-1 whitespace-nowrap py-2 text-sm font-medium">
            {TABS.map((tab) => {
              const active = isActivePath(pathname, tab.href);
              return (
                <li key={tab.href}>
                  <Link
                    href={tab.href}
                    aria-current={active ? "page" : undefined}
                    className={clsx(
                      "inline-block rounded-full px-4 py-2 motion-safe:transition-colors",
                      active ? "bg-calc-blue text-white" : "text-ink hover:bg-bg-soft",
                    )}
                  >
                    {tab.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </header>

      <main className="container-site py-6">{children}</main>
    </div>
  );
}
