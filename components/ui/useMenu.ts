"use client";

import {
  useEffect,
  useState,
  type FocusEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type RefObject,
} from "react";

const ITEM_SELECTOR = '[role="menuitem"]';

type MenuRefs = {
  /** Wrapper around trigger + panel: presses outside it close the menu. */
  wrapRef: RefObject<HTMLDivElement | null>;
  /** The trigger button: focus returns here on Escape. */
  buttonRef: RefObject<HTMLButtonElement | null>;
  /** The `role="menu"` list whose items carry `role="menuitem"`. */
  menuRef: RefObject<HTMLUListElement | null>;
};

/** Menu-button behaviour shared by the navbar account menu and the admin
 * console's dropdowns: toggle on click, ArrowDown opens, focus lands on the
 * first item, Arrow/Home/End move between items, Escape closes and returns
 * focus to the trigger, and a press outside (or tabbing out) closes it.
 *
 * The component owns the three refs and passes them in; wire them up as
 * `ref={wrapRef} onBlur={onWrapBlur}` on the wrapper, `ref={buttonRef}
 * onClick={toggle} onKeyDown={onButtonKeyDown}` on the trigger, and
 * `ref={menuRef} role="menu" onKeyDown={onMenuKeyDown}` on the list. */
export function useMenu({ wrapRef, buttonRef, menuRef }: MenuRefs) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    menuRef.current?.querySelector<HTMLElement>(ITEM_SELECTOR)?.focus();
    const onPointerDown = (event: PointerEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open, menuRef, wrapRef]);

  const close = (returnFocus: boolean) => {
    setOpen(false);
    if (returnFocus) buttonRef.current?.focus();
  };

  const toggle = () => setOpen((v) => !v);

  const onButtonKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "ArrowDown" && !open) {
      event.preventDefault();
      setOpen(true);
    } else if (event.key === "Escape" && open) {
      event.preventDefault();
      close(true);
    }
  };

  const onMenuKeyDown = (event: ReactKeyboardEvent<HTMLUListElement>) => {
    const items = Array.from(menuRef.current?.querySelectorAll<HTMLElement>(ITEM_SELECTOR) ?? []);
    const index = items.indexOf(document.activeElement as HTMLElement);
    let next: number | null = null;
    if (event.key === "ArrowDown") next = (index + 1) % items.length;
    else if (event.key === "ArrowUp") next = (index - 1 + items.length) % items.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = items.length - 1;
    else if (event.key === "Escape") {
      event.preventDefault();
      close(true);
      return;
    }
    if (next !== null) {
      event.preventDefault();
      items[next]?.focus();
    }
  };

  const onWrapBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (open && !wrapRef.current?.contains(event.relatedTarget as Node | null)) setOpen(false);
  };

  return { open, setOpen, toggle, onButtonKeyDown, onMenuKeyDown, onWrapBlur };
}
