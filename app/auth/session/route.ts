import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { serverFetch } from "@/lib/server-api";

const SESSION_COOKIE = "esg_session";

/** Same-origin session probe for the public site chrome (navbar account
 * menu). Proxies `GET /api/auth/me` server-side and always answers 200, so a
 * logged-out visitor's browser doesn't log a 401 console error on every page.
 * With no session cookie there is nothing to check, so the API isn't called. */
export async function GET() {
  const headers = { "Cache-Control": "no-store" };
  const loggedOut = () =>
    NextResponse.json({ authenticated: false, username: null }, { headers });

  if (!(await cookies()).has(SESSION_COOKIE)) return loggedOut();

  try {
    const res = await serverFetch("/api/auth/me");
    if (res.ok) {
      const me = (await res.json()) as { username?: string };
      return NextResponse.json(
        { authenticated: true, username: me.username ?? "admin" },
        { headers },
      );
    }
  } catch {
    // API unreachable — treat as logged out.
  }
  return loggedOut();
}
