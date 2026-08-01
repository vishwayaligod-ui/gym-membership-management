"use client";

import { Users, UserCheck, UserX, PieChart, Calendar, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { type Member, planColors } from "@/app/members/types";

type QuickPanelProps = {
  members: Member[];
};

export function QuickPanel({ members }: QuickPanelProps) {
  const totalMembers = members.length;
  const activeMembers = members.filter((m) => m.status === "Active").length;
  const expiredMembers = members.filter((m) => m.status === "Expired").length;

  // Members by plan
  const planCounts: Record<string, number> = {};
  members.forEach((m) => {
    planCounts[m.plan] = (planCounts[m.plan] || 0) + 1;
  });
  const sortedPlans = Object.entries(planCounts).sort((a, b) => b[1] - a[1]);

  // Gender distribution
  const maleCount = members.filter((m) => m.gender === "Male").length;
  const femaleCount = members.filter((m) => m.gender === "Female").length;

  // Recent registrations (last 3)
  const recentRegistrations = [...members]
    .sort((a, b) => {
      const dateA = new Date(a.joinedOn);
      const dateB = new Date(b.joinedOn);
      return dateB.getTime() - dateA.getTime();
    })
    .slice(0, 3);

  const getPlanBarColor = (plan: string) => {
    switch (plan) {
      case "Platinum": return "bg-blue-500";
      case "Premium": return "bg-purple-500";
      case "Classic": return "bg-emerald-500";
      case "Basic": return "bg-slate-500";
      default: return "bg-slate-500";
    }
  };

  return (
    <div className="w-[320px] shrink-0 flex flex-col gap-4">
      {/* Members by Plan */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-5 flex-1"
      >
        <div className="mb-4 flex items-center gap-2">
          <div className="rounded-lg bg-blue-900/30 p-1.5">
            <PieChart className="h-3.5 w-3.5 text-blue-400" />
          </div>
          <p className="text-sm font-bold text-slate-200">Members by Plan</p>
        </div>
        <div className="space-y-3">
          {sortedPlans.map(([plan, count]) => {
            const percentage = Math.round((count / totalMembers) * 100);
            const planColor = planColors[plan] || "text-slate-400";
            return (
              <div key={plan}>
                <div className="mb-1.5 flex items-center justify-between">
                  <span className={`text-[11px] font-semibold ${planColor.split(" ")[2] || "text-slate-400"}`}>
                    {plan}
                  </span>
                  <span className="text-[11px] font-bold text-slate-300">{count}</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-700/60">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className={`h-full rounded-full ${getPlanBarColor(plan)}`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Active vs Expired */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-5 flex-1"
      >
        <div className="mb-4 flex items-center gap-2">
          <div className="rounded-lg bg-emerald-900/30 p-1.5">
            <UserCheck className="h-3.5 w-3.5 text-emerald-400" />
          </div>
          <p className="text-sm font-bold text-slate-200">Active vs Expired</p>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-900/30">
              <UserCheck className="h-4 w-4 text-emerald-400" />
            </div>
            <div>
              <p className="text-lg font-bold text-slate-200">{activeMembers}</p>
              <p className="text-[10px] font-medium text-slate-500">Active</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-900/30">
              <UserX className="h-4 w-4 text-red-400" />
            </div>
            <div>
              <p className="text-lg font-bold text-slate-200">{expiredMembers}</p>
              <p className="text-[10px] font-medium text-slate-500">Expired</p>
            </div>
          </div>
        </div>
        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-700/60">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(activeMembers / totalMembers) * 100}%` }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="h-full rounded-full bg-emerald-500"
          />
        </div>
        <p className="mt-2 text-[10px] font-medium text-slate-500">
          {Math.round((activeMembers / totalMembers) * 100)}% active rate
        </p>
      </motion.div>

      {/* Gender Distribution */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.25 }}
        className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-5 flex-1"
      >
        <div className="mb-4 flex items-center gap-2">
          <div className="rounded-lg bg-purple-900/30 p-1.5">
            <Users className="h-3.5 w-3.5 text-purple-400" />
          </div>
          <p className="text-sm font-bold text-slate-200">Gender Distribution</p>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-900/30">
              <Users className="h-4 w-4 text-blue-400" />
            </div>
            <div>
              <p className="text-lg font-bold text-slate-200">{maleCount}</p>
              <p className="text-[10px] font-medium text-slate-500">Male</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-900/30">
              <Users className="h-4 w-4 text-pink-400" />
            </div>
            <div>
              <p className="text-lg font-bold text-slate-200">{femaleCount}</p>
              <p className="text-[10px] font-medium text-slate-500">Female</p>
            </div>
          </div>
        </div>
        <div className="mt-4 flex h-2 w-full overflow-hidden rounded-full bg-slate-700/60">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(maleCount / totalMembers) * 100}%` }}
            transition={{ duration: 0.6, delay: 0.45 }}
            className="h-full rounded-l-full bg-blue-500"
          />
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(femaleCount / totalMembers) * 100}%` }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="h-full rounded-r-full bg-pink-500"
          />
        </div>
      </motion.div>

      {/* Recent Registrations */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-5 flex-1"
      >
        <div className="mb-4 flex items-center gap-2">
          <div className="rounded-lg bg-amber-900/30 p-1.5">
            <Calendar className="h-3.5 w-3.5 text-amber-400" />
          </div>
          <p className="text-sm font-bold text-slate-200">Recent Registrations</p>
        </div>
        <div className="space-y-3">
          {recentRegistrations.map((member, idx) => (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.35 + idx * 0.06 }}
              className="flex items-center gap-3"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white shadow-sm">
                {member.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-semibold text-slate-200 truncate">{member.name}</p>
                <p className="text-[10px] font-medium text-slate-500 truncate">{member.plan} Plan</p>
              </div>
              <span className="shrink-0 text-[10px] font-medium text-slate-500">{member.joinedOn.split(",")[0]}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}