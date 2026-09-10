"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, LogIn, LogOut } from "lucide-react";
import clsx from "clsx";
import { ADMIN_LOGIN_HREF } from "@/content/site";
import { apiFetch } from "@/lib/api";
import { ADMIN_PAGES, type AdminNavItem } from "@/lib/admin-nav";
import { AccountAvatar } from "@/components/ui/Avatar";
import { useMenu } from "@/components/ui/useMenu";

export { AccountAvatar };

/** The superadmin console's pages, as listed in the navbar account menu. */
export const ACCOUNT_LINKS: AdminNavItem[] = ADMIN_PAGES;

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

const FOCUS_RING = "outline-none focus-visible:ring-2 focus-visible:ring-calc-blue/60";

/** Right-hand slot of the navbar pill: a same-size placeholder while the
 * session is being checked, the "Login" ghost pill when logged out, and an
 * avatar button + glass account menu when a superadmin is signed in. */
export default function AccountMenu({ session }: { session: AdminSession }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const menu = useMenu({ wrapRef, buttonRef, menuRef });
  const menuId = useId();

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

  return (
    <div
      ref={wrapRef}
      className="relative hidden lg:block"
      // Tab past the last item (or anywhere outside) closes the menu.
      onBlur={menu.onWrapBlur}
    >
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={menu.open}
        aria-label={`Account menu for ${username}`}
        onClick={menu.toggle}
        onKeyDown={menu.onButtonKeyDown}
        className={clsx(
          "flex h-10 items-center gap-1.5 rounded-full border border-calc-navy/10 bg-white/50 py-1 pr-2 pl-1 hover:bg-white/90 motion-safe:transition-colors sm:gap-2 sm:pr-3",
          menu.open && "bg-white/90",
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
            menu.open && "rotate-180",
          )}
        />
      </button>

      {menu.open && (
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
            onKeyDown={menu.onMenuKeyDown}
            className="flex flex-col gap-0.5"
          >
            {ACCOUNT_LINKS.map(({ label, href, icon: Icon }) => (
              <li key={href} role="none">
                <Link
                  href={href}
                  role="menuitem"
                  onClick={() => menu.setOpen(false)}
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
                  menu.setOpen(false);
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
