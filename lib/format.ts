// Small display-formatting helpers shared by the admin list/detail views.

/** "14 Oct 2025" — the admin tables' date format. Goes through parseApiDate:
 * the API's naive-UTC timestamps would otherwise be read as local time. */
export function formatDate(iso: string): string {
  const d = parseApiDate(iso);
  if (!d) return iso;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

// --- Superadmin console helpers (all API timestamps go through parseApiDate) ---

const DAY_MONTH = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short" });
const DAY_MONTH_UTC = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  timeZone: "UTC",
});
const DATE_TIME = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

/** "04 Sept" for an API timestamp, in the viewer's time zone. */
export function formatDayMonth(value: string | null | undefined): string {
  const d = parseApiDate(value);
  return d ? DAY_MONTH.format(d) : "";
}

/** "04 Sept" for a `YYYY-MM-DD` day bucket (the stats API buckets in UTC). */
export function formatDayKey(key: string): string {
  const d = new Date(`${key}T00:00:00Z`);
  return Number.isNaN(d.getTime()) ? key : DAY_MONTH_UTC.format(d);
}

/** "10 Sept 2026, 02:05 pm" for an API timestamp, in the viewer's time zone. */
export function formatDateTime(value: string | null | undefined): string {
  const d = parseApiDate(value);
  return d ? DATE_TIME.format(d) : (value ?? "");
}

/** "just now" / "5m ago" / "3h ago" / "2d ago", then "04 Sept" after a week.
 * `now` is passed in (the stats payload's `generated_at`) so rendering stays pure. */
export function relativeTime(value: string | null | undefined, now: Date): string {
  const d = parseApiDate(value);
  if (!d) return "";
  const seconds = Math.round((now.getTime() - d.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return DAY_MONTH.format(d);
}

const YMD_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** PHP `date('d-m-y', strtotime($date))` for the ESG Rating List's stored
 * `YYYY-MM-DD` dates ("10-06-26"); 'N/A' when empty (dashboard/index.php:744).
 * A value that isn't a plain date is shown as stored. */
export function formatDmy(value: string | null | undefined): string {
  if (!value) return "N/A";
  const m = YMD_RE.exec(value.trim());
  if (!m) return value;
  return `${m[3]}-${m[2]}-${m[1].slice(2)}`;
}

/** Last 6 characters of a Mongo ObjectId, for compact ID columns — pair with
 * the full id in a `title` attribute (esg.md §B3's "ID (last 6)"). */
export function shortId(id: string): string {
  return id.slice(-6);
}

/** `toFixed(2)`, or an em dash for a missing/non-finite score. */
export function formatScore(score: number | string | null | undefined): string {
  if (typeof score === "string") return score === "N/A" ? "N/A" : score;
  if (score === null || score === undefined || !Number.isFinite(score)) return "—";
  return score.toFixed(2);
}

/** First-letter capitalisation only (rest of the string untouched) — port of
 * `capitalize_first()` (esg_score_calculator-master/utils/get_html.py:44-47),
 * used to render the ESG report's keyword lists. */
export function capitalizeFirst(value: string): string {
  if (!value) return "";
  return value[0].toUpperCase() + value.slice(1);
}

// --- BFSI (PHP-parity) helpers -------------------------------------------------

const NAIVE_ISO_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?$/;

/** Parses an API timestamp. The API serialises pymongo's naive-UTC datetimes
 * with `isoformat()` and no offset, which `new Date()` would read as *local*
 * time — so a zone-less string is treated as UTC. Returns null if unparsable. */
export function parseApiDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const d = new Date(NAIVE_ISO_RE.test(value) ? `${value}Z` : value);
  return Number.isNaN(d.getTime()) ? null : d;
}

const pad2 = (n: number) => String(n).padStart(2, "0");

/** PHP `date()` formatting in UTC — `bfsi_fmt_date()` formats
 * `UTCDateTime->toDateTime()`, which is UTC. An unparsable string is returned
 * as-is (bfsi_fmt_date passes strings straight through). */
export function formatUtc(
  value: string | null | undefined,
  pattern: "Y-m-d" | "Y-m-d H:i" | "Y-m-d H:i:s",
): string {
  const d = parseApiDate(value);
  if (!d) return value ?? "";
  const date = `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
  if (pattern === "Y-m-d") return date;
  const hm = `${date} ${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())}`;
  return pattern === "Y-m-d H:i" ? hm : `${hm}:${pad2(d.getUTCSeconds())}`;
}

const INT_FMT = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const DEC2_FMT = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** PHP `number_format($n)` / `number_format($n, 2)`: "," thousands, "."
 * decimals, half-away-from-zero rounding. A missing value formats as 0, like
 * PHP's `(float)` cast of null. */
export function numberFormat(value: number | null | undefined, decimals: 0 | 2 = 0): string {
  const n = typeof value === "number" && Number.isFinite(value) ? value : 0;
  return (decimals === 2 ? DEC2_FMT : INT_FMT).format(n);
}

/** PHP's `echo` of a float (precision=14): 72.5 → "72.5", 65.0 → "65". */
export function phpFloat(value: number | null | undefined): string {
  const n = typeof value === "number" && Number.isFinite(value) ? value : 0;
  return String(Number(n.toPrecision(14)));
}

/** PHP's `(array)` cast: an array as-is, null/undefined → [], anything else → [value]. */
export function asArray<T>(value: T[] | T | null | undefined): T[] {
  if (value === null || value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}
