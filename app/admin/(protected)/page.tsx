import type { Metadata } from "next";
import Dashboard from "@/components/admin/dashboard/Dashboard";

export const metadata: Metadata = {
  title: "Dashboard",
};

/** `/admin` — the superadmin Dashboard (whole-site summary from `/api/admin/stats`). */
export default function AdminDashboardPage() {
  return <Dashboard />;
}
