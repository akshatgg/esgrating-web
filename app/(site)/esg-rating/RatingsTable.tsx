"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Loader2 } from "lucide-react";
import clsx from "clsx";
import Pagination from "@/components/ui/Pagination";
import Alert from "@/components/ui/Alert";

type Rating = {
  s_no: number;
  company_name: string;
  sector: string;
  esg_rating: number | string;
  date_of_rating: string;
  grade: string;
  category: string;
};

const PAGE_SIZE = 50;

const GRADE_CLASSES: Record<string, string> = {
  "A+": "bg-grade-a/10 text-grade-a",
  A: "bg-grade-a/10 text-grade-a",
  "B+": "bg-grade-b/10 text-grade-b",
  B: "bg-grade-b/10 text-grade-b",
  C: "bg-grade-c/10 text-grade-c",
  D: "bg-grade-d/10 text-grade-d",
};

function GradeBadge({ grade }: { grade: string }) {
  return (
    <span
      className={clsx(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold",
        GRADE_CLASSES[grade] ?? "bg-bg-soft text-ink",
      )}
    >
      {grade}
    </span>
  );
}

export default function RatingsTable() {
  const [rows, setRows] = useState<Rating[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/ratings");
        if (!res.ok) {
          let detail = `Request failed (${res.status})`;
          try {
            const body = await res.json();
            if (body?.detail) detail = body.detail;
          } catch {
            // ignore non-JSON error bodies
          }
          throw new Error(detail);
        }
        const data = (await res.json()) as Rating[];
        if (!cancelled) setRows(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load the ratings list.");
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    if (!rows) return [];
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      [r.company_name, r.sector, String(r.esg_rating), r.date_of_rating, r.grade, r.category]
        .some((field) => String(field ?? "").toLowerCase().includes(q)),
    );
  }, [rows, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function handleQueryChange(value: string) {
    setQuery(value);
    setPage(1);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="relative max-w-sm">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted"
          aria-hidden="true"
        />
        <input
          type="search"
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          placeholder="Search company, sector, grade…"
          aria-label="Search the ESG rating list"
          className="w-full rounded-[10px] border border-field bg-white py-2.5 pr-4 pl-9 text-sm text-ink placeholder:text-muted focus:border-calc-blue focus:outline-none focus:ring-2 focus:ring-calc-blue/20"
        />
      </div>

      {error ? (
        <Alert variant="error">{error}</Alert>
      ) : rows === null ? (
        <div className="flex items-center justify-center gap-2 py-16 text-muted">
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
          <span>Loading ratings…</span>
        </div>
      ) : filtered.length === 0 ? (
        <p className="py-16 text-center text-muted">No ratings found.</p>
      ) : (
        <>
          {/* Table — md and up */}
          <div className="hidden overflow-x-auto rounded-2xl border border-line md:block">
            <table className="w-full min-w-[720px] border-collapse text-left text-sm">
              <thead className="bg-bg-soft text-label">
                <tr>
                  <th className="px-4 py-3 font-semibold">SN</th>
                  <th className="px-4 py-3 font-semibold">Company Name</th>
                  <th className="px-4 py-3 font-semibold">Sector</th>
                  <th className="px-4 py-3 font-semibold">ESG Rating</th>
                  <th className="px-4 py-3 font-semibold">Date of Rating</th>
                  <th className="px-4 py-3 font-semibold">Grade</th>
                  <th className="px-4 py-3 font-semibold">Category</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((r) => (
                  <tr key={r.s_no} className="border-t border-line">
                    <td className="px-4 py-3 text-muted">{r.s_no}</td>
                    <td className="px-4 py-3 font-medium text-ink">{r.company_name}</td>
                    <td className="px-4 py-3 text-body">{r.sector}</td>
                    <td className="px-4 py-3 text-body">{r.esg_rating}</td>
                    <td className="px-4 py-3 text-body">{r.date_of_rating}</td>
                    <td className="px-4 py-3">
                      <GradeBadge grade={r.grade} />
                    </td>
                    <td className="px-4 py-3 text-body">{r.category}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Stacked cards — below md */}
          <div className="flex flex-col gap-3 md:hidden">
            {pageRows.map((r) => (
              <div key={r.s_no} className="rounded-xl border border-line bg-white p-4">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-ink">{r.company_name}</h3>
                  <GradeBadge grade={r.grade} />
                </div>
                <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-sm text-body">
                  <dt className="text-muted">Sector</dt>
                  <dd>{r.sector}</dd>
                  <dt className="text-muted">ESG Rating</dt>
                  <dd>{r.esg_rating}</dd>
                  <dt className="text-muted">Date of Rating</dt>
                  <dd>{r.date_of_rating}</dd>
                  <dt className="text-muted">Category</dt>
                  <dd>{r.category}</dd>
                </dl>
              </div>
            ))}
          </div>

          <Pagination page={currentPage} totalPages={totalPages} onChange={setPage} />
        </>
      )}
    </div>
  );
}
