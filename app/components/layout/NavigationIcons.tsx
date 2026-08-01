import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  RefreshCw,
  IndianRupee,
  BarChart3,
  Dumbbell,
  Settings,
  UserCircle,
  LogOut,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  icon: LucideIcon;
  href: string;
  badge?: number;
}

export const mainNavItems: NavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Members", icon: Users, href: "/members" },
  { label: "Attendance", icon: CalendarCheck, href: "/attendance" },
  { label: "Renewals", icon: RefreshCw, href: "/renewals" },
  { label: "Payments", icon: IndianRupee, href: "/payment-history" },
  { label: "Reports", icon: BarChart3, href: "/reports" },
  { label: "Trainers", icon: Dumbbell, href: "/trainers" },
  { label: "Membership Plans", icon: IndianRupee, href: "/membership-plans" },
];

export const bottomNavItems: NavItem[] = [
  { label: "Settings", icon: Settings, href: "/settings" },
  { label: "Profile", icon: UserCircle, href: "/profile" },
  { label: "Logout", icon: LogOut, href: "/login" },
];