"use client";

import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type FormEvent,
  type ReactNode,
  type RefObject,
} from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowUpRight, ChevronDown, Globe, LogOut, Menu, Plus, Search, X } from "lucide-react";
import clsx from "clsx";
import pkg from "@/package.json";
import { apiFetch, UNAUTHORIZED_EVENT } from "@/lib/api";
import { ADMIN_NAV_GROUPS, ADMIN_PAGES, NEW_ASSESSMENTS, activeAdminHref } from "@/lib/admin-nav";
import { adminLoginHref } from "@/lib/nav";
import { AccountAvatar } from "@/components/ui/Avatar";
import { useDialog } from "@/components/ui/useDialog";
import { useMenu } from "@/components/ui/useMenu";
import { FOCUS_RING } from "./styles";

// The superadmin console chrome (docs/sdd/web-task-admin-redesign-brief.md
// "Layout shell"): a fixed 264px sidebar from lg up, an off-canvas drawer
// below it, and a floating glass-pill top bar with search, "New assessment"
// and the Profile menu. Rendered by admin/(protected)/layout.tsx once the
// server guard has confirmed the session. The signed-in identity appears only
// inside the Profile menu (and as the avatar initial).

const SCROLL_THRESHOLD = 8;
const LG_QUERY = "(min-width: 1024px)";

function subscribeScroll(onChange: () => void) {
  window.addEventListener("scroll", onChange, { passive: true });
  return () => window.removeEventListener("scroll", onChange);
}
const getScrolled = () => window.scrollY > SCROLL_THRESHOLD;
const getServerScrolled = () => false;

const MENU_ITEM =
  "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-medium text-ink/85 outline-none hover:bg-white/80 hover:text-calc-navy focus-visible:bg-white/80 focus-visible:text-calc-navy focus-visible:ring-2 focus-visible:ring-brand/60 disabled:opacity-60";

type AdminShellProps = {
  username: string;
  children: ReactNode;
};

export default function AdminShell({ username, children }: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const active = activeAdminHref(pathname);
  const burgerRef = useRef<HTMLButtonElement>(null);
  const scrolled = useSyncExternalStore(subscribeScroll, getScrolled, getServerScrolled);
  const [loggingOut, setLoggingOut] = useState(false);

  // The drawer closes whenever the route changes.
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerPath, setDrawerPath] = useState(pathname);
  if (drawerPath !== pathname) {
    setDrawerPath(pathname);
    setDrawerOpen(false);
  }

  // Any API call that comes back 401 (lib/api.ts) means the session expired
  // mid-visit: go log in again, then come back to this page.
  useEffect(() => {
    const onUnauthorized = () =>
      router.replace(adminLoginHref(window.location.pathname + window.location.search));
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  }, [router]);

  // A drawer left open while the window grows past lg would keep the page
  // scroll-locked behind the permanent sidebar.
  useEffect(() => {
    if (!drawerOpen) return;
    const mq = window.matchMedia(LG_QUERY);
    const onChange = () => {
      if (mq.matches) setDrawerOpen(false);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [drawerOpen]);

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
    <div className="min-h-screen bg-[#f4f6fa] text-ink">
      <a
        href="#admin-main"
        className={clsx(
          "sr-only rounded-lg bg-white px-3 py-2 text-sm font-medium text-ink shadow-lg focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60]",
          FOCUS_RING,
        )}
      >
        Skip to content
      </a>

      <aside
        aria-label="Sidebar"
        className="fixed inset-y-0 left-0 z-40 hidden w-[264px] flex-col border-r border-line bg-white lg:flex"
      >
        <div className="flex h-[76px] shrink-0 items-center px-4">
          <BrandLink />
        </div>
        <SidebarNav active={active} idPrefix="sidebar" />
        <SidebarFooter />
      </aside>

      <AdminDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        triggerRef={burgerRef}
        active={active}
      />

      <div className="relative lg:pl-[264px]">
        {/* Faint brand glow at the top so the glass bar has something to frost. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-[480px] bg-[radial-gradient(70%_100%_at_50%_0%,rgba(49,71,255,0.10)_0%,rgba(49,71,255,0.04)_45%,rgba(49,71,255,0)_75%)]"
        />
        <div className="relative mx-auto w-full max-w-[1360px] px-3 sm:px-6 lg:px-8">
          <header
            data-scrolled={scrolled}
            className="glass-pill sticky top-3 z-30 mt-3 flex h-[60px] items-center gap-1.5 pr-2 pl-2 sm:gap-3 sm:pl-3"
          >
            <button
              ref={burgerRef}
              type="button"
              aria-controls="admin-drawer"
              aria-expanded={drawerOpen}
              aria-label="Open menu"
              onClick={() => setDrawerOpen(true)}
              className={clsx(
                "grid h-10 w-10 shrink-0 place-items-center rounded-full text-calc-navy hover:bg-white/80 motion-safe:transition-colors lg:hidden",
                FOCUS_RING,
              )}
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </button>
            <BrandLink compact className="lg:hidden" />
            <TopSearch shortcut className="hidden min-w-0 flex-1 md:block md:max-w-md" />
            <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
              <NewAssessmentMenu />
              <ProfileMenu username={username} onLogout={handleLogout} loggingOut={loggingOut} />
            </div>
          </header>

          <main id="admin-main" tabIndex={-1} className="pt-6 pb-12 outline-none sm:pt-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

/** Logo tile + "ESG Ratings" — always a link back to the public landing page. */
function BrandLink({
  compact = false,
  className,
  onNavigate,
}: {
  compact?: boolean;
  className?: string;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href="/"
      aria-label="Go to website home"
      onClick={onNavigate}
      className={clsx(
        "group flex min-w-0 items-center gap-3 rounded-xl p-1 motion-safe:transition-colors",
        compact ? "hover:bg-white/70" : "hover:bg-slate-50",
        FOCUS_RING,
        className,
      )}
    >
      <span className="grid h-10 shrink-0 place-items-center rounded-lg bg-white px-1.5 shadow-[0_1px_2px_rgba(11,28,57,0.06)] ring-1 ring-line motion-safe:transition-transform motion-safe:group-hover:scale-[1.04]">
        <Image
          src="/brand/logo.jpg"
          alt=""
          width={576}
          height={330}
          priority={!compact}
          className="h-7 w-auto"
        />
      </span>
      {compact ? null : (
        <span className="min-w-0 leading-tight">
          <span className="block truncate text-[15px] font-semibold text-ink">ESG Ratings</span>
          <span className="block truncate text-xs text-muted">Superadmin console</span>
        </span>
      )}
    </Link>
  );
}

function SidebarNav({
  active,
  idPrefix,
  onNavigate,
}: {
  active: string | null;
  idPrefix: string;
  onNavigate?: () => void;
}) {
  return (
    <nav aria-label="Admin" className="min-h-0 flex-1 overflow-y-auto px-3 pb-4">
      {ADMIN_NAV_GROUPS.map((group) => {
        const labelId = `${idPrefix}-${group.label.toLowerCase().replace(/\s+/g, "-")}`;
        return (
          <div key={group.label} className="pt-5 first:pt-2">
            <p
              id={labelId}
              className="px-3 pb-1.5 text-[11px] font-semibold tracking-[0.08em] text-slate-400 uppercase"
            >
              {group.label}
            </p>
            <ul aria-labelledby={labelId} className="flex flex-col gap-0.5">
              {group.items.map(({ label, href, icon: Icon }) => {
                const isActive = href === active;
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      onClick={onNavigate}
                      aria-current={isActive ? "page" : undefined}
                      className={clsx(
                        "group flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium motion-safe:transition-colors",
                        FOCUS_RING,
                        isActive
                          ? "bg-brand/8 text-brand"
                          : "text-ink/75 hover:bg-slate-50 hover:text-ink",
                      )}
                    >
                      <Icon
                        aria-hidden="true"
                        strokeWidth={1.9}
                        className={clsx(
                          "h-[18px] w-[18px] shrink-0",
                          isActive ? "text-brand" : "text-slate-400 group-hover:text-slate-600",
                        )}
                      />
                      <span className="truncate">{label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}

function SidebarFooter({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="shrink-0 border-t border-line px-5 py-4">
      <Link
        href="/"
        onClick={onNavigate}
        className={clsx(
          "inline-flex items-center gap-1.5 rounded text-sm font-medium text-ink/75 hover:text-brand motion-safe:transition-colors",
          FOCUS_RING,
        )}
      >
        View website
        <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
      </Link>
      <p className="mt-1 font-mono text-[11px] text-slate-400">v{pkg.version}</p>
    </div>
  );
}

/** Below lg the sidebar lives in an off-canvas drawer (focus trap, Esc,
 * scroll lock, focus back to the hamburger — via useDialog). */
function AdminDrawer({
  open,
  onClose,
  triggerRef,
  active,
}: {
  open: boolean;
  onClose: () => void;
  triggerRef: RefObject<HTMLButtonElement | null>;
  active: string | null;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
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
      <div
        ref={panelRef}
        id="admin-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Admin navigation"
        className={clsx(
          "absolute inset-y-0 left-0 flex w-[min(300px,85vw)] flex-col bg-white shadow-[0_20px_60px_rgba(11,28,57,0.25)] motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-out",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-[72px] shrink-0 items-center justify-between gap-2 pr-3 pl-3">
          <BrandLink onNavigate={onClose} />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className={clsx(
              "grid h-10 w-10 shrink-0 place-items-center rounded-full text-ink hover:bg-slate-100 motion-safe:transition-colors",
              FOCUS_RING,
            )}
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <div className="px-4 pb-1">
          <TopSearch onSubmitted={onClose} />
        </div>
        <SidebarNav active={active} idPrefix="drawer" onNavigate={onClose} />
        <SidebarFooter onNavigate={onClose} />
      </div>
    </div>
  );
}

/** Submission search: Enter goes to `/admin/esg?search=…`. The top-bar copy
 * also answers ⌘K / Ctrl+K. */
function TopSearch({
  shortcut = false,
  className,
  onSubmitted,
}: {
  shortcut?: boolean;
  className?: string;
  onSubmitted?: () => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!shortcut) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [shortcut]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const term = query.trim();
    router.push(term ? `/admin/esg?search=${encodeURIComponent(term)}` : "/admin/esg");
    onSubmitted?.();
  }

  return (
    <form role="search" onSubmit={submit} className={clsx("relative", className)}>
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-muted"
      />
      <input
        ref={inputRef}
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Search ESG submissions"
        placeholder="Search submissions…"
        enterKeyHint="search"
        className={clsx(
          "h-10 w-full rounded-full border border-calc-navy/10 bg-white/60 pr-12 pl-10 text-sm text-ink placeholder:text-muted hover:bg-white/85 focus:bg-white motion-safe:transition-colors [&::-webkit-search-cancel-button]:hidden",
          FOCUS_RING,
        )}
      />
      {shortcut && !query ? (
        <kbd className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 rounded-md border border-line bg-white/80 px-1.5 py-0.5 font-mono text-[10px] text-muted">
          ⌘K
        </kbd>
      ) : null}
    </form>
  );
}

function NewAssessmentMenu() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const menu = useMenu({ wrapRef, buttonRef, menuRef });
  return (
    <div ref={wrapRef} className="relative" onBlur={menu.onWrapBlur}>
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={menu.open}
        onClick={menu.toggle}
        onKeyDown={menu.onButtonKeyDown}
        className={clsx(
          "flex h-10 items-center gap-1.5 rounded-full bg-calc-navy pr-2.5 pl-3 text-sm font-medium text-white shadow-[0_4px_14px_rgba(11,28,57,0.22)] hover:bg-calc-navy-hover motion-safe:transition-colors sm:pr-3 sm:pl-3.5",
          FOCUS_RING,
        )}
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
        <span className="sr-only sm:not-sr-only">New assessment</span>
        <ChevronDown
          aria-hidden="true"
          className={clsx(
            "h-4 w-4 opacity-70 motion-safe:transition-transform motion-safe:duration-200",
            menu.open && "rotate-180",
          )}
        />
      </button>
      {menu.open ? (
        <div className="glass-panel glass-pop absolute top-full right-0 mt-3 w-60 rounded-2xl p-2">
          <ul
            ref={menuRef}
            role="menu"
            aria-label="New assessment"
            onKeyDown={menu.onMenuKeyDown}
            className="flex flex-col gap-0.5"
          >
            {NEW_ASSESSMENTS.map(({ label, href, icon: Icon }) => (
              <li key={href} role="none">
                <Link
                  href={href}
                  role="menuitem"
                  onClick={() => menu.setOpen(false)}
                  className={MENU_ITEM}
                >
                  <Icon className="h-4 w-4 text-brand" aria-hidden="true" />
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function ProfileMenu({
  username,
  onLogout,
  loggingOut,
}: {
  username: string;
  onLogout: () => void;
  loggingOut: boolean;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const menu = useMenu({ wrapRef, buttonRef, menuRef });
  return (
    <div ref={wrapRef} className="relative" onBlur={menu.onWrapBlur}>
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={menu.open}
        onClick={menu.toggle}
        onKeyDown={menu.onButtonKeyDown}
        className={clsx(
          "flex h-10 items-center gap-2 rounded-full border border-calc-navy/10 bg-white/60 py-1 pr-2 pl-1 hover:bg-white/90 motion-safe:transition-colors sm:pr-3",
          menu.open && "bg-white/90",
          FOCUS_RING,
        )}
      >
        <AccountAvatar name={username} />
        <span className="sr-only text-sm font-medium text-ink sm:not-sr-only">Profile</span>
        <ChevronDown
          aria-hidden="true"
          className={clsx(
            "h-4 w-4 text-ink/60 motion-safe:transition-transform motion-safe:duration-200",
            menu.open && "rotate-180",
          )}
        />
      </button>
      {menu.open ? (
        <div className="glass-panel glass-pop absolute top-full right-0 mt-3 w-64 rounded-2xl p-2">
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
            role="menu"
            aria-label="Profile"
            onKeyDown={menu.onMenuKeyDown}
            className="flex flex-col gap-0.5"
          >
            {ADMIN_PAGES.map(({ label, href, icon: Icon }) => (
              <li key={href} role="none">
                <Link
                  href={href}
                  role="menuitem"
                  onClick={() => menu.setOpen(false)}
                  className={MENU_ITEM}
                >
                  <Icon className="h-4 w-4 text-brand" aria-hidden="true" />
                  {label}
                </Link>
              </li>
            ))}
            <li role="none">
              <Link href="/" role="menuitem" onClick={() => menu.setOpen(false)} className={MENU_ITEM}>
                <Globe className="h-4 w-4 text-brand" aria-hidden="true" />
                View website
              </Link>
            </li>
            <li role="separator" className="mx-2 my-1 h-px bg-calc-navy/10" />
            <li role="none">
              <button
                type="button"
                role="menuitem"
                disabled={loggingOut}
                onClick={() => {
                  menu.setOpen(false);
                  onLogout();
                }}
                className={clsx(MENU_ITEM, "text-grade-d hover:text-grade-d focus-visible:text-grade-d")}
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                {loggingOut ? "Logging out…" : "Log out"}
              </button>
            </li>
          </ul>
        </div>
      ) : null}
    </div>
  );
}
