"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Activity, AlertTriangle, IndianRupee, Users } from "lucide-react";

import { AppHeader } from "../components/AppHeader";
import { AttendanceSummaryCard } from "../components/AttendanceSummaryCard";
import { BottomNavigation } from "../components/BottomNavigation";
import { PageContainer } from "../components/PageContainer";
import { RevenueChart } from "../components/reports/RevenueChart";
import { InsightCard } from "../components/reports/InsightCard";
import {
  mockRevenueTrends,
  mockAttendanceData,
  mockMembershipStats,
  mockExpiringMemberships,
  mockQuickInsights,
} from "./mockReports";

export default function ReportsPage() {
  // ---- Computed KPIs ----
  const kpis = useMemo(() => {
    const totalRevenue = Object.values(mockRevenueTrends)
      .flat()
      .reduce((sum, d) => sum + d.amount, 0);

    const activeMembers = mockMembershipStats.reduce((sum, m) => sum + m.count, 0);

    // "Thu" = Thursday = index 3 in mockAttendanceData
    const todayAttendance = mockAttendanceData[3]?.checkIns ?? 0;

    return { totalRevenue, activeMembers, todayAttendance };
  }, []);

  const hasExpiringSoon = mockExpiringMemberships.length;

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,_#f5f8ff_0%,_#eef5ff_100%)] text-slate-900">
      <AppHeader title="Reports" />

      <PageContainer>
        <div className="space-y-4">
          {/* -------- Header -------- */}
          <div>
            <p className="text-2xl font-semibold tracking-tight text-slate-950">Reports</p>
            <p className="mt-1 text-sm text-slate-500">
              Analytics, insights, and membership overview
            </p>
          </div>

          {/* -------- Summary KPI Cards -------- */}
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <AttendanceSummaryCard
              label="Total Revenue"
              value={`₹${kpis.totalRevenue.toLocaleString("en-US")}`}
              tone="bg-emerald-50 text-emerald-700"
              icon={IndianRupee}
            />
            <AttendanceSummaryCard
              label="Active Members"
              value={kpis.activeMembers.toLocaleString("en-US")}
              tone="bg-blue-50 text-blue-700"
              icon={Users}
            />
            <AttendanceSummaryCard
              label="Today's Attendance"
              value={kpis.todayAttendance.toString()}
              tone="bg-amber-50 text-amber-700"
              icon={Activity}
            />
            <AttendanceSummaryCard
              label="Expiring Memberships"
              value={hasExpiringSoon.toString()}
              tone="bg-rose-50 text-rose-700"
              icon={AlertTriangle}
            />
          </section>

          {/* -------- Revenue Overview (Chart) -------- */}
          <RevenueChart data={mockRevenueTrends} />

          {/* -------- Attendance Overview -------- */}
          <section className="rounded-[1.6rem] border border-slate-200 bg-white p-4 shadow-[0_10px_35px_rgba(15,23,42,0.06)] sm:p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">Attendance Overview</p>
                <p className="text-sm text-slate-500">This week's check-in percentage</p>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {mockAttendanceData.map((day, i) => {
                let barColor = "bg-blue-500";
                if (day.percentage >= 85) barColor = "bg-emerald-500";
                else if (day.percentage >= 70) barColor = "bg-blue-500";
                else if (day.percentage >= 55) barColor = "bg-amber-500";
                else barColor = "bg-rose-400";

                return (
                  <motion.div
                    key={day.day}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: i * 0.03 }}
                    className="flex items-center gap-3"
                  >
                    <span className="w-8 text-right text-xs font-semibold text-slate-600">
                      {day.day}
                    </span>
                    <div className="flex-1 rounded-full bg-slate-100 h-7 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${day.percentage}%` }}
                        transition={{ duration: 0.4, delay: i * 0.03, ease: "easeOut" }}
                        className={`flex h-full items-center justify-end rounded-full px-3 ${barColor}`}
                      >
                        <span className="text-[11px] font-semibold text-white drop-shadow-sm">
                          {day.checkIns}
                        </span>
                      </motion.div>
                    </div>
                    <span className="w-12 text-right text-xs font-semibold text-slate-500">
                      {day.percentage}%
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </section>

          {/* -------- Membership Statistics -------- */}
          <section className="rounded-[1.6rem] border border-slate-200 bg-white p-4 shadow-[0_10px_35px_rgba(15,23,42,0.06)] sm:p-5">
            <div>
              <p className="text-sm font-semibold text-slate-900">Membership Statistics</p>
              <p className="text-sm text-slate-500">Tier-wise distribution and share</p>
            </div>

            <div className="mt-5 space-y-4">
              {mockMembershipStats.map((tier, i) => {
                const colorClass = tier.color.split(" ")[0]; // e.g. "bg-blue-600"
                const textColor = tier.color.split(" ")[1]; // e.g. "text-blue-600"
                return (
                  <motion.div
                    key={tier.tier}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: i * 0.06 }}
                    className="space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold text-slate-800">{tier.tier}</span>
                      <span className="font-medium text-slate-600">
                        {tier.count} ({tier.percentage}%)
                      </span>
                    </div>
                    <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${tier.percentage}%` }}
                        transition={{ duration: 0.4, delay: i * 0.06, ease: "easeOut" }}
                        className={`h-full rounded-full ${colorClass}`}
                      />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </section>

          {/* -------- Expiring Memberships -------- */}
          <section className="rounded-[1.6rem] border border-slate-200 bg-white p-4 shadow-[0_10px_35px_rgba(15,23,42,0.06)] sm:p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">Expiring Memberships</p>
                <p className="text-sm text-slate-500">Members whose plans are ending soon</p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {mockExpiringMemberships.map((member, i) => {
                let badgeColor = "bg-emerald-50 text-emerald-700 ring-emerald-200";
                let daysText = `In ${member.daysRemaining} Days`;
                if (member.daysRemaining === 0) {
                  badgeColor = "bg-rose-50 text-rose-700 ring-rose-200";
                  daysText = "Expires Today";
                } else if (member.daysRemaining <= 3) {
                  badgeColor = "bg-amber-50 text-amber-700 ring-amber-200";
                }

                return (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: i * 0.04 }}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 px-3 py-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-500 text-sm font-semibold text-white">
                        {member.avatar}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">{member.name}</p>
                        <p className="text-xs text-slate-500">{member.plan} · {member.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="hidden sm:inline text-xs text-slate-500">{member.expiryDate}</span>
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${badgeColor}`}>
                        {daysText}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </section>

          {/* -------- Quick Insights -------- */}
          <InsightCard items={mockQuickInsights} />
        </div>
      </PageContainer>

      <BottomNavigation />
    </div>
  );
}