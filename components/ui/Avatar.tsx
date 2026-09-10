import clsx from "clsx";

/** Initial-letter avatar circle for the signed-in superadmin — used by the
 * public navbar account menu and the admin console's Profile dropdown. */
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
