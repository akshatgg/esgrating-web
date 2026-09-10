"use client";

import { useLayoutEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import clsx from "clsx";
import { NAV } from "@/content/site";
import { isActivePath } from "@/lib/nav";
import { useScrolled } from "@/lib/useScrolled";
import AccountMenu, { useAdminSession } from "./AccountMenu";
import MobileNav from "./MobileNav";

export default function Header() {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const navWrapRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);
  const placedRef = useRef(false);
  const pathname = usePathname();
  const scrolled = useScrolled();
  const session = useAdminSession();

  // Slide a navy highlight under the active link. Until it has been measured
  // (SSR, first paint) the active link paints its own navy background.
  useLayoutEffect(() => {
    const wrap = navWrapRef.current;
    const indicator = indicatorRef.current;
    if (!wrap || !indicator) return;

    const place = () => {
      const active = wrap.querySelector<HTMLElement>('a[aria-current="page"]');
      if (!active || active.offsetParent === null) {
        indicator.style.opacity = "0";
        wrap.dataset.indicator = "off";
        return;
      }
      const wrapRect = wrap.getBoundingClientRect();
      const activeRect = active.getBoundingClientRect();
      const first = !placedRef.current;
      if (first) indicator.style.transition = "none";
      indicator.style.width = `${activeRect.width}px`;
      indicator.style.transform = `translateX(${activeRect.left - wrapRect.left}px)`;
      indicator.style.opacity = "1";
      wrap.dataset.indicator = "on";
      if (first) {
        void indicator.offsetWidth; // commit the un-animated position
        indicator.style.transition = "";
        placedRef.current = true;
      }
    };

    place();
    const observer = new ResizeObserver(place);
    observer.observe(wrap);
    return () => observer.disconnect();
  }, [pathname]);

  return (
    <>
      <header
        data-scrolled={scrolled}
        className="glass-pill fixed inset-x-0 top-3 z-40 mx-auto flex h-14 w-[min(1200px,calc(100%-24px))] items-center gap-4 pr-2 pl-4 md:top-4 lg:h-16 lg:pr-3 lg:pl-6"
      >
        <div className="flex flex-1 items-center">
          <Link
            href="/"
            className="flex shrink-0 items-center rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-calc-blue/60 motion-safe:transition-transform motion-safe:hover:scale-[1.04]"
          >
            <Image
              src="/brand/logo.jpg"
              alt="ESG Ratings"
              width={115}
              height={66}
              priority
              className="h-9 w-auto rounded-md lg:h-10"
            />
          </Link>
        </div>

        <nav aria-label="Primary" className="hidden lg:block">
          <div ref={navWrapRef} className="group relative">
            <span
              ref={indicatorRef}
              aria-hidden="true"
              className="pointer-events-none absolute top-0 left-0 h-full rounded-full bg-calc-navy opacity-0 shadow-[0_4px_14px_rgba(11,28,57,0.25)] motion-safe:transition-[transform,width,opacity] motion-safe:duration-300 motion-safe:ease-out"
            />
            <ul className="flex items-center gap-1 text-[15px] font-medium">
              {NAV.map((item) => {
                const isActive = isActivePath(pathname, item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={isActive ? "page" : undefined}
                      className={clsx(
                        "relative block rounded-full px-4 py-2 whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-calc-blue/60 motion-safe:transition-colors motion-safe:duration-200",
                        isActive
                          ? "bg-calc-navy text-white group-data-[indicator=on]:bg-transparent"
                          : "text-ink/80 hover:bg-white/80 hover:text-ink",
                      )}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>

        <div className="flex flex-1 items-center justify-end gap-1.5">
          <AccountMenu session={session} />

          <button
            ref={triggerRef}
            type="button"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
            className="flex h-10 w-10 items-center justify-center rounded-full text-calc-navy outline-none hover:bg-white/80 focus-visible:ring-2 focus-visible:ring-calc-blue/60 motion-safe:transition-colors lg:hidden"
          >
            <Menu className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>
      </header>

      <MobileNav
        open={open}
        onClose={() => setOpen(false)}
        triggerRef={triggerRef}
        session={session}
      />
    </>
  );
}
