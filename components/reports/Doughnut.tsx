"use client";

import { Chart as ChartJS, ArcElement, Tooltip, Legend, type ChartOptions } from "chart.js";
import { Doughnut as ReactDoughnut } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend);

// Environment / Social / Governance — esg-report.php's Chart.js doughnut
// (esg.md §B4). `esg_template.html`'s own static markup pairs the same
// colours with a *visible* legend (§A8); this component follows the live
// esg-report.php config (cutout 80%, legend hidden) per the W6 brief.
const COLORS = ["#8BC34A", "#FF6B6B", "#FFEB3B"];

const OPTIONS: ChartOptions<"doughnut"> = {
  cutout: "80%",
  plugins: { legend: { display: false }, tooltip: { enabled: false } },
  maintainAspectRatio: true,
  animation: false,
};

type DoughnutProps = {
  environmental: number;
  social: number;
  governance: number;
  /** Overrides for a different doughnut style (the BFSI detailed report's,
   * report.php:270-280). Omit all three for the ESG default above. */
  colors?: string[];
  options?: ChartOptions<"doughnut">;
  borderWidth?: number;
};

/** The ESG report's navy-panel doughnut (or, with overrides, another E/S/G doughnut). */
export default function Doughnut({
  environmental,
  social,
  governance,
  colors = COLORS,
  options = OPTIONS,
  borderWidth = 0,
}: DoughnutProps) {
  const data = {
    labels: ["Environment", "Social", "Governance"],
    datasets: [
      {
        data: [environmental, social, governance],
        backgroundColor: colors,
        borderWidth,
      },
    ],
  };

  return (
    <ReactDoughnut
      data={data}
      options={options}
      role="img"
      aria-label="ESG score breakdown by Environment, Social and Governance"
    />
  );
}

/** Single-value gauge in the same doughnut style (cutout 80%, legend hidden)
 * — the ESG Rating List one-pager, which has one rating and no E/S/G split.
 * `value` (0–100) is the filled share in `color`; the rest is a faint track. */
export function GaugeDoughnut({
  value,
  color,
  trackColor = "rgba(255, 255, 255, 0.14)",
}: {
  value: number;
  color: string;
  trackColor?: string;
}) {
  const filled = Math.min(100, Math.max(0, Number.isFinite(value) ? value : 0));
  const data = {
    labels: ["Rating", "Remaining"],
    datasets: [
      {
        data: [filled, 100 - filled],
        backgroundColor: [color, trackColor],
        borderWidth: 0,
      },
    ],
  };

  return (
    <ReactDoughnut
      data={data}
      options={OPTIONS}
      role="img"
      aria-label={`ESG rating ${filled} out of 100`}
    />
  );
}
