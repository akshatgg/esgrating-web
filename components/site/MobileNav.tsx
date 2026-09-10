"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogIn, LogOut, X } from "lucide-react";
import clsx from "clsx";
import { ADMIN_LOGIN_HREF, NAV, CONTACT } from "@/content/site";
import { isActivePath } from "@/lib/nav";
import { useDialog } from "@/components/ui/useDialog";
import { ACCOUNT_LINKS, AccountAvatar, type AdminSession } from "./AccountMenu";

type MobileNavProps = {
  open: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  session: AdminSession;
};

export default function MobileNav({ open, onClose, triggerRef, session }: MobileNavProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Close on route change.
  useEffect(() => {
    if (open) onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Lock body scroll, move focus into the panel, trap Tab, close on Esc and
  // return focus to the hamburger on close.
  useDialog({ open, panelRef, onClose, returnFocusRef: triggerRef });

  return (
    <div
      className={clsx(
        "fixed inset-0 z-50 lg:hidden",
        open ? "pointer-events-auto" : "pointer-events-none",
      )}
      aria-hidden={!open}
      inert={!open}
    >
      {/* Overlay */}
      <button
        type="button"
        aria-label="Close menu"
        tabIndex={-1}
        onClick={onClose}
        className={clsx(
          "absolute inset-0 bg-navy/40 backdrop-blur-[2px] motion-safe:transition-opacity motion-safe:duration-300",
          open ? "opacity-100" : "opacity-0",
        )}
      />

      {/* Sheet — a glass card that drops from the navbar pill, with its close
          button sitting exactly where the hamburger was. */}
      <div
        ref={panelRef}
        id="mobile-nav"
        role="dialog"
        aria-modal="true"
        aria-label="Site navigation"
        className={clsx(
          "glass-panel absolute top-3 right-3 left-3 flex max-h-[calc(100dvh-24px)] origin-top-right flex-col rounded-3xl sm:left-auto sm:w-[380px] md:top-4 motion-safe:transition-[opacity,transform] motion-safe:duration-300 motion-safe:ease-out",
          open ? "translate-y-0 scale-100 opacity-100" : "-translate-y-2 scale-[0.98] opacity-0",
        )}
      >
        {/* Scroll inside an inner wrapper so the ::before glass layer stays put. */}
        <div className="flex min-h-0 flex-col gap-3 overflow-y-auto rounded-[inherit] p-2">
          <div className="flex h-10 items-center justify-between pl-2">
            <Image
              src="/brand/logo.jpg"
              alt="ESG Ratings"
              width={115}
              height={66}
              className="h-9 w-auto rounded-md"
            />
            <button
              type="button"
              onClick={onClose}
              aria-label="Close menu"
              className="flex h-10 w-10 items-center justify-center rounded-full text-calc-navy outline-none hover:bg-white/80 focus-visible:ring-2 focus-visible:ring-calc-blue/60"
            >
              <X className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>

          <nav aria-label="Primary" className="px-1">
            <ul className="flex flex-col gap-1">
              {NAV.map((item) => {
                const isActive = isActivePath(pathname, item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={isActive ? "page" : undefined}
                      className={clsx(
                        "block rounded-2xl px-4 py-3 text-base font-medium outline-none focus-visible:ring-2 focus-visible:ring-calc-blue/60 motion-safe:transition-colors",
                        isActive
                          ? "bg-calc-navy text-white shadow-[0_4px_14px_rgba(11,28,57,0.25)]"
                          : "text-ink hover:bg-white/80 hover:text-calc-navy",
                      )}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="mx-1 mb-1 flex flex-col gap-4 rounded-2xl bg-white/55 px-4 py-4">
            <div className="flex flex-col gap-2 text-sm text-muted">
              <a href={CONTACT.phoneHref} className="w-fit hover:text-calc-blue">
                {CONTACT.phone}
              </a>
              <a href={`mailto:${CONTACT.email}`} className="w-fit hover:text-calc-blue">
                {CONTACT.email}
              </a>
            </div>

            {session.status === "authenticated" ? (
              <div className="flex flex-col gap-2 border-t border-calc-navy/10 pt-4">
                <div className="flex items-center gap-3 pb-1">
                  <AccountAvatar name={session.username ?? "admin"} className="h-9 w-9" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">
                      {session.username ?? "admin"}
                    </p>
                    <p className="text-xs text-muted">Superadmin</p>
                  </div>
                </div>
                <ul className="flex flex-col gap-0.5">
                  {ACCOUNT_LINKS.map(({ label, href, icon: Icon }) => (
                    <li key={href}>
                      <Link
                        href={href}
                        className="-mx-2 flex items-center gap-3 rounded-xl px-2 py-2 text-sm font-medium text-ink/85 outline-none hover:bg-white/80 hover:text-calc-navy focus-visible:ring-2 focus-visible:ring-calc-blue/60"
                      >
                        <Icon className="h-4 w-4 text-calc-blue" aria-hidden="true" />
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    void session.logout();
                  }}
                  className="flex w-fit items-center gap-1.5 rounded-full border border-grade-d/25 bg-white/60 px-3.5 py-1.5 text-sm font-medium text-grade-d outline-none hover:bg-white focus-visible:ring-2 focus-visible:ring-calc-blue/60 motion-safe:transition-colors"
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  Log out
                </button>
              </div>
            ) : session.status === "anonymous" ? (
              <Link
                href={ADMIN_LOGIN_HREF}
                className="flex w-fit items-center gap-1.5 rounded-full border border-calc-navy/15 bg-white/60 px-3.5 py-1.5 text-sm font-medium text-ink/80 outline-none hover:border-calc-navy/30 hover:bg-white hover:text-calc-navy focus-visible:ring-2 focus-visible:ring-calc-blue/60 motion-safe:transition-colors"
              >
                <LogIn className="h-4 w-4" aria-hidden="true" />
                Login
              </Link>
            ) : (
              <span aria-hidden="true" className="h-[34px] w-[84px] rounded-full bg-calc-navy/5" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
