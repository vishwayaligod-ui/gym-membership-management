"use client";

import { ArrowRight, CheckCircle2, Clock3 } from "lucide-react";
import { motion } from "framer-motion";

type ActivityItem = {
  time: string;
  name: string;
  action: string;
};

type ActivityTimelineProps = {
  items: ActivityItem[];
};

export function ActivityTimeline({ items }: ActivityTimelineProps) {
  return (
    <section className="rounded-[1.6rem] border border-slate-200 bg-white p-4 shadow-[0_10px_35px_rgba(15,23,42,0.06)] sm:p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-900">Recent Activity</p>
          <p className="text-sm text-slate-500">Today&apos;s latest check-ins</p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {items.map((item, index) => (
          <motion.div
            key={`${item.time}-${item.name}`}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.16, delay: index * 0.04 }}
            className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-50 to-white px-3 py-3"
          >
            <div className="mt-0.5 rounded-2xl bg-blue-600/10 p-2 text-blue-600">
              {item.action.includes("Checked Out") ? <Clock3 className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-500">{item.time}</span>
              </div>
              <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                <span>{item.action}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
