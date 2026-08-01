"use client";

import { TrendingUp, ArrowUpRight, Users, Activity, Flame, DollarSign } from "lucide-react";
import { Card } from "./Card";
import { StatCard } from "./StatCard";
import { FadeUp } from "./MotionDiv";

type RevenuePanelProps = {
  totalRevenue: number;
  activeMembers: number;
  totalMembers: number;
  totalVisits: number;
  avgStreak: number;
  mtdRevenue: number;
};

export function RevenuePanel({
  totalRevenue,
  activeMembers,
  totalMembers,
  totalVisits,
  avgStreak,
  mtdRevenue,
}: RevenuePanelProps) {
  return (
    <FadeUp delay={0.15} className="w-[420px] shrink-0">
      {/* Large Revenue Card */}
      <Card shadow="lg">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-slate-500">
            Total Revenue
          </span>
          <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-600">
            <ArrowUpRight className="h-3 w-3" />
            +12.5%
          </span>
        </div>
        <p className="mt-2 font-serif text-[36px] font-semibold tracking-tight text-slate-900">
          ₹{(totalRevenue / 100000).toFixed(1)}L
        </p>
        <div className="mt-4 flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-50">
            <TrendingUp className="h-3.5 w-3.5 text-blue-600" />
          </div>
          <span className="text-[12px] text-slate-500">
            <span className="font-medium text-emerald-600">+₹{(totalRevenue * 0.125 / 1000).toFixed(0)}K</span> vs last month
          </span>
        </div>
      </Card>

      {/* 2x2 Stat Cards */}
      <div className="mt-3 grid grid-cols-2 gap-3">
        <StatCard
          icon={<Users className="h-3.5 w-3.5 text-blue-600" />}
          iconBgClass="bg-blue-50"
          label="Active"
          value={activeMembers}
          subtext={`of ${totalMembers} members`}
          delay={0.2}
        />
        <StatCard
          icon={<Activity className="h-3.5 w-3.5 text-emerald-600" />}
          iconBgClass="bg-emerald-50"
          label="Visits"
          value={totalVisits}
          subtext="total this month"
          delay={0.25}
        />
        <StatCard
          icon={<Flame className="h-3.5 w-3.5 text-amber-600" />}
          iconBgClass="bg-amber-50"
          label="Streak"
          value={avgStreak}
          subtext="avg days"
          delay={0.3}
        />
        <StatCard
          icon={<DollarSign className="h-3.5 w-3.5 text-blue-600" />}
          iconBgClass="bg-blue-50"
          label="MTD"
          value={`₹${(mtdRevenue / 1000).toFixed(0)}K`}
          subtext="month to date"
          delay={0.35}
        />
      </div>
    </FadeUp>
  );
}