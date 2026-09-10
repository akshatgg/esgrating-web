"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import clsx from "clsx";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  FileCheck2,
  FileText,
  Hourglass,
  Inbox,
  Landmark,
  Mail,
  Plus,
  RefreshCw,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import type {
  AdminStats,
  AttentionItem,
  DailyCount,
  RecentMessage,
  RecentSubmission,
  StatusCounts,
} from "@/lib/types";
import { formatDayKey, formatDayMonth, parseApiDate, relativeTime } from "@/lib/format";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import PageHeader from "@/components/admin/PageHeader";
import IconTile, { type Tone } from "@/components/admin/IconTile";
import EmptyState from "@/components/admin/EmptyState";
import { Bone } from "@/components/admin/Skeleton";
import {
  GradeChip,
  KindBadge,
  STATE_COLORS,
  StatusBadge,
  submissionState,
} from "@/components/admin/Badge";
import { CARD, FOCUS_RING, FOCUS_RING_INSET } from "@/components/admin/styles";
import { useAdminStats } from "@/components/admin/useAdminStats";
import { RATED_COMPANIES_HREF } from "@/lib/admin-nav";
import Sparkline from "./Sparkline";
import SubmissionsChart, { BFSI_COLOR, ESG_COLOR } from "./SubmissionsChart";
import PipelineDonut, { type Segment } from "./PipelineDonut";

// The superadmin Dashboard (docs/sdd/web-task-admin-redesign-brief.md
// "Dashboard page"), modelled on the Mark AI CMS dashboard: stat cards, a
// 30-day submissions chart, a report-pipeline donut, "Needs attention", and
// three recent-activity cards. All data is one `GET /api/admin/stats`.

const NUM = new Intl.NumberFormat("en-IN");
const count = (n: number, one: string, many = `${one}s`) =>
  `${NUM.format(n)} ${n === 1 ? one : many}`;

const CARD_LABEL = "text-xs font-semibold tracking-[0.06em] text-muted uppercase";

export default function Dashboard() {
  const { data, error, loading, refresh } = useAdminStats();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Dashboard"
        description="Live overview of ESG Ratings"
        actions={
          <>
            <ApiStatus status={error ? "down" : data ? "up" : "checking"} />
            <button
              type="button"
              onClick={() => {
                if (!loading) refresh();
              }}
              aria-label="Refresh"
              aria-busy={loading}
              title="Refresh"
              className={clsx(
                "grid h-10 w-10 place-items-center rounded-[10px] border border-line bg-white text-ink shadow-[0_1px_2px_rgba(11,28,57,0.04)] hover:bg-slate-50 motion-safe:transition-colors",
                FOCUS_RING,
              )}
            >
              <RefreshCw
                className={clsx("h-4 w-4", loading && "motion-safe:animate-spin")}
                aria-hidden="true"
              />
            </button>
          </>
        }
      />

      {error ? (
        <Alert variant="error">
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            {error}
            <button
              type="button"
              onClick={refresh}
              className={clsx("rounded font-semibold underline underline-offset-2", FOCUS_RING)}
            >
              Retry
            </button>
          </span>
        </Alert>
      ) : null}

      {data ? <DashboardBody stats={data} /> : error ? null : <DashboardSkeleton />}
    </div>
  );
}

function ApiStatus({ status }: { status: "up" | "down" | "checking" }) {
  const look = {
    up: { label: "API online", className: "border-emerald-200 bg-emerald-50 text-emerald-700", dot: "bg-emerald-500" },
    down: { label: "API unreachable", className: "border-red-200 bg-red-50 text-red-700", dot: "bg-red-500" },
    checking: { label: "Connecting…", className: "border-line bg-white text-muted", dot: "bg-slate-300" },
  }[status];
  return (
    <span
      role="status"
      className={clsx(
        "inline-flex h-10 items-center gap-2 rounded-full border px-3.5 text-[13px] font-medium",
        look.className,
      )}
    >
      <span className={clsx("h-2 w-2 rounded-full", look.dot)} aria-hidden="true" />
      {look.label}
    </span>
  );
}

function DashboardBody({ stats }: { stats: AdminStats }) {
  const { esg, bfsi } = stats;
  // Relative times are measured against the payload's own timestamp, so
  // rendering stays pure and consistent with the numbers shown.
  const now = parseApiDate(stats.generated_at) ?? new Date(0);

  const failed = esg.failed + bfsi.failed;
  const waiting = esg.new + bfsi.new;
  const reports = esg.reports_generated + bfsi.reports_generated;
  const sent = esg.sent + bfsi.sent;
  const spark = stats.daily.slice(-14).map((d) => d.esg + d.bfsi);

  return (
    <>
      <section aria-label="Summary" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total submissions"
          value={esg.total + bfsi.total}
          icon={Inbox}
          tone="brand"
          sub={`ESG ${NUM.format(esg.total)} · BFSI ${NUM.format(bfsi.total)}`}
          chart={<Sparkline values={spark} label="Daily submissions over the last 14 days" />}
        />
        <StatCard
          label="Reports generated"
          value={reports}
          icon={FileCheck2}
          tone="green"
          sub={`${NUM.format(sent)} sent to clients`}
        />
        <StatCard
          label="Awaiting analysis"
          value={waiting + failed}
          icon={Hourglass}
          tone="amber"
          sub={
            failed > 0 ? (
              <span className="font-medium text-red-600">{NUM.format(failed)} failed</span>
            ) : waiting > 0 ? (
              "none failed"
            ) : (
              "all caught up"
            )
          }
        />
        <StatCard
          label="Rated companies"
          value={stats.ratings.total}
          icon={BarChart3}
          tone="violet"
          sub={`avg rating ${stats.ratings.average.toFixed(1)}`}
          href={RATED_COMPANIES_HREF}
        />
      </section>

      <div className="grid gap-4 xl:grid-cols-3">
        <ChartCard daily={stats.daily} className="xl:col-span-2" />
        <PipelineCard esg={esg} bfsi={bfsi} />
      </div>

      <AttentionCard items={stats.attention} now={now} />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <RecentSubmissionsCard kind="esg" items={stats.recent.esg} />
        <RecentSubmissionsCard kind="bfsi" items={stats.recent.bfsi} />
        <RecentMessagesCard
          items={stats.recent.messages}
          now={now}
          className="md:col-span-2 xl:col-span-1"
        />
      </div>
    </>
  );
}

function StatCard({
  label,
  value,
  sub,
  icon,
  tone,
  chart,
  href,
}: {
  label: string;
  value: number;
  sub: ReactNode;
  icon: LucideIcon;
  tone: Tone;
  chart?: ReactNode;
  /** Makes the whole card a link to the matching list. */
  href?: string;
}) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className={clsx(CARD_LABEL, "pt-1")}>{label}</p>
        <IconTile icon={icon} tone={tone} />
      </div>
      <p className="-mt-1 text-[32px] leading-none font-semibold tracking-tight text-ink tabular-nums">
        {NUM.format(value)}
      </p>
      <div className="mt-3 flex min-h-[30px] items-end justify-between gap-3">
        <p className="text-[13px] text-muted">{sub}</p>
        {chart}
      </div>
    </>
  );
  return href ? (
    <Link
      href={href}
      className={clsx(
        CARD,
        "flex flex-col p-5 hover:border-field motion-safe:transition-colors",
        FOCUS_RING,
      )}
    >
      {body}
    </Link>
  ) : (
    <div className={clsx(CARD, "flex flex-col p-5")}>{body}</div>
  );
}

function ChartCard({ daily, className }: { daily: DailyCount[]; className?: string }) {
  const totals = daily.map((d) => d.esg + d.bfsi);
  const total = totals.reduce((a, b) => a + b, 0);
  const esgTotal = daily.reduce((a, d) => a + d.esg, 0);
  const bfsiTotal = daily.reduce((a, d) => a + d.bfsi, 0);
  // Busiest day; the most recent one wins a tie.
  let peak = -1;
  totals.forEach((t, i) => {
    if (t > 0 && (peak < 0 || t >= totals[peak])) peak = i;
  });

  return (
    <section aria-labelledby="chart-title" className={clsx(CARD, "flex flex-col p-5 sm:p-6", className)}>
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2">
        <div>
          <h2 id="chart-title" className={CARD_LABEL}>
            Submissions · last {daily.length} days
          </h2>
          <p className="mt-2 flex items-baseline gap-2">
            <span className="text-[32px] leading-none font-semibold tracking-tight text-ink tabular-nums">
              {NUM.format(total)}
            </span>
            <span className="text-sm text-muted">{total === 1 ? "submission" : "submissions"}</span>
          </p>
        </div>
        <p className="font-mono text-xs text-muted">
          {peak >= 0
            ? `${totals[peak]} · ${formatDayKey(daily[peak].date)} · peak`
            : "no submissions yet"}
        </p>
      </div>
      <ul aria-label="Chart legend" className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-ink/80">
        <LegendItem color={ESG_COLOR} label="ESG" value={esgTotal} />
        <LegendItem color={BFSI_COLOR} label="BFSI" value={bfsiTotal} />
      </ul>
      <div className="relative mt-3 h-[240px] sm:h-[260px]">
        <SubmissionsChart daily={daily} />
      </div>
    </section>
  );
}

function LegendItem({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <li className="flex items-center gap-2">
      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} aria-hidden="true" />
      {label}
      <span className="font-mono text-xs text-muted">{NUM.format(value)}</span>
    </li>
  );
}

function PipelineCard({ esg, bfsi }: { esg: StatusCounts; bfsi: StatusCounts }) {
  const sum = (key: keyof StatusCounts) => esg[key] + bfsi[key];
  const segments: Segment[] = [
    { label: "New", value: sum("new"), color: STATE_COLORS.new },
    { label: "Running", value: sum("running"), color: STATE_COLORS.running },
    { label: "Generated", value: sum("report_generated"), color: STATE_COLORS.generated },
    { label: "Sent", value: sum("sent"), color: STATE_COLORS.sent },
    { label: "Failed", value: sum("failed"), color: STATE_COLORS.failed },
  ];
  const waiting = sum("new") + sum("failed");
  const running = sum("running");
  const insight =
    waiting > 0
      ? `${count(waiting, "submission")} waiting for analysis`
      : running > 0
        ? `${count(running, "analysis", "analyses")} running now`
        : "All reports up to date";

  return (
    <section aria-labelledby="pipeline-title" className={clsx(CARD, "flex flex-col p-5 sm:p-6")}>
      <h2 id="pipeline-title" className="text-[15px] font-semibold text-ink">
        Report pipeline
      </h2>
      <p className="text-[13px] text-muted">ESG and BFSI submissions by stage</p>
      <div className="my-5 flex items-center gap-5">
        <PipelineDonut
          segments={segments}
          centerValue={sum("reports_generated")}
          centerLabel="reports generated"
        />
        <ul className="flex min-w-0 flex-1 flex-col gap-2 text-[13px]">
          {segments.map((s) => (
            <li key={s.label} className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: s.color }}
                aria-hidden="true"
              />
              <span className="flex-1 truncate text-ink/80">{s.label}</span>
              <span className="font-mono text-ink tabular-nums">{s.value}</span>
            </li>
          ))}
        </ul>
      </div>
      <p className="mt-auto flex items-start gap-2 rounded-xl bg-slate-50 px-3 py-2.5 text-[13px] text-ink">
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden="true" />
        {insight}
      </p>
    </section>
  );
}

function AttentionCard({ items, now }: { items: AttentionItem[]; now: Date }) {
  return (
    <section aria-labelledby="attention-title" className={clsx(CARD, "overflow-hidden")}>
      <header className="flex items-center gap-2 px-5 pt-4 pb-3">
        <h2 id="attention-title" className="text-[15px] font-semibold text-ink">
          Needs attention
        </h2>
        {items.length > 0 ? (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800 tabular-nums">
            {items.length}
          </span>
        ) : null}
      </header>
      {items.length === 0 ? (
        <div className="border-t border-line">
          <EmptyState
            compact
            icon={CheckCircle2}
            tone="green"
            title="All clear"
            description="Every submission has been analysed."
          />
        </div>
      ) : (
        <ul className="divide-y divide-line border-t border-line">
          {items.map((item) => {
            const failed = item.reason === "Analysis failed";
            const title = item.title || "Untitled submission";
            return (
              <li
                key={`${item.kind}-${item.id}-${item.reason}`}
                className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-5 py-3.5 sm:flex-nowrap"
              >
                <KindBadge kind={item.kind} />
                <div className="min-w-0 flex-1 basis-[60%] sm:basis-auto">
                  <p className="truncate text-sm font-semibold text-ink">{title}</p>
                  <p className="truncate text-[13px]">
                    <span className={clsx("font-medium", failed ? "text-red-600" : "text-amber-700")}>
                      {item.reason}
                    </span>
                    {item.detail ? <span className="text-muted"> · {item.detail}</span> : null}
                  </p>
                </div>
                <span className="font-mono text-[11px] whitespace-nowrap text-muted">
                  {relativeTime(item.created_at, now)}
                </span>
                <Link
                  href={`/admin/${item.kind}/${item.id}`}
                  aria-label={`Open ${title}`}
                  className={clsx(
                    "inline-flex items-center gap-1 rounded text-sm font-medium whitespace-nowrap text-brand hover:text-calc-navy",
                    FOCUS_RING,
                  )}
                >
                  Open
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

/** Shell of the three bottom cards: title + small action, rows, "View all". */
function ListCard({
  title,
  action,
  footerHref,
  footerLabel,
  className,
  children,
}: {
  title: string;
  action: ReactNode;
  footerHref: string;
  footerLabel: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section aria-label={title} className={clsx(CARD, "flex flex-col overflow-hidden", className)}>
      <header className="flex items-center justify-between gap-3 px-5 pt-4 pb-3">
        <h2 className="text-[15px] font-semibold text-ink">{title}</h2>
        {action}
      </header>
      <div className="flex-1 border-t border-line">{children}</div>
      <footer className="border-t border-line px-5 py-3">
        <Link
          href={footerHref}
          aria-label={footerLabel}
          className={clsx(
            "inline-flex items-center gap-1.5 rounded text-sm font-medium text-brand hover:text-calc-navy motion-safe:transition-colors",
            FOCUS_RING,
          )}
        >
          View all
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </footer>
    </section>
  );
}

const ROW_LINK = clsx(
  "flex items-center gap-3 px-5 py-3 hover:bg-slate-50 motion-safe:transition-colors",
  FOCUS_RING_INSET,
);

const SUBMISSION_CARDS = {
  esg: {
    title: "ESG Submissions",
    newHref: "/admin/esg/new",
    listHref: "/admin/esg",
    icon: FileText,
    tone: "brand" as Tone,
    emptyTitle: "No ESG submissions yet",
    emptyText: "Reports sent through the ESG Rating Calculator will appear here.",
  },
  bfsi: {
    title: "BFSI Submissions",
    newHref: "/admin/bfsi/new",
    listHref: "/admin/bfsi",
    icon: Landmark,
    tone: "teal" as Tone,
    emptyTitle: "No BFSI submissions yet",
    emptyText: "Borrower assessments from the BFSI Calculator will appear here.",
  },
};

function RecentSubmissionsCard({ kind, items }: { kind: "esg" | "bfsi"; items: RecentSubmission[] }) {
  const cfg = SUBMISSION_CARDS[kind];
  return (
    <ListCard
      title={cfg.title}
      footerHref={cfg.listHref}
      footerLabel={`View all ${cfg.title}`}
      action={
        <Button variant="adminSecondary" size="sm" href={cfg.newHref}>
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          New
        </Button>
      }
    >
      {items.length === 0 ? (
        <EmptyState compact icon={cfg.icon} title={cfg.emptyTitle} description={cfg.emptyText} />
      ) : (
        <ul className="divide-y divide-line">
          {items.map((item) => {
            const state = submissionState(item);
            const analysed = Boolean(item.grade) && (state === "generated" || state === "sent");
            const meta = [item.subtitle, formatDayMonth(item.created_at)].filter(Boolean).join(" · ");
            return (
              <li key={item.id}>
                <Link href={`${cfg.listHref}/${item.id}`} className={ROW_LINK}>
                  <IconTile icon={cfg.icon} tone={cfg.tone} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-ink">
                      {item.title || "Untitled"}
                    </span>
                    <span className="block truncate font-mono text-[11px] text-muted">{meta}</span>
                  </span>
                  {analysed ? <GradeChip grade={item.grade} /> : <StatusBadge state={state} />}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </ListCard>
  );
}

function RecentMessagesCard({
  items,
  now,
  className,
}: {
  items: RecentMessage[];
  now: Date;
  className?: string;
}) {
  return (
    <ListCard
      title="Messages"
      className={className}
      footerHref="/admin/messages"
      footerLabel="View all messages"
      action={
        <Button variant="adminSecondary" size="sm" href="/admin/messages">
          View
        </Button>
      }
    >
      {items.length === 0 ? (
        <EmptyState
          compact
          icon={Mail}
          title="No messages yet"
          description="Messages sent through the website's contact form will appear here."
        />
      ) : (
        <ul className="divide-y divide-line">
          {items.map((item) => (
            <li key={item.id}>
              <Link href="/admin/messages" className={ROW_LINK}>
                <IconTile icon={Mail} tone="violet" size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-ink">
                    {item.title || item.subtitle || "Unknown sender"}
                  </span>
                  <span className="block truncate text-[13px] text-muted">{item.preview}</span>
                </span>
                <span className="shrink-0 font-mono text-[11px] text-muted">
                  {relativeTime(item.created_at, now)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </ListCard>
  );
}

function DashboardSkeleton() {
  return (
    <div aria-busy="true" className="flex flex-col gap-6">
      <span role="status" className="sr-only">
        Loading dashboard…
      </span>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={clsx(CARD, "p-5")}>
            <div className="flex items-start justify-between">
              <Bone className="mt-1 h-3 w-28" />
              <Bone className="h-10 w-10 rounded-xl" />
            </div>
            <Bone className="mt-1 h-8 w-20" />
            <Bone className="mt-4 h-3 w-32" />
          </div>
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        <div className={clsx(CARD, "p-6 xl:col-span-2")}>
          <Bone className="h-3 w-44" />
          <Bone className="mt-3 h-8 w-16" />
          <Bone className="mt-6 h-[220px] w-full rounded-xl" />
        </div>
        <div className={clsx(CARD, "p-6")}>
          <Bone className="h-4 w-32" />
          <div className="mt-6 flex items-center gap-5">
            <Bone className="h-[128px] w-[128px] rounded-full" />
            <div className="flex flex-1 flex-col gap-3">
              {[0, 1, 2, 3, 4].map((i) => (
                <Bone key={i} className="h-3 w-full" />
              ))}
            </div>
          </div>
          <Bone className="mt-6 h-9 w-full rounded-xl" />
        </div>
      </div>
      <div className={clsx(CARD, "p-5")}>
        <Bone className="h-4 w-36" />
        <Bone className="mt-5 h-10 w-full" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className={clsx(CARD, "p-5")}>
            <div className="flex items-center justify-between">
              <Bone className="h-4 w-32" />
              <Bone className="h-8 w-16" />
            </div>
            {[0, 1, 2].map((j) => (
              <div key={j} className="mt-5 flex items-center gap-3">
                <Bone className="h-9 w-9 rounded-xl" />
                <div className="flex flex-1 flex-col gap-2">
                  <Bone className="h-3 w-2/3" />
                  <Bone className="h-2.5 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
