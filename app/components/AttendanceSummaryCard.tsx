"use client";

import { type LucideIcon } from "lucide-react";

type AttendanceSummaryCardProps = {
  label: string;
  value: string;
  tone: string;
  icon: LucideIcon;
};

export function AttendanceSummaryCard({ label, value, tone, icon: Icon }: AttendanceSummaryCardProps) {
  return (
    <article className="rounded-[1.4rem] border border-slate-200 bg-white p-4 shadow-[0_10px_35px_rgba(15,23,42,0.06)]">
      <div className={`inline-flex rounded-2xl p-2 ${tone}`}>
        <Icon className="h-4 w-4" />
      </div>
      <p className="mt-4 text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">{value}</p>
    </article>
  );
}
