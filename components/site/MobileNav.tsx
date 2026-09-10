"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogIn, X } from "lucide-react";
import clsx from "clsx";
import { ADMIN_LOGIN_HREF, NAV, CONTACT } from "@/content/site";
import { isActivePath } from "@/lib/nav";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

type MobileNavProps = {
  open: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
};

export default function MobileNav({ open, onClose, triggerRef }: MobileNavProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Close on route change.
  useEffect(() => {
    if (open) onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Lock body scroll while open, compensating for the scrollbar so the
  // page doesn't shift width when it disappears.
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
    };
  }, [open]);

  // Move focus into the panel, trap Tab, close on Esc, restore focus on close.
  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    if (!panel) return;

    const focusables = panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    first?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab" || focusables.length === 0) return;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    const trigger = triggerRef.current;
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      trigger?.focus();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

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
          "absolute inset-0 bg-navy/50 motion-safe:transition-opacity motion-safe:duration-300",
          open ? "opacity-100" : "opacity-0",
        )}
      />

      {/* Sheet */}
      <div
        ref={panelRef}
        id="mobile-nav"
        role="dialog"
        aria-modal="true"
        aria-label="Site navigation"
        className={clsx(
          "absolute top-0 right-0 flex h-full w-[85%] max-w-sm flex-col gap-8 bg-white px-6 py-6 shadow-2xl motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-out",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="flex h-10 w-10 items-center justify-center rounded-full text-navy hover:bg-bg-soft"
          >
            <X className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>

        <nav aria-label="Primary">
          <ul className="flex flex-col gap-1">
            {NAV.map((item) => {
              const isActive = isActivePath(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                    className={clsx(
                      "block rounded-lg px-3 py-3 text-lg font-medium hover:bg-bg-soft hover:text-calc-blue",
                      isActive ? "text-calc-blue font-semibold" : "text-navy",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="mt-auto flex flex-col gap-4 border-t border-line pt-6">
          <div className="flex flex-col gap-2 text-sm text-muted">
            <a href={CONTACT.phoneHref} className="hover:text-calc-blue">
              {CONTACT.phone}
            </a>
            <a href={`mailto:${CONTACT.email}`} className="hover:text-calc-blue">
              {CONTACT.email}
            </a>
          </div>

          <Link
            href={ADMIN_LOGIN_HREF}
            className="flex w-fit items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-sm font-medium text-muted hover:border-calc-blue hover:text-calc-blue"
          >
            <LogIn className="h-4 w-4" aria-hidden="true" />
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}
