import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { serverFetch } from "@/lib/server-api";
import LoginForm from "./LoginForm";

export const metadata: Metadata = {
  title: "Superadmin login",
};

/** Already-logged-in visitors are bounced straight to the dashboard instead
 * of seeing the login form again. */
export default async function AdminLoginPage() {
  let alreadyAuthenticated = false;
  try {
    const res = await serverFetch("/api/auth/me");
    alreadyAuthenticated = res.ok;
  } catch {
    // API unreachable — fall through to the login form instead of crashing;
    // a user should still be able to attempt login.
  }
  if (alreadyAuthenticated) {
    redirect("/admin/esg");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-soft px-4 py-12">
      <LoginForm />
    </div>
  );
}
