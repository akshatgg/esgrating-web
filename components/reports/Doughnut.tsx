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
