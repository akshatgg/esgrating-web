import type { ReactNode } from "react";

/** A titled group of fields in an admin form card: heading, optional one-line
 * description, then a 2-column grid (1 column on phones). Sections are
 * separated by hairlines. */
export function FormSection({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section
      aria-labelledby={id}
      className="border-t border-line px-5 py-5 first:border-t-0 sm:px-6"
    >
      <h2 id={id} className="text-[15px] font-semibold text-ink">
        {title}
      </h2>
      {description ? <p className="mt-0.5 text-[13px] text-muted">{description}</p> : null}
      <div className="mt-4 grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

/** Cancel / Submit bar pinned to the bottom of the viewport while the form
 * is taller than the screen. Keep the form card free of `overflow-hidden`,
 * which would stop it sticking. */
export function FormFooter({ children }: { children: ReactNode }) {
  return (
    <div className="sticky bottom-0 z-10 flex flex-col-reverse gap-2 rounded-b-2xl border-t border-line bg-white/90 px-5 py-3 backdrop-blur-md sm:flex-row sm:items-center sm:justify-end sm:px-6">
      {children}
    </div>
  );
}
