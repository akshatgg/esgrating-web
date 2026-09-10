// Small display-formatting helpers shared by the admin list/detail views.

/** "14 Oct 2025" — the admin tables' date format. */
export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
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
