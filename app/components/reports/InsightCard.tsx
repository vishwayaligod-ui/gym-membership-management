"use client";

import { motion } from "framer-motion";
import { AlertCircle, CheckCircle2, Info, TriangleAlert, type LucideIcon } from "lucide-react";
import type { InsightMessage } from "../../reports/types";

const iconMap: Record<InsightMessage["type"], LucideIcon> = {
  success: CheckCircle2,
  info: Info,
  warning: TriangleAlert,
  alert: AlertCircle,
};

const colorMap: Record<InsightMessage["type"], { bg: string; icon: string; trend: string }> = {
  success: { bg: "bg-emerald-900/20 border-emerald-900/40", icon: "text-emerald-400", trend: "bg-emerald-900/30 text-emerald-400" },
  info: { bg: "bg-blue-900/20 border-blue-900/40", icon: "text-blue-400", trend: "bg-blue-900/30 text-blue-400" },
  warning: { bg: "bg-amber-900/20 border-amber-900/40", icon: "text-amber-400", trend: "bg-amber-900/30 text-amber-400" },
  alert: { bg: "bg-red-900/20 border-red-900/40", icon: "text-red-400", trend: "bg-red-900/30 text-red-400" },
};

type InsightCardProps = {
  items: InsightMessage[];
};

export function InsightCard({ items }: InsightCardProps) {
  return (
    <section className="rounded-xl border border-[#334155] bg-[#1E293B] p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-[#F8FAFC]">Quick Insights</p>
          <p className="text-xs text-[#64748B] mt-0.5">AI-powered observations and alerts</p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {items.map((item, index) => {
          const Icon = iconMap[item.type];
          const colors = colorMap[item.type];
          return (
            <motion.div
              key={`${item.type}-${index}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18, delay: index * 0.05 }}
              className={`flex items-start gap-3 rounded-xl border p-3 ${colors.bg}`}
            >
              <div className={`rounded-xl p-2 ${colors.icon}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#F8FAFC]">{item.message}</p>
              </div>
              <span className={`shrink-0 rounded-md px-2.5 py-1 text-[11px] font-bold ${colors.trend}`}>
                {item.trend}
              </span>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}