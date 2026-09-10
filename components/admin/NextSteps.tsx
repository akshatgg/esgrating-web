import clsx from "clsx";
import { CARD } from "./styles";

/** Side card on the "new assessment" forms: what happens after Submit. The
 * steps really are a sequence, hence the numbers. */
export default function NextSteps({ steps }: { steps: string[] }) {
  return (
    <aside aria-labelledby="next-steps-title" className={clsx(CARD, "min-w-0 p-5 sm:p-6")}>
      <h2 id="next-steps-title" className="text-[15px] font-semibold text-ink">
        After you submit
      </h2>
      <ol className="mt-4 flex flex-col gap-3">
        {steps.map((step, i) => (
          <li key={step} className="flex gap-3 text-[13px] text-muted">
            <span
              aria-hidden="true"
              className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand/8 text-xs font-semibold text-brand tabular-nums"
            >
              {i + 1}
            </span>
            <span className="pt-0.5">{step}</span>
          </li>
        ))}
      </ol>
    </aside>
  );
}
