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
    <article className="rounded-xl border border-[#334155] bg-[#1E293B] p-6 shadow-sm">
      <div className={`inline-flex rounded-xl p-2.5 ${tone}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-4 text-xs font-medium text-[#64748B]">{label}</p>
      <p className="mt-1 text-2xl font-bold tracking-tight text-[#F8FAFC]">{value}</p>
    </article>
  );
}