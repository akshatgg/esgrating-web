import { NextResponse } from "next/server";
import { serverFetch } from "@/lib/server-api";

/** Same-origin session probe for the public site chrome (navbar account
 * menu). Proxies `GET /api/auth/me` server-side and always answers 200, so a
 * logged-out visitor's browser doesn't log a 401 console error on every page. */
export async function GET() {
  const headers = { "Cache-Control": "no-store" };
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
  return NextResponse.json({ authenticated: false, username: null }, { headers });
}
