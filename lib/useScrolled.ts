import { useSyncExternalStore } from "react";

// Shared by the public site header and the admin top bar: both frost/shadow
// their bar once the page has scrolled past a few pixels.

const SCROLL_THRESHOLD = 8;

export function subscribeScroll(onChange: () => void) {
  window.addEventListener("scroll", onChange, { passive: true });
  return () => window.removeEventListener("scroll", onChange);
}
const getScrolled = () => window.scrollY > SCROLL_THRESHOLD;
const getServerScrolled = () => false;

/** True once the window is scrolled past the threshold; false on the server
 * and on the hydration render. */
export function useScrolled(): boolean {
  return useSyncExternalStore(subscribeScroll, getScrolled, getServerScrolled);
}
