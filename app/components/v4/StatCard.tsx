"use client";

import { type ReactNode } from "react";
import { Card } from "./Card";
import { FadeUp } from "./MotionDiv";

type StatCardProps = {
  icon: ReactNode;
  iconBgClass?: string;
  label: string;
  value: string | number;
  subtext?: string;
  delay?: number;
};

export function StatCard({ icon, iconBgClass = "bg-blue-50", label, value, subtext, delay = 0 }: StatCardProps) {
  return (
    <FadeUp delay={delay}>
      <Card padding="sm" shadow="sm">
        <div className="flex items-center gap-2">
          <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${iconBgClass}`}>
            {icon}
          </div>
          <span className="text-[10px] font-medium uppercase tracking-[0.06em] text-slate-500">
            {label}
          </span>
        </div>
        <p className="mt-2 text-[22px] font-semibold tabular-nums text-slate-900">
          {value}
        </p>
        {subtext && (
          <p className="mt-0.5 text-[10px] text-slate-400">{subtext}</p>
        )}
      </Card>
    </FadeUp>
  );
}