import {
  Settings,
  Landmark,
  Database,
  Handshake,
  PiggyBank,
  Users,
  LineChart,
  TrendingUp,
  BarChart3,
  Banknote,
  type LucideIcon,
} from "lucide-react";

/** lucide-react stand-ins for the WordPress theme's "masco icon-*" icon font
 * (see ../docs/analysis/content.md §7 notes — icons are not preserved 1:1,
 * substituted with the closest semantic match). */
export const ICONS: Record<string, LucideIcon> = {
  settings: Settings,
  bank: Landmark,
  database: Database,
  handshake: Handshake,
  "save-money": PiggyBank,
  management: Users,
  "graph-2": LineChart,
  graph: TrendingUp,
  "graphic-2": BarChart3,
  money: Banknote,
};
