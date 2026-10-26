import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  RefreshCw,
  IndianRupee,
  BarChart3,
  Dumbbell,
  Sparkles,
  Settings,
  UserCircle,
  LogOut,
  type LucideIcon,
} from "lucide-react";
import type { PermissionAction, PermissionResource } from "@/lib/permissions";

export interface NavItem {
  label: string;
  icon: LucideIcon;
  href?: string;
  badge?: number;
  resource?: PermissionResource;
  action?: PermissionAction;
  type?: "route" | "logout";
  /** Display-only grouping hint used by the mobile drawer to layer the nav menu. */
  section?: "main" | "management" | "admin";
}

export const mainNavItems: NavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard", resource: "dashboard", section: "main" },
  { label: "Members", icon: Users, href: "/members", resource: "members", section: "main" },
  { label: "Attendance", icon: CalendarCheck, href: "/attendance", resource: "attendance", section: "main" },
  { label: "Renewals", icon: RefreshCw, href: "/renewals", resource: "renewals", section: "main" },
  { label: "Payments", icon: IndianRupee, href: "/payment-history", resource: "payments", section: "management" },
  { label: "Reports", icon: BarChart3, href: "/reports", resource: "reports", section: "management" },
  { label: "Trainers", icon: Dumbbell, href: "/trainers", resource: "trainers", section: "management" },
  { label: "Membership Plans", icon: IndianRupee, href: "/membership-plans", resource: "membershipPlans", section: "management" },
  { label: "AI Assistant", icon: Sparkles, href: "/ai-assistant", section: "management" },
];

export const bottomNavItems: NavItem[] = [
  { label: "Settings", icon: Settings, href: "/settings", resource: "settings", section: "admin" },
  { label: "Profile", icon: UserCircle, href: "/profile", resource: "profile" },
  { label: "Logout", icon: LogOut, type: "logout" },
];