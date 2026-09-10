import { redirect } from "next/navigation";
import { serverFetch } from "@/lib/server-api";
import AdminShell from "@/components/admin/AdminShell";

/** Server-side guard for the whole admin dashboard. `GET /api/auth/me`
 * returns 401 when there's no valid session — redirect to the login page
 * before rendering anything. */
export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const res = await serverFetch("/api/auth/me");
  if (!res.ok) {
    redirect("/admin/login");
  }

  const { username } = (await res.json()) as { username: string };

  return <AdminShell username={username}>{children}</AdminShell>;
}
