"use client";

import { useEffect, useRef, type RefObject } from "react";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

type UseDialogOptions = {
  open: boolean;
  /** The dialog panel: focus moves into it and Tab is trapped inside it. */
  panelRef: RefObject<HTMLElement | null>;
  /** Called on Escape. */
  onClose: () => void;
  /** Where focus goes when the dialog closes. Defaults to whatever had focus
   * when it opened (the trigger, in practice). */
  returnFocusRef?: RefObject<HTMLElement | null>;
};

/** Shared modal-dialog behaviour for sheets, drawers and modals: locks body
 * scroll (compensating for the scrollbar so the page doesn't shift), moves
 * focus into the panel, traps Tab, closes on Escape and restores focus on
 * close. Extracted from `components/site/MobileNav.tsx`. */
export function useDialog({ open, panelRef, onClose, returnFocusRef }: UseDialogOptions) {
  // Keep the latest onClose without re-running the focus effect — callers
  // usually pass an inline arrow, and re-running would yank focus back to the
  // first field on every keystroke.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return;
    const body = document.body;
    const previousOverflow = body.style.overflow;
    const previousPaddingRight = body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    body.style.overflow = "hidden";
    if (scrollbarWidth > 0) body.style.paddingRight = `${scrollbarWidth}px`;
    return () => {
      body.style.overflow = previousOverflow;
      body.style.paddingRight = previousPaddingRight;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    if (!panel) return;

    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const returnTarget = returnFocusRef?.current ?? opener;
    const focusables = () =>
      Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
        (el) => el.getClientRects().length > 0,
      );

    (focusables()[0] ?? panel).focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab") return;

      const items = focusables();
      if (items.length === 0) {
        event.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && (active === first || !panel.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || !panel.contains(active))) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      returnTarget?.focus();
    };
  }, [open, panelRef, returnFocusRef]);
}
