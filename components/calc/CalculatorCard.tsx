import type { HTMLAttributes, ReactNode } from "react";
import clsx from "clsx";

type CalculatorCardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

/**
 * Shared shell for the ESG and BFSI calculator forms: max-width 860px, 36px
 * padding (20px on mobile), 1px `line` border, 16px radius, soft shadow.
 * Children lay themselves out in a 2-column grid (`col-span-full` for the
 * file input and submit button) via `CALC_GRID_CLASSES`.
 */
export default function CalculatorCard({ children, className, ...rest }: CalculatorCardProps) {
  return (
    <div
      className={clsx(
        "mx-auto w-full max-w-[860px] rounded-2xl border border-line bg-white p-5 shadow-[0_10px_30px_rgba(11,28,57,0.08)] md:p-9",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

/** 2-column grid, 22px column gap / 18px row gap, collapsing to 1 column at ≤700px. */
export const CALC_GRID_CLASSES = "grid grid-cols-1 gap-x-[22px] gap-y-[18px] min-[701px]:grid-cols-2";
