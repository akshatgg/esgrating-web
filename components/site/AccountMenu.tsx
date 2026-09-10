"use client";

import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  FileCheck2,
  Landmark,
  LayoutDashboard,
  ListOrdered,
  LogIn,
  LogOut,
  MessageSquare,
  type LucideIcon,
} from "lucide-react";
import clsx from "clsx";
import { ADMIN_LOGIN_HREF } from "@/content/site";
import { apiFetch } from "@/lib/api";

export const ACCOUNT_LINKS: { label: string; href: string; icon: LucideIcon }[] = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "ESG Submissions", href: "/admin/esg", icon: FileCheck2 },
  { label: "BFSI Submissions", href: "/admin/bfsi", icon: Landmark },
  { label: "ESG Rating List", href: "/admin/ratings", icon: ListOrdered },
  { label: "Messages", href: "/admin/messages", icon: MessageSquare },
];

export type AdminSession = {
  status: "checking" | "anonymous" | "authenticated";
  username: string | null;
  logout: () => Promise<void>;
};

/** Client-side superadmin session probe for the public site chrome. Never
 * blocks rendering: starts as "checking", then resolves from `/auth/session`
 * (a same-origin wrapper around `/api/auth/me` that answers 200 either way,
 * so logged-out visitors don't get a 401 console error on every page). */
export function useAdminSession(): AdminSession {
  const router = useRouter();
  const [state, setState] = useState<Omit<AdminSession, "logout">>({
    status: "checking",
    username: null,
  });

  useEffect(() => {
    let cancelled = false;
    apiFetch<{ authenticated?: boolean; username?: string | null }>("/auth/session")
      .then((me) => {
        if (cancelled) return;
        setState(
          me?.authenticated
            ? { status: "authenticated", username: me.username ?? "admin" }
            : { status: "anonymous", username: null },
        );
      })
      .catch(() => {
        if (!cancelled) setState({ status: "anonymous", username: null });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Already expired or unreachable — fall back to the logged-out chrome anyway.
    }
    setState({ status: "anonymous", username: null });
    router.refresh();
  }, [router]);

  return { ...state, logout };
}

export function AccountAvatar({ name, className }: { name: string; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={clsx(
        "grid h-8 w-8 shrink-0 place-items-center rounded-full bg-linear-to-br from-calc-blue to-calc-navy text-sm font-semibold text-white uppercase shadow-[inset_0_0_0_1px_rgba(255,255,255,0.25)]",
        className,
      )}
    >
      {name.trim().charAt(0) || "A"}
    </span>
  );
}

const FOCUS_RING = "outline-none focus-visible:ring-2 focus-visible:ring-calc-blue/60";

/** Right-hand slot of the navbar pill: a same-size placeholder while the
 * session is being checked, the "Login" ghost pill when logged out, and an
 * avatar button + glass account menu when a superadmin is signed in. */
export default function AccountMenu({ session }: { session: AdminSession }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const menuId = useId();

  const menuItems = () =>
    Array.from(menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []);

  // On open: focus the first item and close on any outside press.
  useEffect(() => {
    if (!open) return;
    menuItems()[0]?.focus();
    const onPointerDown = (event: PointerEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  if (session.status === "checking") {
    return (
      <span
        aria-hidden="true"
        className="hidden h-9 w-[84px] rounded-full bg-calc-navy/5 lg:inline-block"
      />
    );
  }

  if (session.status === "anonymous") {
    return (
      <Link
        href={ADMIN_LOGIN_HREF}
        className={clsx(
          "hidden items-center gap-1.5 rounded-full border border-calc-navy/15 bg-white/40 px-3.5 py-1.5 text-sm font-medium text-ink/80 hover:border-calc-navy/30 hover:bg-white/90 hover:text-calc-navy motion-safe:transition-colors lg:inline-flex",
          FOCUS_RING,
        )}
      >
        <LogIn className="h-4 w-4" aria-hidden="true" />
        Login
      </Link>
    );
  }

  const username = session.username ?? "admin";

  const close = (returnFocus: boolean) => {
    setOpen(false);
    if (returnFocus) buttonRef.current?.focus();
  };

  const onMenuKeyDown = (event: KeyboardEvent<HTMLUListElement>) => {
    const items = menuItems();
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

  return (
    <div
      ref={wrapRef}
      className="relative"
      onBlur={(event) => {
        // Tab past the last item (or anywhere outside) closes the menu.
        if (open && !wrapRef.current?.contains(event.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Account menu for ${username}`}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" && !open) {
            event.preventDefault();
            setOpen(true);
          } else if (event.key === "Escape" && open) {
            event.preventDefault();
            close(true);
          }
        }}
        className={clsx(
          "flex h-10 items-center gap-1.5 rounded-full border border-calc-navy/10 bg-white/50 py-1 pr-2 pl-1 hover:bg-white/90 motion-safe:transition-colors sm:gap-2 sm:pr-3",
          open && "bg-white/90",
          FOCUS_RING,
        )}
      >
        <AccountAvatar name={username} />
        <span className="hidden max-w-[9rem] truncate text-sm font-medium text-ink sm:inline">
          {username}
        </span>
        <ChevronDown
          aria-hidden="true"
          className={clsx(
            "h-4 w-4 text-ink/60 motion-safe:transition-transform motion-safe:duration-200",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div className="glass-panel glass-pop absolute top-full right-0 mt-3 w-64 rounded-2xl p-2 lg:mt-4">
          <div className="flex items-center gap-3 px-3 py-2.5">
            <AccountAvatar name={username} className="h-9 w-9" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink">{username}</p>
              <p className="text-xs text-muted">Superadmin</p>
            </div>
          </div>
          <div className="mx-2 my-1 h-px bg-calc-navy/10" />
          <ul
            ref={menuRef}
            id={menuId}
            role="menu"
            aria-label="Account"
            onKeyDown={onMenuKeyDown}
            className="flex flex-col gap-0.5"
          >
            {ACCOUNT_LINKS.map(({ label, href, icon: Icon }) => (
              <li key={href} role="none">
                <Link
                  href={href}
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-ink/85 outline-none hover:bg-white/80 hover:text-calc-navy focus-visible:bg-white/80 focus-visible:text-calc-navy focus-visible:ring-2 focus-visible:ring-calc-blue/60"
                >
                  <Icon className="h-4 w-4 text-calc-blue" aria-hidden="true" />
                  {label}
                </Link>
              </li>
            ))}
            <li role="separator" className="mx-2 my-1 h-px bg-calc-navy/10" />
            <li role="none">
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  void session.logout();
                }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-medium text-grade-d outline-none hover:bg-white/80 focus-visible:bg-white/80 focus-visible:ring-2 focus-visible:ring-calc-blue/60"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Log out
              </button>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
