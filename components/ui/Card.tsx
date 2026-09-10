import type { HTMLAttributes, ReactNode } from "react";
import clsx from "clsx";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  lift?: boolean;
};

export default function Card({
  children,
  className,
  lift = true,
  ...rest
}: CardProps) {
  return (
    <div
      className={clsx(
        "rounded-2xl border border-line bg-white p-6 shadow-[0_10px_30px_rgba(11,28,57,0.08)]",
        lift && "card-lift",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
