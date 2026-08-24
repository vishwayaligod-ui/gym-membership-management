"use client";

import { motion } from "framer-motion";
import { useRouter, usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  CalendarClock,
  Clock3,
  LayoutGrid,
  Settings,
  Users,
} from "lucide-react";
import { hasPermission, type PermissionResource } from "@/lib/permissions";

type TabItem = {
  label: string;
  icon: typeof LayoutGrid;
  route: string;
  resource?: PermissionResource;
};

const tabs: TabItem[] = [
  { label: "Dashboard", icon: LayoutGrid, route: "/dashboard", resource: "dashboard" },
  { label: "Members", icon: Users, route: "/members-v4", resource: "members" },
  { label: "Attendance", icon: Clock3, route: "/attendance", resource: "attendance" },
  { label: "Renewals", icon: CalendarClock, route: "/renewals", resource: "renewals" },
  { label: "Settings", icon: Settings, route: "/settings", resource: "settings" },
];

export function BottomNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = session?.user?.role;

  const visibleTabs = tabs.filter((tab) => {
    if (!tab.resource) {
      return true;
    }

    return hasPermission(role, tab.resource, "read");
  });

  const getActiveTab = () => {
    const path = pathname;
    if (path === "/dashboard" || path === "/") return "Dashboard";
    if (path === "/members-v4" || path.startsWith("/members-v4/")) return "Members";
    if (path.includes("/attendance")) return "Attendance";
    if (path.includes("/renewals")) return "Renewals";
    if (path.includes("/settings")) return "Settings";
    return "Dashboard";
  };

  const activeTab = getActiveTab();

  return (
    <motion.nav
      initial={{ y: 22, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.24, ease: "easeOut", delay: 0.05 }}
      className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200/80 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85"
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-1 px-2 py-2 sm:px-4 lg:px-8">
        {visibleTabs.map((item) => {
          const Icon = item.icon;
          const active = item.label === activeTab;
          return (
            <button
              key={item.label}
              type="button"
              onClick={() => router.push(item.route)}
              className={`flex flex-1 flex-col items-center justify-center rounded-2xl px-2 py-2 text-[11px] font-medium transition-all ${
                active
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <Icon className="mb-1 h-4 w-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </motion.nav>
  );
}
