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
