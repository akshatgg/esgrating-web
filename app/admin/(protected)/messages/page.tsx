"use client";

import { useEffect, useState } from "react";
import { CalendarClock, CalendarDays, Inbox, Mail } from "lucide-react";
import type { ContactMessage, Paged } from "@/lib/types";
import { apiFetch, ApiError } from "@/lib/api";
import { formatDateTime, formatDayMonth } from "@/lib/format";
import DataTable, { type Column } from "@/components/admin/DataTable";
import PageHeader from "@/components/admin/PageHeader";
import StatStrip from "@/components/admin/StatStrip";
import EmptyState from "@/components/admin/EmptyState";
import ListFooter from "@/components/admin/ListFooter";
import { TableSkeleton } from "@/components/admin/Skeleton";
import { useAdminStats } from "@/components/admin/useAdminStats";
import Alert from "@/components/ui/Alert";

// Contact-form messages (GET /api/admin/contacts, esgratings-api
// app/contact/router.py): 50 per page, newest first — Date, Name, Email,
// Number, Message (web-task-W8-brief.md Step 2).

const PAGE_SIZE = 50;
const NUM = new Intl.NumberFormat("en-IN");

const LINK = "text-brand hover:underline";

export default function MessagesPage() {
  const [items, setItems] = useState<ContactMessage[] | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const stats = useAdminStats();

  useEffect(() => {
    let cancelled = false;
    apiFetch<Paged<ContactMessage>>(`/api/admin/contacts?page=${page}`)
      .then((res) => {
        if (cancelled) return;
        setItems(res.items);
        setTotal(res.total);
        setPage(res.page);
        setPages(res.pages);
        setError(null);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : "Something went wrong.");
      });
    return () => {
      cancelled = true;
    };
  }, [page]);

  const latest = stats.data?.recent.messages[0]?.created_at;

  const columns: Column<ContactMessage>[] = [
    {
      key: "created_at",
      header: "Date",
      className: "whitespace-nowrap text-ink/80",
      render: (m) => formatDateTime(m.created_at),
    },
    { key: "name", header: "Name", className: "font-medium whitespace-nowrap" },
    {
      key: "email",
      header: "Email",
      render: (m) => (
        <a href={`mailto:${m.email}`} className={LINK}>
          {m.email}
        </a>
      ),
    },
    {
      key: "number",
      header: "Number",
      className: "whitespace-nowrap",
      render: (m) =>
        m.number ? (
          <a href={`tel:${m.number.replace(/\s+/g, "")}`} className={LINK}>
            {m.number}
          </a>
        ) : (
          <span className="text-muted">—</span>
        ),
    },
    {
      key: "message",
      header: "Message",
      className: "min-w-[18rem] max-w-[34rem]",
      render: (m) => <p className="py-1 break-words whitespace-pre-line text-ink/85">{m.message}</p>,
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        crumbs={[{ label: "Dashboard", href: "/admin" }, { label: "Messages" }]}
        title="Messages"
        description="Messages sent through the website's contact form."
      />

      <StatStrip
        items={[
          {
            label: "Total messages",
            value: stats.data ? NUM.format(stats.data.messages.total) : "—",
            icon: Inbox,
            tone: "violet",
          },
          {
            label: "Last 7 days",
            value: stats.data ? NUM.format(stats.data.messages.last_7_days) : "—",
            icon: CalendarDays,
            tone: "brand",
          },
          {
            label: "Latest message",
            value: latest ? formatDayMonth(latest) : "—",
            icon: CalendarClock,
            tone: "teal",
          },
        ]}
      />

      {error ? <Alert variant="error">{error}</Alert> : null}

      {items === null ? (
        error ? null : <TableSkeleton />
      ) : (
        <>
          <DataTable
            appearance="console"
            columns={columns}
            rows={items}
            rowKey={(m) => m._id}
            empty={
              <EmptyState
                icon={Mail}
                title="No messages yet"
                description="Messages sent from the website's Contact page will appear here."
              />
            }
          />
          {total > 0 ? (
            <ListFooter
              page={page}
              pageSize={PAGE_SIZE}
              total={total}
              pages={pages}
              onPageChange={setPage}
            />
          ) : null}
        </>
      )}
    </div>
  );
}
