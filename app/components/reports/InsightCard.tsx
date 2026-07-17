"use client";

import { motion } from "framer-motion";
import { AlertCircle, CheckCircle2, Info, TriangleAlert, type LucideIcon } from "lucide-react";
import type { InsightMessage } from "../../reports/mockReports";

const iconMap: Record<InsightMessage["type"], LucideIcon> = {
  success: CheckCircle2,
  info: Info,
  warning: TriangleAlert,
  alert: AlertCircle,
};

const colorMap: Record<InsightMessage["type"], { bg: string; icon: string; trend: string }> = {
  success: { bg: "bg-emerald-50", icon: "text-emerald-600", trend: "bg-emerald-100 text-emerald-700" },
  info: { bg: "bg-blue-50", icon: "text-blue-600", trend: "bg-blue-100 text-blue-700" },
  warning: { bg: "bg-amber-50", icon: "text-amber-600", trend: "bg-amber-100 text-amber-700" },
  alert: { bg: "bg-rose-50", icon: "text-rose-600", trend: "bg-rose-100 text-rose-700" },
};

type InsightCardProps = {
  items: InsightMessage[];
};

export function InsightCard({ items }: InsightCardProps) {
  return (
    <section className="rounded-[1.6rem] border border-slate-200 bg-white p-4 shadow-[0_10px_35px_rgba(15,23,42,0.06)] sm:p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-900">Quick Insights</p>
          <p className="text-sm text-slate-500">AI-powered observations and alerts</p>
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
              className={`flex items-start gap-3 rounded-2xl border border-slate-100 p-3 ${colors.bg}`}
            >
              <div className={`rounded-xl p-2 ${colors.icon} ${colors.bg}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800">{item.message}</p>
              </div>
              <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${colors.trend}`}>
                {item.trend}
              </span>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}