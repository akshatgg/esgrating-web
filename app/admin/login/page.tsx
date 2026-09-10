import type { Metadata } from "next";
import Link from "next/link";
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
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-navy via-[#0d1442] to-calc-navy px-4 py-12 sm:px-6">
      <div
        className="pointer-events-none absolute -top-32 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-brand/25 blur-[120px]"
        aria-hidden="true"
      />

      <div className="reveal relative flex w-full flex-col items-center gap-6">
        <LoginForm />

        <Link
          href="/"
          className="text-sm text-white/70 motion-safe:transition-colors hover:text-white"
        >
          ← Back to esgratings.co.in
        </Link>
      </div>
    </div>
  );
}
