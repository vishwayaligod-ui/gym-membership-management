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
}

export const mainNavItems: NavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard", resource: "dashboard" },
  { label: "Members", icon: Users, href: "/members", resource: "members" },
  { label: "Attendance", icon: CalendarCheck, href: "/attendance", resource: "attendance" },
  { label: "Renewals", icon: RefreshCw, href: "/renewals", resource: "renewals" },
  { label: "Payments", icon: IndianRupee, href: "/payment-history", resource: "payments" },
  { label: "Reports", icon: BarChart3, href: "/reports", resource: "reports" },
  { label: "Trainers", icon: Dumbbell, href: "/trainers", resource: "trainers" },
  { label: "Membership Plans", icon: IndianRupee, href: "/membership-plans", resource: "membershipPlans" },
  { label: "AI Assistant", icon: Sparkles, href: "/ai-assistant" },
];

export const bottomNavItems: NavItem[] = [
  { label: "Settings", icon: Settings, href: "/settings", resource: "settings" },
  { label: "Profile", icon: UserCircle, href: "/profile", resource: "profile" },
  { label: "Logout", icon: LogOut, type: "logout" },
];