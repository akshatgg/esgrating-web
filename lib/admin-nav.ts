// The superadmin console's navigation model — one source for the sidebar,
// the mobile drawer, the Profile dropdown and the public-site account menu.
import {
  BarChart3,
  FilePlus2,
  FileText,
  Landmark,
  LayoutDashboard,
  Mail,
  type LucideIcon,
} from "lucide-react";

export type AdminNavItem = { label: string; href: string; icon: LucideIcon };
export type AdminNavGroup = { label: string; items: AdminNavItem[] };

export const NEW_ESG_HREF = "/admin/esg/new";
export const NEW_BFSI_HREF = "/admin/bfsi/new";

/** Every admin destination, in sidebar order. */
export const ADMIN_PAGES: AdminNavItem[] = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "ESG Submissions", href: "/admin/esg", icon: FileText },
  { label: "BFSI Submissions", href: "/admin/bfsi", icon: Landmark },
  { label: "ESG Rating List", href: "/admin/ratings", icon: BarChart3 },
  { label: "Messages", href: "/admin/messages", icon: Mail },
];

export const NEW_ASSESSMENTS: AdminNavItem[] = [
  { label: "New ESG Assessment", href: NEW_ESG_HREF, icon: FilePlus2 },
  { label: "New BFSI Assessment", href: NEW_BFSI_HREF, icon: FilePlus2 },
];

export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  { label: "Overview", items: [ADMIN_PAGES[0]] },
  { label: "Submissions", items: [ADMIN_PAGES[1], ADMIN_PAGES[2]] },
  { label: "Data", items: [ADMIN_PAGES[3], ADMIN_PAGES[4]] },
  { label: "Quick actions", items: NEW_ASSESSMENTS },
];

/** The one nav item that owns `pathname`: the longest href that is the path
 * itself or a parent of it. So `/admin/esg/new` highlights "New ESG
 * Assessment" rather than both it and "ESG Submissions", and `/admin` (the
 * Dashboard) only matches exactly. */
export function activeAdminHref(pathname: string): string | null {
  let best: string | null = null;
  for (const item of [...ADMIN_PAGES, ...NEW_ASSESSMENTS]) {
    const matches =
      item.href === "/admin"
        ? pathname === "/admin"
        : pathname === item.href || pathname.startsWith(`${item.href}/`);
    if (matches && (!best || item.href.length > best.length)) best = item.href;
  }
  return best;
}
