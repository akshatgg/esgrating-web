// Shared class strings for the superadmin console (docs/sdd/web-task-admin-redesign-brief.md
// "Visual tokens"). Plain strings so Tailwind's source scan picks them up.

/** 2px brand focus ring with offset, keyboard focus only. */
export const FOCUS_RING =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

/** Same ring drawn inside the element — for full-bleed rows in clipped cards. */
export const FOCUS_RING_INSET =
  "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand";

/** White card: hairline border, 2xl radius, barely-there shadow. */
export const CARD =
  "rounded-2xl border border-line bg-white shadow-[0_1px_2px_rgba(11,28,57,0.04)]";

/** Small square icon button used in table rows and toolbars. */
export const ICON_BUTTON =
  "grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted hover:bg-slate-100 hover:text-ink motion-safe:transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

/** Destructive variant of ICON_BUTTON (row delete). */
export const ICON_BUTTON_DANGER =
  "grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted hover:bg-red-50 hover:text-red-600 motion-safe:transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

/** Compact console text input (search boxes, toolbars). */
export const INPUT =
  "h-10 w-full rounded-[10px] border border-field bg-white px-3 text-sm text-ink placeholder:text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";
