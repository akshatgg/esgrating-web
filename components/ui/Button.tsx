import type { ButtonHTMLAttributes, ReactNode } from "react";
import Link from "next/link";
import clsx from "clsx";

export type ButtonVariant =
  | "primary"
  | "calcNavy"
  | "calcBlue"
  | "outline"
  | "adminPrimary"
  | "adminSecondary"
  | "adminGhost"
  | "adminDanger";

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: "bg-brand text-white",
  calcNavy: "cta-sweep bg-calc-navy text-white hover:bg-calc-navy-hover",
  calcBlue: "cta-sweep bg-calc-blue text-white",
  outline: "border border-line bg-white text-ink hover:border-calc-blue",
  // Superadmin console (docs/sdd/web-task-admin-redesign-brief.md "Visual tokens").
  adminPrimary:
    "bg-calc-navy text-white shadow-[0_1px_2px_rgba(11,28,57,0.12)] hover:bg-calc-navy-hover",
  adminSecondary: "border border-line bg-white text-ink hover:border-field hover:bg-slate-50",
  adminGhost: "text-ink hover:bg-slate-100",
  adminDanger: "bg-grade-d text-white hover:bg-grade-d/90",
};

const BASE_CLASSES =
  "inline-flex items-center justify-center gap-2 rounded-[28px] px-6 py-3 font-medium motion-safe:transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

/** Admin buttons: 10px radius, fixed heights, no pill shape. */
const ADMIN_BASE_CLASSES =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[10px] font-medium motion-safe:transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-60";

const ADMIN_SIZE_CLASSES = {
  sm: "h-8 px-3 text-[13px]",
  md: "h-10 px-4 text-sm",
};

type CommonProps = {
  variant?: ButtonVariant;
  /** Admin variants only. */
  size?: "sm" | "md";
  className?: string;
  children: ReactNode;
};

type LinkButtonProps = CommonProps & {
  href: string;
};

type ClickButtonProps = CommonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children">;

export type ButtonProps = LinkButtonProps | ClickButtonProps;

/** The class string a `<Button>` would get — for elements Button can't be,
 * like a plain `<a>` to an API file download (a Next `<Link>` would try a
 * client-side navigation first). */
export function buttonClasses(
  variant: ButtonVariant = "primary",
  size: "sm" | "md" = "md",
  className?: string,
): string {
  const isAdmin = variant.startsWith("admin");
  return clsx(
    isAdmin ? [ADMIN_BASE_CLASSES, ADMIN_SIZE_CLASSES[size]] : BASE_CLASSES,
    VARIANT_CLASSES[variant],
    className,
  );
}

export default function Button(props: ButtonProps) {
  const { variant = "primary", size = "md", className, children, ...rest } = props;
  const classes = buttonClasses(variant, size, className);

  if ("href" in rest && rest.href) {
    return (
      <Link href={rest.href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" className={classes} {...rest}>
      {children}
    </button>
  );
}
