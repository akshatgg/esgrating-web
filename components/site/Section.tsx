import type { HTMLAttributes, ReactNode } from "react";
import clsx from "clsx";

type SectionProps = HTMLAttributes<HTMLElement> & {
  children: ReactNode;
  as?: "section" | "div";
};

export default function Section({
  children,
  className,
  as = "section",
  ...rest
}: SectionProps) {
  const Tag = as;
  return (
    <Tag className={clsx("py-12 md:py-16", className)} {...rest}>
      <div className="container-site">{children}</div>
    </Tag>
  );
}
