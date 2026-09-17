// The superadmin console's navigation model — one source for the sidebar,
// the mobile drawer, the Profile dropdown and the public-site account menu.
import {
  BarChart3,
  FilePlus2,
  FileText,
  Landmark,
  LayoutDashboard,
  Mail,
  Newspaper,
  type LucideIcon,
} from "lucide-react";

export type AdminNavItem = { label: string; href: string; icon: LucideIcon };
export type AdminNavGroup = { label: string; items: AdminNavItem[] };

export const NEW_ESG_HREF = "/admin/esg/new";
export const NEW_BFSI_HREF = "/admin/bfsi/new";
/** The ESG Rating List now lives inside ESG Submissions, filtered to its rows
 * (`/admin/ratings` redirects here). */
export const RATED_COMPANIES_HREF = "/admin/esg?source=rating";

const DASHBOARD: AdminNavItem = { label: "Dashboard", href: "/admin", icon: LayoutDashboard };
const ESG_SUBMISSIONS: AdminNavItem = { label: "ESG Submissions", href: "/admin/esg", icon: FileText };
const BFSI_SUBMISSIONS: AdminNavItem = { label: "BFSI Submissions", href: "/admin/bfsi", icon: Landmark };
const RATED_COMPANIES: AdminNavItem = { label: "Rated companies", href: RATED_COMPANIES_HREF, icon: BarChart3 };
const MESSAGES: AdminNavItem = { label: "Messages", href: "/admin/messages", icon: Mail };
const BLOG: AdminNavItem = { label: "Blog", href: "/admin/blog", icon: Newspaper };

/** Every admin destination — the Profile dropdown and the public-site account
 * menu. "Rated companies" is a shortcut into ESG Submissions, not a sidebar tab. */
export const ADMIN_PAGES: AdminNavItem[] = [
  DASHBOARD,
  ESG_SUBMISSIONS,
  BFSI_SUBMISSIONS,
  RATED_COMPANIES,
  MESSAGES,
  BLOG,
];

export const NEW_ASSESSMENTS: AdminNavItem[] = [
  { label: "New ESG Assessment", href: NEW_ESG_HREF, icon: FilePlus2 },
  { label: "New BFSI Assessment", href: NEW_BFSI_HREF, icon: FilePlus2 },
];

export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  { label: "Overview", items: [DASHBOARD] },
  { label: "Submissions", items: [ESG_SUBMISSIONS, BFSI_SUBMISSIONS] },
  { label: "Content", items: [BLOG] },
  { label: "Data", items: [MESSAGES] },
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
