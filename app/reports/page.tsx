"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Activity, AlertTriangle, IndianRupee, Users, UserPlus, CheckCircle2, CreditCard, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

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
  const router = useRouter();

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

  // Mock activity data
  const activityLogs = [
    {
      id: 1,
      type: "join",
      memberName: "Rahul Gupta",
      description: "Joined with Platinum plan",
      timestamp: "10 min ago",
      icon: UserPlus,
      color: "bg-blue-50 text-blue-600",
    },
    {
      id: 2,
      type: "renewal",
      memberName: "Priya Singh",
      description: "Renewed Premium membership for 6 months",
      timestamp: "2 hours ago",
      icon: CheckCircle2,
      color: "bg-emerald-50 text-emerald-600",
    },
    {
      id: 3,
      type: "payment",
      memberName: "Amit Kumar",
      description: "Payment received for Classic plan",
      timestamp: "5 hours ago",
      icon: CreditCard,
      color: "bg-purple-50 text-purple-600",
    },
    {
      id: 4,
      type: "expired",
      memberName: "Sneha Patel",
      description: "Membership expired, pending renewal",
      timestamp: "1 day ago",
      icon: Activity,
      color: "bg-rose-50 text-rose-600",
    },
  ];

  const quickActions = [
    { label: "View Members", icon: Users, color: "from-blue-600 to-blue-700", route: "/members" },
    { label: "Renew Membership", icon: CheckCircle2, color: "from-emerald-600 to-emerald-700", route: "/renewals/add" },
    { label: "Payment History", icon: CreditCard, color: "from-purple-600 to-purple-700", route: "/payment-history" },
    { label: "Attendance", icon: Activity, color: "from-amber-600 to-amber-700", route: "/attendance" },
  ];

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
                <p className="text-sm text-slate-500">This week&#39;s check-in percentage</p>
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

          {/* -------- Recent Activity Timeline -------- */}
          <section className="rounded-[1.6rem] border border-slate-200 bg-white p-4 shadow-[0_10px_35px_rgba(15,23,42,0.06)] sm:p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">Recent Activity</p>
                <p className="text-sm text-slate-500">Latest membership events</p>
              </div>
              <button className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700">
                View All
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              {activityLogs.map((activity, idx) => {
                const Icon = activity.icon;
                return (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.5 + idx * 0.05 }}
                    className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50/50 p-3 hover:bg-slate-50 transition"
                  >
                    <div className={`rounded-2xl p-2 ${activity.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-slate-900">{activity.memberName}</p>
                        <p className="shrink-0 text-xs text-slate-500">{activity.timestamp}</p>
                      </div>
                      <p className="mt-0.5 text-sm text-slate-600">{activity.description}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </section>

          {/* -------- Quick Actions -------- */}
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((action, idx) => {
              const Icon = action.icon;
              return (
                <motion.button
                  key={idx}
                  onClick={() => router.push(action.route)}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.7 + idx * 0.05 }}
                  whileHover={{ y: -4 }}
                  className={`group rounded-[1.6rem] bg-gradient-to-br ${action.color} p-4 shadow-[0_10px_35px_rgba(15,23,42,0.06)] transition-all hover:shadow-[0_15px_45px_rgba(15,23,42,0.12)] sm:p-5`}
                >
                  <div className="rounded-2xl bg-white/20 p-3 w-fit group-hover:bg-white/30 transition">
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <p className="mt-3 text-left text-sm font-semibold text-white">{action.label}</p>
                  <p className="mt-1 text-left text-xs text-white/70 group-hover:text-white/90">Quick access</p>
                </motion.button>
              );
            })}
          </section>

          {/* -------- Quick Insights -------- */}
          <InsightCard items={mockQuickInsights} />
        </div>
      </PageContainer>

      <BottomNavigation />
    </div>
  );
}