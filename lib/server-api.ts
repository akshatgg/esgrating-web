// Server-only counterpart to `apiFetch` (lib/api.ts). A Server Component's
// `fetch` calls the API directly — not through the `/api/*` rewrite, which
// only rewrites same-origin *browser* requests — so it never carries the
// browser's cookies automatically. This reads the `esg_session` cookie via
// `next/headers` and forwards it explicitly.
import "server-only";
import { cookies } from "next/headers";

const API_URL = process.env.API_URL ?? "http://localhost:8000";
const SESSION_COOKIE = "esg_session";

/** Calls `${API_URL}${path}` with the current request's `esg_session`
 * cookie forwarded and caching disabled. Never throws on a non-2xx
 * response — callers inspect `res.ok` / `res.status` themselves (see
 * `admin/(protected)/layout.tsx` and `admin/login/page.tsx`). */
export async function serverFetch(path: string, init?: RequestInit): Promise<Response> {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE);

  const headers = new Headers(init?.headers);
  if (session) {
    headers.set("Cookie", `${SESSION_COOKIE}=${session.value}`);
  }

  return fetch(`${API_URL}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });
}
