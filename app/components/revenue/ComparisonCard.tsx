"use client";

import { motion } from "framer-motion";
import { TrendingDown, TrendingUp } from "lucide-react";
import type { RevenueComparison } from "../../revenue/mockRevenue";

type ComparisonCardProps = {
  data: RevenueComparison;
  index: number;
};

export function ComparisonCard({ data, index }: ComparisonCardProps) {
  const isUp = data.trend === "up";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.05, ease: "easeOut" }}
      className="rounded-[1.4rem] border border-slate-200 bg-white p-4 shadow-[0_10px_35px_rgba(15,23,42,0.06)]"
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{data.label}</p>
        <div
          className={`inline-flex rounded-full p-1.5 ${
            isUp ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
          }`}
        >
          {isUp ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
        </div>
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <p className="text-2xl font-semibold tracking-tight text-slate-900">{data.current}</p>
        <span
          className={`text-sm font-semibold ${
            isUp ? "text-emerald-600" : "text-rose-600"
          }`}
        >
          {isUp ? "+" : ""}{data.percentage}%
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
        <span className="text-xs text-slate-500">Previous</span>
        <span className="text-xs font-semibold text-slate-700">{data.previous}</span>
      </div>
    </motion.div>
  );
}