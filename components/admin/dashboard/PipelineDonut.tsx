"use client";

import { ArcElement, Chart as ChartJS, Tooltip, type ChartData, type ChartOptions } from "chart.js";
import { Doughnut } from "react-chartjs-2";
import { usePrefersReducedMotion } from "@/components/ui/usePrefersReducedMotion";

ChartJS.register(ArcElement, Tooltip);

export type Segment = { label: string; value: number; color: string };

/** Report-pipeline donut with a number in the hole. An empty pipeline draws
 * a plain grey ring instead of nothing. */
export default function PipelineDonut({
  segments,
  centerValue,
  centerLabel,
}: {
  segments: Segment[];
  centerValue: number;
  centerLabel: string;
}) {
  const reducedMotion = usePrefersReducedMotion();
  const total = segments.reduce((sum, s) => sum + s.value, 0);

  const data: ChartData<"doughnut"> = {
    labels: total ? segments.map((s) => s.label) : ["No submissions"],
    datasets: [
      {
        data: total ? segments.map((s) => s.value) : [1],
        backgroundColor: total ? segments.map((s) => s.color) : ["#eef2f7"],
        borderColor: "#ffffff",
        borderWidth: 2,
        hoverOffset: total ? 4 : 0,
      },
    ],
  };

  const options: ChartOptions<"doughnut"> = {
    cutout: "72%",
    responsive: true,
    maintainAspectRatio: true,
    layout: { padding: 4 },
    animation: reducedMotion ? false : { duration: 600 },
    plugins: {
      legend: { display: false },
      tooltip: { enabled: total > 0, backgroundColor: "#0b1c39", padding: 8, cornerRadius: 8 },
    },
  };

  const summary = segments.map((s) => `${s.label} ${s.value}`).join(", ");
  return (
    <div className="relative h-[128px] w-[128px] shrink-0">
      <Doughnut data={data} options={options} role="img" aria-label={`Report pipeline: ${summary}.`} />
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-[26px] leading-none font-semibold tracking-tight tabular-nums text-ink">
          {centerValue}
        </span>
        <span className="mt-1 max-w-[72px] text-[10px] leading-tight text-muted">{centerLabel}</span>
      </div>
    </div>
  );
}
