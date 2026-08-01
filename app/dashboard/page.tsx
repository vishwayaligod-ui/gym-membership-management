"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import {
  UserCheck,
  IndianRupee,
  Activity,
  UserPlus,
  CreditCard,
  CheckCircle2,
  TrendingUp,
  Bell,
  ArrowRight,
  Loader2,
  AlertCircle,
} from "lucide-react";

type DashboardStats = {
  totalMembers: number;
  activeMembers: number;
  expiringSoon: number;
  expiredMembers: number;
  todayCheckIns: number;
  currentActiveCheckIns: number;
  todayRevenue: number;
  monthlyRevenue: number;
  totalRevenue: number;
};

type RecentPayment = {
  id: string;
  memberId: string;
  memberName: string;
  plan: string;
  amount: number;
  paymentMode: string;
  paymentDate: string;
  avatar: string;
  transactionId: string | null;
};

type RecentRenewal = {
  id: string;
  memberId: string;
  memberName: string;
  plan: string;
  amount: number;
  startDate: string;
  endDate: string;
  avatar: string;
  status: string;
};

type RecentRegistration = {
  id: string;
  name: string;
  memberCode: string;
  gender: string;
  phone: string;
  avatar: string;
  joinedAt: string;
  timeAgo: string;
};

type RevenueDataPoint = {
  label: string;
  amount: number;
};

type MembershipDistItem = {
  tier: string;
  count: number;
  percentage: number;
  color: string;
};

type AttendanceSlot = {
  time: string;
  count: number;
  percentage: number;
};

type QuickInsight = {
  type: "success" | "info" | "warning" | "alert";
  message: string;
  trend: string;
};

type DashboardData = {
  stats: DashboardStats;
  recentPayments: RecentPayment[];
  recentRenewals: RecentRenewal[];
  recentRegistrations: RecentRegistration[];
  revenueChart: RevenueDataPoint[];
  membershipDistribution: MembershipDistItem[];
  attendanceSummary: AttendanceSlot[];
  quickInsights: QuickInsight[];
};

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        setLoading(true);
        const res = await fetch("/api/dashboard");
        if (!res.ok) {
          throw new Error("Failed to fetch dashboard data");
        }
        const json = await res.json();
        setData(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  // Get today's date
  const today = new Date();
  const dateString = today.toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Greeting based on time
  const hour = today.getHours();
  const greeting =
    hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";

  // Quick Actions — enriched subtitles
  const quickActions = [
    {
      label: "Add Member",
      subtitle: "Register a new member",
      icon: UserPlus,
      route: "/members/add",
    },
    {
      label: "Renew Membership",
      subtitle: "Extend an existing plan",
      icon: CheckCircle2,
      route: "/renewals/add",
    },
    {
      label: "Payment History",
      subtitle: "View all transactions",
      icon: CreditCard,
      route: "/payment-history",
    },
    {
      label: "Attendance",
      subtitle: "Track daily check-ins",
      icon: Activity,
      route: "/attendance",
    },
  ];

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-[#3B82F6]" />
          <p className="text-sm font-medium text-[#64748B]">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4 max-w-md text-center">
          <AlertCircle className="h-10 w-10 text-red-400" />
          <p className="text-sm font-medium text-[#F8FAFC]">Failed to load dashboard</p>
          <p className="text-xs text-[#64748B]">{error || "No data available"}</p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-lg bg-[#3B82F6]/10 px-4 py-2 text-xs font-semibold text-[#3B82F6] hover:bg-[#3B82F6]/20 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { stats, recentPayments, recentRenewals, recentRegistrations, revenueChart, membershipDistribution, attendanceSummary, quickInsights } = data;

  // Map recent payments to upcoming renewals format
  const upcomingRenewals = recentRenewals.slice(0, 5).map((r, idx) => {
    const daysUntil = Math.ceil(
      (new Date(r.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    return {
      id: idx + 1,
      name: r.memberName,
      plan: r.plan,
      daysUntil: Math.max(0, daysUntil),
      amount: r.amount,
      avatar: r.avatar,
    };
  });

  // Map recent payments to pending payments format (show latest 3)
  const pendingPayments = recentPayments.slice(0, 3).map((p, idx) => {
    const daysOverdue = Math.floor(
      (new Date().getTime() - new Date(p.paymentDate).getTime()) / (1000 * 60 * 60 * 24)
    );
    return {
      id: idx + 1,
      name: p.memberName,
      amount: p.amount,
      daysOverdue: Math.max(0, daysOverdue),
      plan: p.plan,
      avatar: p.avatar,
    };
  });

  // Revenue summary from membership distribution
  const revenueSummary = membershipDistribution.length > 0
    ? membershipDistribution.slice(0, 4).map((item) => ({
        category: `${item.tier} Plan`,
        amount: Math.round(stats.totalRevenue * (item.percentage / 100)),
        percentage: item.percentage,
      }))
    : [
        { category: "Membership Revenue", amount: stats.totalRevenue, percentage: 100 },
      ];

  // Recent Activity Timeline
  const recentActivity = [
    ...recentRegistrations.slice(0, 2).map((r) => ({
      id: `reg-${r.id}`,
      type: "member" as const,
      title: "New Member Joined",
      description: `${r.name} registered`,
      time: r.timeAgo,
      icon: UserPlus,
    })),
    ...recentPayments.slice(0, 2).map((p) => ({
      id: `pay-${p.id}`,
      type: "payment" as const,
      title: "Payment Received",
      description: `${formatCurrency(p.amount)} received from ${p.memberName}`,
      time: getTimeAgoFromDate(p.paymentDate),
      icon: CreditCard,
    })),
    ...recentRenewals.slice(0, 2).map((r) => ({
      id: `ren-${r.id}`,
      type: "renewal" as const,
      title: "Membership Renewed",
      description: `${r.memberName} renewed ${r.plan} plan`,
      time: getTimeAgoFromDate(r.startDate),
      icon: CheckCircle2,
    })),
    {
      id: "attendance-today",
      type: "attendance" as const,
      title: "Attendance Recorded",
      description: `${stats.todayCheckIns} members checked in today`,
      time: "Today",
      icon: Activity,
    },
  ];

  // Notifications Preview
  const notifications = [
    ...(stats.expiringSoon > 0
      ? [
          {
            id: 1,
            title: `${stats.expiringSoon} membership${stats.expiringSoon > 1 ? "s" : ""} expiring soon`,
            description: "Renewals needed within 30 days",
            priority: "high" as const,
          },
        ]
      : []),
    ...(stats.expiredMembers > 0
      ? [
          {
            id: 2,
            title: `${stats.expiredMembers} expired membership${stats.expiredMembers > 1 ? "s" : ""}`,
            description: `Total impact: ${formatCurrency(stats.expiredMembers * 5000)}`,
            priority: "medium" as const,
          },
        ]
      : []),
    ...(stats.currentActiveCheckIns > 0
      ? [
          {
            id: 3,
            title: `${stats.currentActiveCheckIns} active check-ins right now`,
            description: "Members currently in the gym",
            priority: "medium" as const,
          },
        ]
      : []),
  ];

  if (notifications.length === 0) {
    notifications.push({
      id: 1,
      title: "All clear",
      description: "No pending notifications",
      priority: "medium" as const,
    });
  }

  return (
    <div className="space-y-8">
      {/* ── HERO SECTION ── */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600/90 via-blue-700/80 to-indigo-800/90 px-8 py-5 shadow-lg shadow-blue-900/20"
      >
        {/* Decorative blurred circles */}
        <div className="pointer-events-none absolute -top-12 -right-12 h-52 w-52 rounded-full bg-white/5 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-10 h-44 w-44 rounded-full bg-indigo-400/10 blur-3xl" />

        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          {/* LEFT — greeting + identity */}
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <p className="text-sm font-semibold tracking-wide text-blue-200 uppercase">
              {greeting}
            </p>
            <h1 className="mt-2 text-2xl font-extrabold leading-tight tracking-tight text-white sm:text-3xl">
              Elite Fitness Studio
            </h1>
            <p className="mt-2 text-sm text-blue-200">{dateString}</p>
            <p className="mt-3 text-base font-medium text-white/70">
              &ldquo;Let's build stronger members today.&rdquo;
            </p>
          </motion.div>

          {/* RIGHT — hero stats panel */}
          <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:gap-4">
            {[
              { icon: Activity, label: "Today's Attendance", value: String(stats.todayCheckIns) },
              { icon: IndianRupee, label: "Today's Revenue", value: formatCurrency(stats.todayRevenue) },
              { icon: UserCheck, label: "Active Members", value: String(stats.activeMembers) },
            ].map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: 0.2 + idx * 0.08 }}
                  whileHover={{ y: -3 }}
                  className="flex min-w-[110px] flex-col gap-1.5 rounded-xl bg-white/10 border border-white/10 px-4 py-3 hover:bg-white/15 transition-colors"
                >
                  <Icon className="h-5 w-5 text-blue-200" />
                  <p className="text-xl font-bold text-white">{stat.value}</p>
                  <p className="text-xs font-medium text-blue-200 leading-tight">{stat.label}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {quickActions.map((action, idx) => {
          const Icon = action.icon;
          return (
            <motion.button
              key={idx}
              onClick={() => router.push(action.route)}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15 + idx * 0.08 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              whileTap={{ scale: 0.98 }}
              className="group rounded-xl border border-[#334155] bg-[#1E293B] p-5 text-left shadow-sm transition-all hover:border-[#475569] hover:bg-[#273449] hover:shadow-md sm:p-6"
            >
              <div className="flex items-center justify-between">
                <div className="rounded-xl bg-[#3B82F6]/10 p-3 ring-1 ring-[#3B82F6]/20">
                  <Icon className="h-6 w-6 text-[#3B82F6]" />
                </div>
                <ArrowRight className="h-4 w-4 text-[#64748B] opacity-0 transition-all group-hover:opacity-100 group-hover:text-[#3B82F6]" />
              </div>
              <p className="mt-5 text-base font-bold leading-tight text-[#F8FAFC]">{action.label}</p>
              <p className="mt-1 text-xs font-medium text-[#64748B]">{action.subtitle}</p>
            </motion.button>
          );
        })}
      </section>

      {/* Upcoming Renewals + Pending Payments */}
      <div className="grid gap-6 sm:grid-cols-2">
        {/* Upcoming Renewals */}
        <motion.section
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="rounded-xl border border-[#334155] bg-[#1E293B] p-6 shadow-sm"
        >
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-base font-bold text-[#F8FAFC]">Recent Renewals</p>
              <p className="text-xs text-[#64748B] mt-0.5">Latest memberships</p>
            </div>
            <button
              onClick={() => router.push("/renewals")}
              className="flex items-center gap-1 rounded-lg bg-[#3B82F6]/10 px-3 py-1.5 text-xs font-semibold text-[#3B82F6] hover:bg-[#3B82F6]/20 transition-colors"
            >
              View All
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          <div className="space-y-2.5">
            {upcomingRenewals.length > 0 ? (
              upcomingRenewals.map((renewal, idx) => {
                const planColor: Record<string, string> = {
                  Platinum: "bg-blue-900/30 text-blue-400",
                  Premium: "bg-purple-900/30 text-purple-400",
                  Classic: "bg-slate-700/30 text-slate-400",
                };
                const countdownLabel =
                  renewal.daysUntil === 0
                    ? "Today"
                    : renewal.daysUntil === 1
                    ? "Tomorrow"
                    : `${renewal.daysUntil} Days`;
                const urgency =
                  renewal.daysUntil <= 1
                    ? "bg-red-900/30 text-red-400"
                    : renewal.daysUntil <= 3
                    ? "bg-amber-900/30 text-amber-400"
                    : "bg-emerald-900/30 text-emerald-400";

                return (
                  <motion.div
                    key={renewal.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.25 + idx * 0.05 }}
                    whileHover={{ y: -2, transition: { duration: 0.15 } }}
                    className="flex items-center gap-3 rounded-xl border border-[#334155]/60 bg-[#0F172A]/50 p-3 transition-all hover:bg-[#273449]"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#3B82F6] text-xs font-bold text-white shadow-sm">
                      {renewal.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#F8FAFC] truncate">{renewal.name}</p>
                      <div className="mt-1 flex items-center gap-1.5">
                        <span className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${planColor[renewal.plan] ?? "bg-slate-700/30 text-slate-400"}`}>
                          {renewal.plan}
                        </span>
                        <span className="text-xs text-[#64748B]">₹{renewal.amount.toLocaleString()}</span>
                      </div>
                    </div>
                    <span className={`shrink-0 rounded-md px-2.5 py-1 text-[10px] font-bold ${urgency}`}>
                      {countdownLabel}
                    </span>
                  </motion.div>
                );
              })
            ) : (
              <p className="text-center text-sm text-[#64748B] py-4">No recent renewals</p>
            )}
          </div>
        </motion.section>

        {/* Recent Payments */}
        <motion.section
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="rounded-xl border border-[#334155] bg-[#1E293B] p-6 shadow-sm"
        >
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-base font-bold text-[#F8FAFC]">Recent Payments</p>
              <p className="text-xs text-[#64748B] mt-0.5">Latest transactions</p>
            </div>
            <button
              onClick={() => router.push("/payment-history")}
              className="flex items-center gap-1 rounded-lg bg-emerald-900/20 px-3 py-1.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-900/30 transition-colors"
            >
              View All
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          <div className="space-y-2.5">
            {pendingPayments.length > 0 ? (
              pendingPayments.map((payment, idx) => {
                const isCritical = payment.daysOverdue > 10;
                const avatarColor = isCritical
                  ? "bg-emerald-500"
                  : "bg-emerald-500";
                const badgeStyle = isCritical
                  ? "bg-emerald-900/30 text-emerald-400"
                  : "bg-emerald-900/30 text-emerald-400";

                return (
                  <motion.div
                    key={payment.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.25 + idx * 0.05 }}
                    whileHover={{ y: -2, transition: { duration: 0.15 } }}
                    className="flex items-center gap-3 rounded-xl border border-emerald-900/40 bg-emerald-950/20 p-3 transition-all hover:bg-emerald-950/30"
                  >
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${avatarColor} text-xs font-bold text-white shadow-sm`}>
                      {payment.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#F8FAFC] truncate">{payment.name}</p>
                      <div className="mt-1 flex items-center gap-1.5">
                        <span className="text-sm font-bold text-[#F8FAFC]">₹{payment.amount.toLocaleString()}</span>
                        <span className="text-xs text-[#64748B]">• {payment.plan}</span>
                      </div>
                    </div>
                    <span className={`shrink-0 rounded-md px-2.5 py-1 text-[10px] font-bold ${badgeStyle}`}>
                      {payment.daysOverdue}d ago
                    </span>
                  </motion.div>
                );
              })
            ) : (
              <p className="text-center text-sm text-[#64748B] py-4">No recent payments</p>
            )}
          </div>
        </motion.section>
      </div>

      {/* Attendance Summary + Revenue Summary */}
      <div className="grid gap-6 sm:grid-cols-2">
        {/* Today's Attendance Summary */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="rounded-xl border border-[#334155] bg-[#1E293B] p-6 shadow-sm"
        >
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-[#3B82F6]/10 p-1.5">
                <Activity className="h-4 w-4 text-[#3B82F6]" />
              </div>
              <div>
                <p className="text-base font-bold text-[#F8FAFC]">Today's Attendance</p>
                <p className="text-xs text-[#64748B] mt-0.5">Peak hours breakdown</p>
              </div>
            </div>
            <span className="rounded-lg bg-[#3B82F6] px-2.5 py-1 text-[10px] font-bold text-white">
              {stats.todayCheckIns} total
            </span>
          </div>

          <div className="space-y-4">
            {attendanceSummary.length > 0 ? (
              attendanceSummary.map((item, idx) => {
                const isPeak = item.percentage === Math.max(...attendanceSummary.map(a => a.percentage));
                return (
                  <motion.div
                    key={item.time}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: 0.35 + idx * 0.06 }}
                    whileHover={{ x: 3, transition: { duration: 0.15 } }}
                    className="group"
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-semibold text-[#94A3B8]">{item.time}</p>
                        {isPeak && (
                          <span className="rounded-md bg-amber-900/30 px-2 py-0.5 text-[10px] font-bold text-amber-400">
                            Peak
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-[#F8FAFC]">{item.count}</p>
                        <span className="text-[10px] font-semibold text-[#3B82F6] bg-[#3B82F6]/10 px-1.5 py-0.5 rounded-md">
                          {item.percentage}%
                        </span>
                      </div>
                    </div>
                    <div className="h-2 w-full rounded-full bg-[#0F172A] overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${item.percentage}%` }}
                        transition={{ duration: 0.7, delay: 0.4 + idx * 0.06 }}
                        className={`h-full rounded-full ${isPeak ? "bg-[#3B82F6]" : "bg-[#3B82F6]/60"}`}
                      />
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <p className="text-center text-sm text-[#64748B] py-4">No attendance data for today</p>
            )}
          </div>
        </motion.section>

        {/* Revenue Summary */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="rounded-xl border border-[#334155] bg-[#1E293B] p-6 shadow-sm"
        >
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-emerald-900/30 p-1.5">
                <IndianRupee className="h-4 w-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-base font-bold text-[#F8FAFC]">Revenue Summary</p>
                <p className="text-xs text-[#64748B] mt-0.5">This month breakdown</p>
              </div>
            </div>
            <div className="flex items-center gap-1 rounded-lg bg-emerald-900/30 px-2.5 py-1">
              <TrendingUp className="h-3 w-3 text-emerald-400" />
              <span className="text-[10px] font-bold text-emerald-400">
                {stats.monthlyRevenue > 0
                  ? `₹${(stats.monthlyRevenue / 100000).toFixed(1)}L`
                  : "₹0"}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {revenueSummary.length > 0 ? (
              revenueSummary.map((item, idx) => (
                <motion.div
                  key={item.category}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.35, delay: 0.35 + idx * 0.06 }}
                  whileHover={{ x: 3, transition: { duration: 0.15 } }}
                  className="flex items-center gap-3 rounded-xl border border-[#334155]/60 bg-[#0F172A]/50 p-3 transition-all hover:bg-[#273449]"
                >
                  <div className="h-8 w-1.5 shrink-0 rounded-full bg-[#3B82F6]" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-[#94A3B8] truncate">{item.category}</p>
                  </div>
                  <div className="shrink-0 flex items-center gap-2">
                    <p className="text-sm font-bold text-[#F8FAFC]">₹{(item.amount / 100000).toFixed(1)}L</p>
                    <span className="rounded-md bg-[#0F172A] px-2 py-0.5 text-[10px] font-bold text-[#64748B]">
                      {item.percentage}%
                    </span>
                  </div>
                </motion.div>
              ))
            ) : (
              <p className="text-center text-sm text-[#64748B] py-4">No revenue data available</p>
            )}
          </div>
        </motion.section>
      </div>

      {/* Recent Activity Timeline */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.35 }}
        className="rounded-xl border border-[#334155] bg-[#1E293B] p-6 shadow-sm"
      >
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-base font-bold text-[#F8FAFC]">Recent Activity</p>
            <p className="text-xs text-[#64748B] mt-0.5">Latest membership events</p>
          </div>
          <span className="rounded-lg bg-[#0F172A] px-2.5 py-1 text-[10px] font-bold text-[#64748B]">
            Today
          </span>
        </div>

        <div className="relative">
          <div className="absolute left-5 top-0 bottom-0 w-px bg-[#334155]/60" />

          <div className="space-y-1">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity, idx) => {
                const Icon = activity.icon;
                const iconColors: Record<string, string> = {
                  member: "bg-blue-900/30 text-blue-400",
                  payment: "bg-emerald-900/30 text-emerald-400",
                  renewal: "bg-purple-900/30 text-purple-400",
                  attendance: "bg-amber-900/30 text-amber-400",
                };
                return (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.35, delay: 0.4 + idx * 0.07 }}
                    whileHover={{ x: 4, transition: { duration: 0.15 } }}
                    className="group flex items-start gap-4 rounded-xl p-3 transition-all hover:bg-[#273449]/50"
                  >
                    <div className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconColors[activity.type] ?? "bg-slate-700/30 text-slate-400"} ring-2 ring-[#1E293B]`}>
                      <Icon className="h-4 w-4" />
                    </div>

                    <div className="flex-1 min-w-0 pt-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-[#F8FAFC]">{activity.title}</p>
                        <span className="shrink-0 rounded-md bg-[#0F172A] px-2 py-0.5 text-[10px] font-medium text-[#64748B]">
                          {activity.time}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-[#64748B] leading-relaxed">{activity.description}</p>
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <p className="text-center text-sm text-[#64748B] py-4">No recent activity</p>
            )}
          </div>
        </div>
      </motion.section>

      {/* Quick Insights */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
        className="rounded-xl border border-[#334155] bg-[#1E293B] p-6 shadow-sm"
      >
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-[#3B82F6]/10 p-1.5">
              <TrendingUp className="h-4 w-4 text-[#3B82F6]" />
            </div>
            <div>
              <p className="text-base font-bold text-[#F8FAFC]">Quick Insights</p>
              <p className="text-xs text-[#64748B] mt-0.5">Smart analytics & alerts</p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {quickInsights.map((insight, idx) => {
            const typeConfig = {
              success: { borderColor: "border-l-[#22C55E]", cardBg: "bg-emerald-950/20 border-emerald-900/40", titleColor: "text-emerald-300", descColor: "text-emerald-400/70", chipStyle: "bg-emerald-900/30 text-emerald-400", chipLabel: "Success", icon: TrendingUp },
              info: { borderColor: "border-l-[#3B82F6]", cardBg: "bg-blue-950/20 border-blue-900/40", titleColor: "text-blue-300", descColor: "text-blue-400/70", chipStyle: "bg-blue-900/30 text-blue-400", chipLabel: "Info", icon: TrendingUp },
              warning: { borderColor: "border-l-[#F59E0B]", cardBg: "bg-amber-950/20 border-amber-900/40", titleColor: "text-amber-300", descColor: "text-amber-400/70", chipStyle: "bg-amber-900/30 text-amber-400", chipLabel: "Warning", icon: TrendingUp },
              alert: { borderColor: "border-l-[#EF4444]", cardBg: "bg-red-950/20 border-red-900/40", titleColor: "text-red-300", descColor: "text-red-400/70", chipStyle: "bg-red-900/30 text-red-400", chipLabel: "Alert", icon: TrendingUp },
            };
            const config = typeConfig[insight.type];
            const Icon = config.icon;

            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.45 + idx * 0.07 }}
                whileHover={{ y: -2, transition: { duration: 0.15 } }}
                className={`flex items-start gap-3 rounded-xl border border-l-4 p-4 transition-all ${config.cardBg} ${config.borderColor}`}
              >
                <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${insight.type === "success" ? "text-[#22C55E]" : insight.type === "info" ? "text-[#3B82F6]" : insight.type === "warning" ? "text-[#F59E0B]" : "text-[#EF4444]"}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-sm font-semibold ${config.titleColor}`}>{insight.message}</p>
                    <span className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold ${config.chipStyle}`}>
                      {insight.trend}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.section>

      {/* Membership Distribution */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
        className="rounded-xl border border-[#334155] bg-[#1E293B] p-6 shadow-sm"
      >
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-purple-900/30 p-1.5">
              <UserCheck className="h-4 w-4 text-purple-400" />
            </div>
            <div>
              <p className="text-base font-bold text-[#F8FAFC]">Membership Distribution</p>
              <p className="text-xs text-[#64748B] mt-0.5">Plan-wise breakdown</p>
            </div>
          </div>
          <span className="rounded-lg bg-[#0F172A] px-2.5 py-1 text-[10px] font-bold text-[#64748B]">
            {stats.activeMembers} active
          </span>
        </div>

        <div className="space-y-3">
          {membershipDistribution.length > 0 ? (
            membershipDistribution.map((item, idx) => (
              <motion.div
                key={item.tier}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.35, delay: 0.35 + idx * 0.06 }}
                whileHover={{ x: 3, transition: { duration: 0.15 } }}
                className="flex items-center gap-3 rounded-xl border border-[#334155]/60 bg-[#0F172A]/50 p-3 transition-all hover:bg-[#273449]"
              >
                <div className={`h-8 w-1.5 shrink-0 rounded-full ${item.color.split(" ")[0]}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-[#94A3B8] truncate">{item.tier}</p>
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  <p className="text-sm font-bold text-[#F8FAFC]">{item.count}</p>
                  <span className="rounded-md bg-[#0F172A] px-2 py-0.5 text-[10px] font-bold text-[#64748B]">
                    {item.percentage}%
                  </span>
                </div>
              </motion.div>
            ))
          ) : (
            <p className="text-center text-sm text-[#64748B] py-4">No membership data available</p>
          )}
        </div>
      </motion.section>

      {/* Revenue Chart */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
        className="rounded-xl border border-[#334155] bg-[#1E293B] p-6 shadow-sm"
      >
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-emerald-900/30 p-1.5">
              <TrendingUp className="h-4 w-4 text-emerald-400" />
            </div>
            <div>
              <p className="text-base font-bold text-[#F8FAFC]">Revenue Trend</p>
              <p className="text-xs text-[#64748B] mt-0.5">Monthly revenue (12 months)</p>
            </div>
          </div>
          <span className="rounded-lg bg-emerald-900/30 px-2.5 py-1 text-[10px] font-bold text-emerald-400">
            Total: {formatCurrency(stats.totalRevenue)}
          </span>
        </div>

        <div className="space-y-3">
          {revenueChart.length > 0 ? (
            <div className="flex items-end gap-2 h-48">
              {revenueChart.map((item, idx) => {
                const maxAmount = Math.max(...revenueChart.map((r) => r.amount), 1);
                const height = Math.max((item.amount / maxAmount) * 100, 5);
                const isCurrentMonth = idx === revenueChart.length - 1;
                return (
                  <motion.div
                    key={item.label}
                    initial={{ height: 0 }}
                    animate={{ height: `${height}%` }}
                    transition={{ duration: 0.5, delay: 0.1 + idx * 0.03 }}
                    className={`flex-1 flex flex-col items-center gap-1 min-w-0`}
                  >
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3, delay: 0.3 + idx * 0.03 }}
                      className="text-[9px] font-bold text-[#64748B] truncate max-w-full"
                    >
                      {item.amount > 0
                        ? item.amount >= 100000
                          ? `₹${(item.amount / 100000).toFixed(1)}L`
                          : item.amount >= 1000
                          ? `₹${(item.amount / 1000).toFixed(0)}K`
                          : `₹${item.amount}`
                        : ""}
                    </motion.div>
                    <div
                      className={`w-full rounded-t-md transition-all duration-300 ${
                        isCurrentMonth
                          ? "bg-gradient-to-t from-[#3B82F6] to-[#60A5FA]"
                          : "bg-[#3B82F6]/40 hover:bg-[#3B82F6]/60"
                      }`}
                      style={{ height: "100%" }}
                    />
                    <span className={`text-[9px] font-semibold truncate max-w-full ${
                      isCurrentMonth ? "text-[#3B82F6]" : "text-[#64748B]"
                    }`}>
                      {item.label}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <p className="text-center text-sm text-[#64748B] py-4">No revenue data available</p>
          )}
        </div>
      </motion.section>
    </div>
  );
}

function getTimeAgoFromDate(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  if (diffDays < 30) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  return date.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
}