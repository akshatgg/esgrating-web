"use client";

import { Chart as ChartJS, ArcElement, Tooltip, type ChartOptions } from "chart.js";
import { Doughnut as ReactDoughnut } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip);

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
};

/** The ESG report's navy-panel doughnut. */
export default function Doughnut({ environmental, social, governance }: DoughnutProps) {
  const data = {
    labels: ["Environment", "Social", "Governance"],
    datasets: [
      {
        data: [environmental, social, governance],
        backgroundColor: COLORS,
        borderWidth: 0,
      },
    ],
  };

  return (
    <ReactDoughnut
      data={data}
      options={OPTIONS}
      role="img"
      aria-label="ESG score breakdown by Environment, Social and Governance"
    />
  );
}
