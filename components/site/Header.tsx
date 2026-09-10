"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import clsx from "clsx";
import { NAV } from "@/content/site";
import MobileNav from "./MobileNav";

export default function Header() {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40 h-[76px] w-full border-b border-line bg-white shadow-sm lg:h-[101px]">
        <div className="mx-auto flex h-full w-full max-w-[1280px] items-center justify-between px-4 md:px-8">
          <Link href="/" className="flex shrink-0 items-center transition-transform hover:scale-[1.04]">
            <Image
              src="/brand/logo.jpg"
              alt="ESG Ratings"
              width={115}
              height={66}
              priority
              className="h-auto w-[115px]"
            />
          </Link>

          <nav aria-label="Primary" className="hidden lg:block">
            <ul className="flex items-center gap-8 text-[17px] font-medium">
              {NAV.map((item) => {
                const isActive =
                  item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={isActive ? "page" : undefined}
                      className="nav-link"
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <button
            ref={triggerRef}
            type="button"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
            className={clsx(
              "flex h-10 w-10 items-center justify-center rounded-full text-navy hover:bg-bg-soft lg:hidden",
            )}
          >
            <Menu className="h-7 w-7" aria-hidden="true" />
          </button>
        </div>
      </header>

      <MobileNav open={open} onClose={() => setOpen(false)} triggerRef={triggerRef} />
    </>
  );
}
