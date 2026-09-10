"use client";

import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  type ChartData,
  type ChartOptions,
  type ScriptableContext,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { formatDayKey } from "@/lib/format";
import { usePrefersReducedMotion } from "@/components/ui/usePrefersReducedMotion";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip);

export const ESG_COLOR = "#3147ff";
export const BFSI_COLOR = "#14b8a6";

const MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
const AXIS = "#8a97ad";

function rgba(hex: string, alpha: number): string {
  const n = Number.parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

/** Vertical gradient under a line, fading to transparent at the x-axis. */
function areaFill(hex: string) {
  return (ctx: ScriptableContext<"line">) => {
    const { chart } = ctx;
    const area = chart.chartArea;
    if (!area) return "transparent";
    const gradient = chart.ctx.createLinearGradient(0, area.top, 0, area.bottom);
    gradient.addColorStop(0, rgba(hex, 0.22));
    gradient.addColorStop(1, rgba(hex, 0));
    return gradient;
  };
}

function series(label: string, color: string, data: number[]) {
  return {
    label,
    data,
    borderColor: color,
    backgroundColor: areaFill(color),
    fill: "origin" as const,
    tension: 0.4,
    borderWidth: 2,
    pointRadius: 0,
    pointHoverRadius: 4,
    pointHoverBorderWidth: 2,
    pointHoverBackgroundColor: "#ffffff",
    pointHoverBorderColor: color,
  };
}

/** Two-series smooth area chart of daily ESG and BFSI submissions. */
export default function SubmissionsChart({
  daily,
}: {
  daily: { date: string; esg: number; bfsi: number }[];
}) {
  const reducedMotion = usePrefersReducedMotion();
  const esg = daily.map((d) => d.esg);
  const bfsi = daily.map((d) => d.bfsi);

  const data: ChartData<"line"> = {
    labels: daily.map((d) => formatDayKey(d.date)),
    datasets: [series("ESG", ESG_COLOR, esg), series("BFSI", BFSI_COLOR, bfsi)],
  };

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: reducedMotion ? false : { duration: 700 },
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#0b1c39",
        titleFont: { family: MONO, size: 11, weight: "normal" },
        bodyFont: { size: 12 },
        padding: 10,
        cornerRadius: 8,
        boxPadding: 4,
        usePointStyle: true,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: {
          font: { family: MONO, size: 10 },
          color: AXIS,
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 7,
        },
      },
      y: {
        beginAtZero: true,
        suggestedMax: 4,
        border: { display: false },
        grid: { color: "#eef2f7" },
        ticks: { precision: 0, font: { family: MONO, size: 10 }, color: AXIS, maxTicksLimit: 5 },
      },
    },
  };

  const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
  return (
    <Line
      data={data}
      options={options}
      role="img"
      aria-label={`Daily submissions over the last ${daily.length} days: ${sum(esg)} ESG and ${sum(bfsi)} BFSI.`}
    />
  );
}
