import type { ButtonHTMLAttributes, ReactNode } from "react";
import Link from "next/link";
import clsx from "clsx";

export type ButtonVariant = "primary" | "calcNavy" | "calcBlue" | "outline";

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: "bg-brand text-white",
  calcNavy: "cta-sweep bg-calc-navy text-white hover:bg-calc-navy-hover",
  calcBlue: "cta-sweep bg-calc-blue text-white",
  outline: "border border-line bg-white text-ink hover:border-calc-blue",
};

const BASE_CLASSES =
  "inline-flex items-center justify-center gap-2 rounded-[28px] px-6 py-3 font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

type CommonProps = {
  variant?: ButtonVariant;
  className?: string;
  children: ReactNode;
};

type LinkButtonProps = CommonProps & {
  href: string;
};

type ClickButtonProps = CommonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children">;

export type ButtonProps = LinkButtonProps | ClickButtonProps;

export default function Button(props: ButtonProps) {
  const { variant = "primary", className, children, ...rest } = props;
  const classes = clsx(BASE_CLASSES, VARIANT_CLASSES[variant], className);

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
