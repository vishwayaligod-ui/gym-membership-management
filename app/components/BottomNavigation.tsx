"use client";

import { motion } from "framer-motion";
import {
  CalendarClock,
  Clock3,
  LayoutGrid,
  Settings,
  Users,
} from "lucide-react";
import { useState } from "react";

type TabItem = {
  label: string;
  icon: typeof LayoutGrid;
};

const tabs: TabItem[] = [
  { label: "Dashboard", icon: LayoutGrid },
  { label: "Members", icon: Users },
  { label: "Attendance", icon: Clock3 },
  { label: "Renewals", icon: CalendarClock },
  { label: "Settings", icon: Settings },
];

export function BottomNavigation() {
  const [activeTab, setActiveTab] = useState("Dashboard");

  return (
    <motion.nav
      initial={{ y: 22, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.24, ease: "easeOut", delay: 0.05 }}
      className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200/80 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85"
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-1 px-2 py-2 sm:px-4 lg:px-8">
        {tabs.map((item) => {
          const Icon = item.icon;
          const active = item.label === activeTab;
          return (
            <button
              key={item.label}
              type="button"
              onClick={() => setActiveTab(item.label)}
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
