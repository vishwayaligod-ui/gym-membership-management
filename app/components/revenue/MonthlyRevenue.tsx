"use client";

import { motion } from "framer-motion";
import type { MonthlyRevenuePoint } from "../../revenue/mockRevenue";

type MonthlyRevenueChartProps = {
  data: MonthlyRevenuePoint[];
};

export function MonthlyRevenueChart({ data }: MonthlyRevenueChartProps) {
  const maxAmount = Math.max(...data.map((d) => d.amount), 1);

  return (
    <section className="rounded-[1.6rem] border border-slate-200 bg-white p-4 shadow-[0_10px_35px_rgba(15,23,42,0.06)] sm:p-5">
      <div>
        <p className="text-sm font-semibold text-slate-900">Monthly Revenue Trend</p>
        <p className="text-sm text-slate-500">Revenue performance across the year</p>
      </div>

      <div className="mt-6">
        <div className="flex items-end justify-between gap-1.5" style={{ height: 180 }}>
          {data.map((point, i) => {
            const heightPct = (point.amount / maxAmount) * 100;
            return (
              <motion.div
                key={point.month}
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: `${heightPct}%`, opacity: 1 }}
                transition={{ duration: 0.3, delay: i * 0.03, ease: "easeOut" }}
                className="group relative flex flex-1 cursor-default items-end justify-center"
              >
                <div className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-2 py-1 text-[10px] font-semibold text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                  ₹{(point.amount / 1000).toFixed(0)}k
                </div>
                <div
                  className="w-full rounded-t-lg bg-gradient-to-t from-blue-600 to-blue-400 transition-all group-hover:from-indigo-600 group-hover:to-indigo-400"
                  style={{ height: "100%", minHeight: 4 }}
                />
              </motion.div>
            );
          })}
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
          {data.map((point) => (
            <div key={point.month} className="flex-1 text-center">
              <p className="text-[10px] font-medium text-slate-500">{point.month}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}