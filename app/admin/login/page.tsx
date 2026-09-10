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
  const res = await serverFetch("/api/auth/me");
  if (res.ok) {
    redirect("/admin/esg");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-soft px-4 py-12">
      <LoginForm />
    </div>
  );
}
