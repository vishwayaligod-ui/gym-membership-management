"use client";

import { AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

type Renewal = {
  name: string;
  plan: string;
  daysLeft: number;
  avatar: string;
};

type SidebarProps = {
  renewals: Renewal[];
};

export function Sidebar({ renewals }: SidebarProps) {
  return (
    <aside className="w-[340px] shrink-0 border-l border-slate-200 px-6 py-6">
      {/* Attention Required */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className="flex items-center gap-2 mb-4">
          <AlertCircle className="h-4 w-4 text-amber-500" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-amber-600">
            Attention Required
          </span>
        </div>

        <div className="space-y-2">
          {renewals.map((renewal, i) => (
            <motion.div
              key={renewal.name}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.25 + i * 0.05 }}
              className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3.5 transition-all hover:border-slate-300 hover:shadow-sm"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-[10px] font-bold text-white shadow-sm">
                {renewal.avatar}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-medium text-slate-900">{renewal.name}</p>
                <p className="text-[10px] text-slate-500">{renewal.plan} · Expiring soon</p>
              </div>
              <div className="text-right">
                <p className="text-[13px] font-bold tabular-nums text-amber-600">{renewal.daysLeft}d</p>
                <p className="text-[9px] text-slate-400">left</p>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="mt-3 w-full rounded-xl border border-slate-200 bg-white py-2.5 text-[11px] font-medium text-slate-500 transition-all hover:border-slate-300 hover:text-slate-700 shadow-sm"
          type="button"
        >
          View All Renewals
        </motion.button>
      </motion.div>
    </aside>
  );
}