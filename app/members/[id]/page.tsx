"use client";

import { motion } from "framer-motion";
import { Clock, DollarSign, Phone, Mail, Edit2, MessageSquare, LogOut, Zap } from "lucide-react";
import { useState } from "react";
import { PageContainer } from "@/app/components/PageContainer";
import { AppHeader } from "@/app/components/AppHeader";
import { AttendanceSummaryCard } from "@/app/components/AttendanceSummaryCard";
import { mockMembers } from "@/app/members/mockMembers";
import { mockPayments } from "@/app/payment-history/mockPayments";

const statusStyles = {
  Active: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Expiring: "bg-amber-50 text-amber-700 ring-amber-200",
  Expired: "bg-rose-50 text-rose-700 ring-rose-200",
};

export default function MemberDetailsPage({ params }: { params: { id: string } }) {
  const [isLoading] = useState(false);
  
  // Get member data from mock data
  const member = mockMembers.find(m => m.id === parseInt(params.id));
  
  // Get recent payment for this member
  const recentPayment = mockPayments.find(p => p.memberName === member?.name);

  if (!member) {
    return (
      <div>
        <AppHeader title="Member Details" />
        <PageContainer>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center py-32"
          >
            <p className="text-slate-600">Member not found</p>
          </motion.div>
        </PageContainer>
      </div>
    );
  }

  const planColors: Record<string, { gradient: string; icon: string }> = {
    Classic: { gradient: "from-slate-400 to-slate-500", icon: "⚡" },
    Premium: { gradient: "from-amber-400 to-orange-500", icon: "✨" },
    Platinum: { gradient: "from-blue-400 to-indigo-500", icon: "👑" },
  };

  const planConfig = planColors[member.plan] || planColors.Classic;

  // Mock attendance data for this member
  const attendanceData = {
    thisMonth: "12",
    thisWeek: "3",
    lastVisit: "Today, 8:30 AM",
    averageDaily: "2.4 hours",
  };

  // Mock membership data
  const membershipData = {
    daysRemaining: Math.floor(Math.random() * 200) + 1,
    totalSpent: "₹" + (Math.random() > 0.5 ? "59,988" : "34,992"),
    renewalDate: member.expiresOn,
  };

  return (
    <>
      <AppHeader title={member.name} />
      <PageContainer>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ staggerChildren: 0.08, delayChildren: 0.1 }}
          className="flex flex-col gap-6 py-6"
        >
          {/* Hero Profile Card */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <article className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
              {/* Header Background */}
              <div className={`h-24 bg-gradient-to-r ${planConfig.gradient}`} />

              {/* Content */}
              <div className="px-6 pb-6">
                {/* Avatar & Info */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div className="flex items-end gap-4">
                    <div className="-mt-14 flex h-28 w-28 items-center justify-center rounded-[1.4rem] border-4 border-white bg-gradient-to-br from-blue-600 to-indigo-500 text-4xl font-bold text-white shadow-lg shadow-blue-600/20">
                      {member.avatar}
                    </div>
                    <div className="pb-2">
                      <h1 className="text-2xl font-bold text-slate-900">{member.name}</h1>
                      <p className="text-sm text-slate-600">{member.phone}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ${statusStyles[member.status]}`}>
                      {member.status}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 ring-1 ring-blue-200">
                      {planConfig.icon} {member.plan}
                    </span>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="mt-6 grid gap-4 border-t border-slate-200 pt-6 sm:grid-cols-2">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-400">Joined On</p>
                    <p className="mt-1.5 text-sm font-semibold text-slate-900">{member.joinedOn}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-400">Expires On</p>
                    <p className="mt-1.5 text-sm font-semibold text-slate-900">{member.expiresOn}</p>
                  </div>
                </div>
              </div>
            </article>
          </motion.div>

          {/* Membership Summary */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <article className="rounded-[1.4rem] border border-slate-200 bg-white p-6 shadow-[0_10px_35px_rgba(15,23,42,0.06)]">
              <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
                <Zap className="h-4.5 w-4.5 text-blue-600" />
                Membership Summary
              </h2>

              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-600">Days Remaining</p>
                    <p className="mt-0.5 text-lg font-semibold text-slate-900">{membershipData.daysRemaining}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-xl bg-emerald-50 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                    <DollarSign className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-600">Total Spent</p>
                    <p className="mt-0.5 text-lg font-semibold text-slate-900">{membershipData.totalSpent}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-xl bg-amber-50 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-600">Renewal</p>
                    <p className="mt-0.5 text-lg font-semibold text-slate-900">{member.expiresOn}</p>
                  </div>
                </div>
              </div>
            </article>
          </motion.div>

          {/* Attendance Summary */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div>
              <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-900">
                <Clock className="h-4.5 w-4.5 text-blue-600" />
                Attendance Summary
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <AttendanceSummaryCard
                  label="This Month"
                  value={attendanceData.thisMonth}
                  tone="bg-blue-100 text-blue-600"
                  icon={Clock}
                />
                <AttendanceSummaryCard
                  label="This Week"
                  value={attendanceData.thisWeek}
                  tone="bg-emerald-100 text-emerald-600"
                  icon={Clock}
                />
                <AttendanceSummaryCard
                  label="Last Visit"
                  value="Today"
                  tone="bg-purple-100 text-purple-600"
                  icon={Clock}
                />
                <AttendanceSummaryCard
                  label="Average Daily"
                  value="2.4h"
                  tone="bg-orange-100 text-orange-600"
                  icon={Clock}
                />
              </div>
            </div>
          </motion.div>

          {/* Payment Summary */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <article className="rounded-[1.4rem] border border-slate-200 bg-white p-6 shadow-[0_10px_35px_rgba(15,23,42,0.06)]">
              <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
                <DollarSign className="h-4.5 w-4.5 text-blue-600" />
                Payment Summary
              </h2>

              {recentPayment ? (
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600">Last Payment</p>
                      <p className="mt-1 text-2xl font-bold text-slate-900">₹{recentPayment.amount.toLocaleString()}</p>
                    </div>
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${
                      recentPayment.status === "paid"
                        ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                        : recentPayment.status === "pending"
                        ? "bg-amber-50 text-amber-700 ring-amber-200"
                        : "bg-rose-50 text-rose-700 ring-rose-200"
                    }`}>
                      {recentPayment.status.charAt(0).toUpperCase() + recentPayment.status.slice(1)}
                    </span>
                  </div>
                  <div className="border-t border-slate-200 pt-3">
                    <div className="grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-400">Method</p>
                        <p className="mt-1 font-medium text-slate-900">{recentPayment.method}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-400">Date</p>
                        <p className="mt-1 font-medium text-slate-900">{recentPayment.date}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-4 text-sm text-slate-600">No payment records found</div>
              )}
            </article>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div>
              <h2 className="mb-4 text-base font-semibold text-slate-900">Quick Actions</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <motion.button
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={isLoading}
                  className="flex items-center justify-center gap-2.5 rounded-[1.2rem] border border-slate-200 bg-white px-4 py-3.5 text-sm font-semibold text-slate-700 shadow-[0_10px_35px_rgba(15,23,42,0.06)] transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-50"
                >
                  <Edit2 className="h-4 w-4" />
                  Edit Profile
                </motion.button>

                <motion.button
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={isLoading}
                  className="flex items-center justify-center gap-2.5 rounded-[1.2rem] border border-slate-200 bg-white px-4 py-3.5 text-sm font-semibold text-slate-700 shadow-[0_10px_35px_rgba(15,23,42,0.06)] transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-600 disabled:opacity-50"
                >
                  <MessageSquare className="h-4 w-4" />
                  Send Message
                </motion.button>

                <motion.button
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={isLoading}
                  className="flex items-center justify-center gap-2.5 rounded-[1.2rem] border border-slate-200 bg-white px-4 py-3.5 text-sm font-semibold text-slate-700 shadow-[0_10px_35px_rgba(15,23,42,0.06)] transition hover:border-amber-200 hover:bg-amber-50 hover:text-amber-600 disabled:opacity-50"
                >
                  <DollarSign className="h-4 w-4" />
                  Collect Payment
                </motion.button>

                <motion.button
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={isLoading}
                  className="flex items-center justify-center gap-2.5 rounded-[1.2rem] border border-slate-200 bg-white px-4 py-3.5 text-sm font-semibold text-slate-700 shadow-[0_10px_35px_rgba(15,23,42,0.06)] transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                >
                  <LogOut className="h-4 w-4" />
                  Suspend
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </PageContainer>
    </>
  );
}
