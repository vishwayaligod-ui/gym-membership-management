"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  IndianRupee,
  Users,
  UserPlus,
  CheckCircle2,
  CreditCard,
  ArrowRight,
  Loader2,
  Calendar,
  Search,
  X,
  FileSpreadsheet,
  FileText,
  Download,
} from "lucide-react";
import { toast } from "sonner";

import { AttendanceSummaryCard } from "../components/AttendanceSummaryCard";
import { RevenueChart } from "../components/reports/RevenueChart";
import { InsightCard } from "../components/reports/InsightCard";
import type { ReportsData, ReportFilters, RevenueByRange, ExpiringSoonMember, ActivityLog, InsightMessage, MembershipStat, AttendanceDataPoint } from "./types";
import { exportRevenue } from "@/lib/export/exportRevenue";
import { exportMembership } from "@/lib/export/exportMembership";
import { exportAttendance } from "@/lib/export/exportAttendance";
import { exportPayments } from "@/lib/export/exportPayments";

const initialFilters: ReportFilters = {
  dateFrom: "",
  dateTo: "",
  memberId: "",
  planId: "",
};

export default function ReportsPage() {
  const [data, setData] = useState<ReportsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<ReportFilters>(initialFilters);
  const [showFilters, setShowFilters] = useState(false);

  const fetchReports = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
      if (filters.dateTo) params.set("dateTo", filters.dateTo);
      if (filters.memberId) params.set("memberId", filters.memberId);
      if (filters.planId) params.set("planId", filters.planId);

      const response = await fetch(`/api/reports?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch reports");
      const result: ReportsData = await response.json();
      setData(result);
    } catch (error) {
      console.error("Failed to fetch reports:", error);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const hasActiveFilters = filters.dateFrom !== "" || filters.dateTo !== "" || filters.memberId !== "" || filters.planId !== "";

  const resetFilters = () => {
    setFilters(initialFilters);
  };

  const KPI_TONES = {
    green: "bg-emerald-900/30 text-emerald-400",
    blue: "bg-blue-900/30 text-blue-400",
    amber: "bg-amber-900/30 text-amber-400",
    rose: "bg-rose-900/30 text-rose-400",
  };

  // Mock activity data for the icons - we map from the API data
  const activityIconMap: Record<string, { icon: React.ElementType; color: string }> = {
    join: { icon: UserPlus, color: "bg-blue-900/30 text-blue-400" },
    renewal: { icon: CheckCircle2, color: "bg-emerald-900/30 text-emerald-400" },
    payment: { icon: CreditCard, color: "bg-purple-900/30 text-purple-400" },
    expired: { icon: Activity, color: "bg-rose-900/30 text-rose-400" },
  };

  const handleExportRevenueExcel = () => {
    if (!data || !exportRevenue(data)) {
      toast.error("No data available to export.");
      return;
    }
    toast.success("Excel exported successfully.");
  };

  const handleExportRevenuePDF = () => {
    // TODO: Implement revenue report export (PDF)
  };

  const handleExportRevenueCSV = () => {
    // TODO: Implement revenue report export (CSV)
  };

  const handleExportMembershipExcel = () => {
    if (!data || data.members.length === 0) {
      toast.error("No member data available.");
      return;
    }

    if (!exportMembership(data)) {
      toast.error("No member data available.");
      return;
    }

    toast.success("Excel exported successfully.");
  };

  const handleExportMembershipPDF = () => {
    // TODO: Implement membership report export (PDF)
  };

  const handleExportMembershipCSV = () => {
    // TODO: Implement membership report export (CSV)
  };

  const handleExportAttendanceExcel = () => {
    if (!data || !exportAttendance(data)) {
      toast.error("No data available to export.");
      return;
    }
    toast.success("Excel exported successfully.");
  };

  const handleExportAttendancePDF = () => {
    // TODO: Implement attendance report export (PDF)
  };

  const handleExportAttendanceCSV = () => {
    // TODO: Implement attendance report export (CSV)
  };

  const handleExportPaymentExcel = () => {
    if (!data || !exportPayments(data)) {
      toast.error("No data available to export.");
      return;
    }
    toast.success("Excel exported successfully.");
  };

  const handleExportPaymentPDF = () => {
    // TODO: Implement payment report export (PDF)
  };

  const handleExportPaymentCSV = () => {
    // TODO: Implement payment report export (CSV)
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-slate-500" />
        <p className="mt-4 text-base font-semibold text-slate-300">Loading reports...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-base font-semibold text-slate-300">Failed to load reports</p>
        <button
          onClick={fetchReports}
          className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
        >
          Retry
        </button>
      </div>
    );
  }

  const { kpis, revenue, attendance, membershipStats, expiringMemberships, recentActivity, quickInsights } = data;

  return (
    <div className="space-y-8">
      {/* -------- Page Header with Filters -------- */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-100">Reports</h1>
            <p className="mt-1 text-sm text-slate-500">
              Revenue, membership, and attendance analytics
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-[12px] font-semibold transition-all ${
              showFilters || hasActiveFilters
                ? "border-blue-500/40 bg-blue-900/20 text-blue-400"
                : "border-slate-700 bg-slate-900/50 text-slate-400 hover:border-slate-600 hover:text-slate-200"
            }`}
            type="button"
          >
            <Calendar className="h-3.5 w-3.5" />
            Filters
            {hasActiveFilters && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-[9px] font-bold text-white">
                {[filters.dateFrom, filters.dateTo, filters.memberId, filters.planId].filter(Boolean).length}
              </span>
            )}
          </motion.button>
        </div>

        {/* Expandable Filters */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-4"
          >
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-medium text-slate-500">Date From</label>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters((prev) => ({ ...prev, dateFrom: e.target.value }))}
                  className="rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-2 text-[12px] text-slate-300 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-medium text-slate-500">Date To</label>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters((prev) => ({ ...prev, dateTo: e.target.value }))}
                  className="rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-2 text-[12px] text-slate-300 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20"
                />
              </div>
              {hasActiveFilters && (
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={resetFilters}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-red-900/40 bg-red-950/20 px-3 py-2 text-[11px] font-semibold text-red-400 transition-all hover:bg-red-950/30"
                  type="button"
                >
                  <X className="h-3 w-3" />
                  Reset
                </motion.button>
              )}
            </div>
          </motion.div>
        )}
      </div>

      {/* -------- Summary KPI Cards -------- */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AttendanceSummaryCard
          label="Total Revenue"
          value={`₹${kpis.totalRevenue.toLocaleString("en-US")}`}
          tone={KPI_TONES.green}
          icon={IndianRupee}
        />
        <AttendanceSummaryCard
          label="Active Members"
          value={kpis.activeMembers.toLocaleString("en-US")}
          tone={KPI_TONES.blue}
          icon={Users}
        />
        <AttendanceSummaryCard
          label="Today's Attendance"
          value={kpis.todayAttendance.toString()}
          tone={KPI_TONES.amber}
          icon={Activity}
        />
        <AttendanceSummaryCard
          label="Expiring Memberships"
          value={kpis.expiringMemberships.toString()}
          tone={KPI_TONES.rose}
          icon={AlertTriangle}
        />
      </section>

      {/* -------- Revenue Overview (Chart) -------- */}
      <RevenueChart data={revenue as RevenueByRange} />

      {/* -------- Attendance Overview -------- */}
      <section className="rounded-xl border border-[#334155] bg-[#1E293B] p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-[#F8FAFC]">Attendance Overview</p>
            <p className="text-xs text-[#64748B] mt-0.5">This week&#39;s check-in percentage</p>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {attendance.map((day: AttendanceDataPoint, i: number) => {
            let barColor = "bg-[#3B82F6]";
            if (day.percentage >= 85) barColor = "bg-emerald-500";
            else if (day.percentage >= 70) barColor = "bg-[#3B82F6]";
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
                <span className="w-8 text-right text-xs font-semibold text-[#64748B]">
                  {day.day}
                </span>
                <div className="flex-1 rounded-full bg-[#0F172A] h-7 overflow-hidden">
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
                <span className="w-12 text-right text-xs font-semibold text-[#64748B]">
                  {day.percentage}%
                </span>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* -------- Membership Statistics -------- */}
      <section className="rounded-xl border border-[#334155] bg-[#1E293B] p-6 shadow-sm">
        <div>
          <p className="text-sm font-bold text-[#F8FAFC]">Membership Statistics</p>
          <p className="text-xs text-[#64748B] mt-0.5">Tier-wise distribution and share</p>
        </div>

        <div className="mt-5 space-y-4">
          {membershipStats.map((tier: MembershipStat, i: number) => {
            const colorClass = tier.color.split(" ")[0];
            return (
              <motion.div
                key={tier.tier}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: i * 0.06 }}
                className="space-y-1.5"
              >
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-[#F8FAFC]">{tier.tier}</span>
                  <span className="font-medium text-[#64748B]">
                    {tier.count} ({tier.percentage}%)
                  </span>
                </div>
                <div className="h-3 w-full rounded-full bg-[#0F172A] overflow-hidden">
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
      <section className="rounded-xl border border-[#334155] bg-[#1E293B] p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-[#F8FAFC]">Expiring Memberships</p>
            <p className="text-xs text-[#64748B] mt-0.5">Members whose plans are ending soon</p>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {expiringMemberships.length === 0 ? (
            <p className="text-sm text-[#64748B] py-4 text-center">No memberships expiring soon</p>
          ) : (
            expiringMemberships.map((member: ExpiringSoonMember, i: number) => {
              let badgeColor = "bg-emerald-900/30 text-emerald-400";
              let daysText = `In ${member.daysRemaining} Days`;
              if (member.daysRemaining === 0) {
                badgeColor = "bg-red-900/30 text-red-400";
                daysText = "Expires Today";
              } else if (member.daysRemaining <= 3) {
                badgeColor = "bg-amber-900/30 text-amber-400";
              }

              return (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: i * 0.04 }}
                  className="flex items-center justify-between gap-3 rounded-xl border border-[#334155]/60 bg-[#0F172A]/50 px-3 py-3 transition-all hover:bg-[#273449]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#3B82F6] text-sm font-semibold text-white shadow-sm">
                      {member.avatar}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#F8FAFC] truncate">{member.name}</p>
                      <p className="text-xs text-[#64748B]">{member.plan} · {member.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="hidden sm:inline text-xs text-[#64748B]">{member.expiryDate}</span>
                    <span className={`inline-flex rounded-md px-2.5 py-1 text-[11px] font-bold ${badgeColor}`}>
                      {daysText}
                    </span>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </section>

      {/* -------- Recent Activity Timeline -------- */}
      <section className="rounded-xl border border-[#334155] bg-[#1E293B] p-6 shadow-sm">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-[#F8FAFC]">Recent Activity</p>
            <p className="text-xs text-[#64748B] mt-0.5">Latest membership events</p>
          </div>
          <button className="flex items-center gap-1 rounded-lg bg-[#3B82F6]/10 px-3 py-1.5 text-xs font-semibold text-[#3B82F6] hover:bg-[#3B82F6]/20 transition-colors">
            View All
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        <div className="space-y-3">
          {recentActivity.length === 0 ? (
            <p className="text-sm text-[#64748B] py-4 text-center">No recent activity</p>
          ) : (
            recentActivity.map((activity: ActivityLog, idx: number) => {
              const iconConfig = activityIconMap[activity.type] || activityIconMap.payment;
              const Icon = iconConfig.icon;
              return (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.5 + idx * 0.05 }}
                  className="flex items-start gap-3 rounded-xl border border-[#334155]/60 bg-[#0F172A]/50 p-3 transition-all hover:bg-[#273449]"
                >
                  <div className={`rounded-xl p-2 ${activity.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-[#F8FAFC]">{activity.memberName}</p>
                      <p className="shrink-0 text-xs text-[#64748B]">{activity.timestamp}</p>
                    </div>
                    <p className="mt-0.5 text-sm text-[#94A3B8]">{activity.description}</p>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </section>

      {/* -------- Export Reports -------- */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-4 shadow-[0_12px_36px_rgba(2,6,23,0.28)] sm:p-5">
        <div>
          <p className="text-base font-semibold text-slate-100">Export Reports</p>
          <p className="mt-1 text-sm text-slate-500">Download business reports for accounting, analysis and backup.</p>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <motion.article
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.7 }}
            whileHover={{ y: -2 }}
            className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 shadow-[0_8px_24px_rgba(2,6,23,0.24)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="rounded-lg bg-blue-900/30 p-2">
                <IndianRupee className="h-4 w-4 text-blue-400" />
              </div>
              <button
                type="button"
                onClick={handleExportRevenueExcel}
                className="inline-flex items-center gap-1.5 rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-1.5 text-xs font-semibold text-blue-300 transition hover:border-blue-500/50 hover:bg-blue-500/20"
              >
                <Download className="h-3.5 w-3.5" />
                Export Excel
              </button>
            </div>
            <p className="mt-3 text-sm font-semibold text-slate-100">Revenue Report</p>
            <p className="mt-1 text-xs text-slate-500">Revenue, collections and payment summary.</p>
            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportRevenuePDF}
                className="rounded-md border border-slate-700 bg-slate-900 px-2.5 py-1 text-[11px] font-semibold text-slate-300 transition hover:border-slate-600 hover:text-slate-100"
              >
                PDF
              </button>
              <button
                type="button"
                onClick={handleExportRevenueCSV}
                className="rounded-md border border-slate-700 bg-slate-900 px-2.5 py-1 text-[11px] font-semibold text-slate-300 transition hover:border-slate-600 hover:text-slate-100"
              >
                CSV
              </button>
            </div>
          </motion.article>

          <motion.article
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.75 }}
            whileHover={{ y: -2 }}
            className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 shadow-[0_8px_24px_rgba(2,6,23,0.24)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="rounded-lg bg-emerald-900/30 p-2">
                <Users className="h-4 w-4 text-emerald-400" />
              </div>
              <button
                type="button"
                onClick={handleExportMembershipExcel}
                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300 transition hover:border-emerald-500/50 hover:bg-emerald-500/20"
              >
                <Download className="h-3.5 w-3.5" />
                Export Excel
              </button>
            </div>
            <p className="mt-3 text-sm font-semibold text-slate-100">Membership Report</p>
            <p className="mt-1 text-xs text-slate-500">Member plans, renewals and expiry details.</p>
            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportMembershipPDF}
                className="rounded-md border border-slate-700 bg-slate-900 px-2.5 py-1 text-[11px] font-semibold text-slate-300 transition hover:border-slate-600 hover:text-slate-100"
              >
                PDF
              </button>
              <button
                type="button"
                onClick={handleExportMembershipCSV}
                className="rounded-md border border-slate-700 bg-slate-900 px-2.5 py-1 text-[11px] font-semibold text-slate-300 transition hover:border-slate-600 hover:text-slate-100"
              >
                CSV
              </button>
            </div>
          </motion.article>

          <motion.article
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.8 }}
            whileHover={{ y: -2 }}
            className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 shadow-[0_8px_24px_rgba(2,6,23,0.24)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="rounded-lg bg-amber-900/30 p-2">
                <Activity className="h-4 w-4 text-amber-400" />
              </div>
              <button
                type="button"
                onClick={handleExportAttendanceExcel}
                className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-300 transition hover:border-amber-500/50 hover:bg-amber-500/20"
              >
                <Download className="h-3.5 w-3.5" />
                Export Excel
              </button>
            </div>
            <p className="mt-3 text-sm font-semibold text-slate-100">Attendance Report</p>
            <p className="mt-1 text-xs text-slate-500">Daily member attendance and check-in history.</p>
            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportAttendancePDF}
                className="rounded-md border border-slate-700 bg-slate-900 px-2.5 py-1 text-[11px] font-semibold text-slate-300 transition hover:border-slate-600 hover:text-slate-100"
              >
                PDF
              </button>
              <button
                type="button"
                onClick={handleExportAttendanceCSV}
                className="rounded-md border border-slate-700 bg-slate-900 px-2.5 py-1 text-[11px] font-semibold text-slate-300 transition hover:border-slate-600 hover:text-slate-100"
              >
                CSV
              </button>
            </div>
          </motion.article>

          <motion.article
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.85 }}
            whileHover={{ y: -2 }}
            className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 shadow-[0_8px_24px_rgba(2,6,23,0.24)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="rounded-lg bg-purple-900/30 p-2">
                <FileText className="h-4 w-4 text-purple-400" />
              </div>
              <button
                type="button"
                onClick={handleExportPaymentExcel}
                className="inline-flex items-center gap-1.5 rounded-lg border border-purple-500/30 bg-purple-500/10 px-3 py-1.5 text-xs font-semibold text-purple-300 transition hover:border-purple-500/50 hover:bg-purple-500/20"
              >
                <Download className="h-3.5 w-3.5" />
                Export Excel
              </button>
            </div>
            <p className="mt-3 text-sm font-semibold text-slate-100">Payment Report</p>
            <p className="mt-1 text-xs text-slate-500">Payment transactions and collection history.</p>
            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportPaymentPDF}
                className="rounded-md border border-slate-700 bg-slate-900 px-2.5 py-1 text-[11px] font-semibold text-slate-300 transition hover:border-slate-600 hover:text-slate-100"
              >
                PDF
              </button>
              <button
                type="button"
                onClick={handleExportPaymentCSV}
                className="rounded-md border border-slate-700 bg-slate-900 px-2.5 py-1 text-[11px] font-semibold text-slate-300 transition hover:border-slate-600 hover:text-slate-100"
              >
                CSV
              </button>
            </div>
          </motion.article>
        </div>
      </section>

      {/* -------- Quick Insights -------- */}
      <InsightCard items={quickInsights as InsightMessage[]} />
    </div>
  );
}