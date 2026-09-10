import { serverFetch } from "@/lib/server-api";
import AdminShell from "@/components/admin/AdminShell";
import LoginRedirect from "@/components/admin/LoginRedirect";

/** Server-side guard for the whole admin dashboard. `GET /api/auth/me`
 * returns 401 when there's no valid session; then nothing under this layout
 * renders — only a client bounce to `/admin/login?next=<current path>` (a
 * server layout can't see the request path to put in `next`). */
export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let res: Response | null = null;
  try {
    res = await serverFetch("/api/auth/me");
  } catch {
    // API unreachable — treat the same as "not authenticated" rather than
    // letting the network error crash the render.
    res = null;
  }
  if (!res || !res.ok) {
    return <LoginRedirect />;
  }

  const { username } = (await res.json()) as { username: string };

  return <AdminShell username={username}>{children}</AdminShell>;
}
