"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import type { RevenueDataPoint } from "../../reports/mockReports";

type RangeKey = "daily" | "weekly" | "monthly" | "yearly";

type RevenueChartProps = {
  data: Record<RangeKey, RevenueDataPoint[]>;
};

const rangeTabs: { key: RangeKey; label: string }[] = [
  { key: "daily", label: "Daily" },
  { key: "weekly", label: "Weekly" },
  { key: "monthly", label: "Monthly" },
  { key: "yearly", label: "Yearly" },
];

export function RevenueChart({ data }: RevenueChartProps) {
  const [activeRange, setActiveRange] = useState<RangeKey>("monthly");

  const bars: RevenueDataPoint[] = data[activeRange];
  const maxAmount = Math.max(...bars.map((b) => b.amount), 1);

  return (
    <section className="rounded-[1.6rem] border border-slate-200 bg-white p-4 shadow-[0_10px_35px_rgba(15,23,42,0.06)] sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-900">Revenue Overview</p>
          <p className="text-sm text-slate-500">Membership and fee revenue trends</p>
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {rangeTabs.map((tab) => {
            const active = tab.key === activeRange;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveRange(tab.key)}
                className={`shrink-0 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
                  active
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                    : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div className="flex items-end justify-between gap-1.5" style={{ height: 160 }}>
          {bars.map((bar, i) => {
            const heightPct = (bar.amount / maxAmount) * 100;
            return (
              <motion.div
                key={bar.label}
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: `${heightPct}%`, opacity: 1 }}
                transition={{ duration: 0.3, delay: i * 0.04, ease: "easeOut" }}
                className="group relative flex flex-1 cursor-default items-end justify-center"
              >
                <div
                  className="w-full rounded-lg bg-gradient-to-t from-blue-600 to-blue-400 transition-all group-hover:from-indigo-600 group-hover:to-indigo-400"
                  style={{ height: "100%", minHeight: 6 }}
                />
                <div className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-2 py-1 text-[11px] font-semibold text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                  ₹{bar.amount.toLocaleString("en-US")}
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="hidden sm:flex sm:flex-col sm:justify-end">
          <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
              Total ({activeRange})
            </p>
            <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
              ₹{bars.reduce((s, b) => s + b.amount, 0).toLocaleString("en-US")}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {bars.slice(-3).map((b) => (
                <span
                  key={b.label}
                  className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600 shadow-sm"
                >
                  {b.label} · ₹{b.amount.toLocaleString("en-US")}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
        {bars.map((bar) => (
          <div key={bar.label} className="flex-1 text-center">
            <p className="text-[11px] font-medium text-slate-500">{bar.label}</p>
            <p className="mt-0.5 text-[10px] font-semibold text-slate-700 sm:hidden">
              ₹{(bar.amount / 1000).toFixed(0)}k
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}