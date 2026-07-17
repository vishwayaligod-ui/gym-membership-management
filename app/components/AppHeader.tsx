"use client";

import { Bell, Dumbbell } from "lucide-react";
import { motion } from "framer-motion";

type AppHeaderProps = {
  title?: string;
};

export function AppHeader({ title = "Metric Fit" }: AppHeaderProps) {
  return (
    <motion.header
      initial={{ y: -14, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.24, ease: "easeOut" }}
      className="fixed inset-x-0 top-0 z-30 border-b border-slate-200/80 bg-[#0f172a] text-white shadow-[0_10px_35px_rgba(15,23,42,0.18)]"
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600/90 shadow-lg shadow-blue-600/20">
            <Dumbbell className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-300">
              Metric Fit
            </p>
            <p className="truncate text-sm font-semibold text-white">{title}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-slate-100 transition hover:bg-white/20">
            <Bell className="h-4.5 w-4.5" />
          </button>
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 text-sm font-semibold text-white shadow-lg shadow-blue-600/20">
            NM
          </div>
        </div>
      </div>
    </motion.header>
  );
}
