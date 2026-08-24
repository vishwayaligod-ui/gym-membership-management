"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Bell, Send, ClipboardList, CreditCard, Users, AlertCircle, CheckCircle2, Clock, Loader2 } from "lucide-react";

import { AppHeader } from "../components/AppHeader";
import { PageContainer } from "../components/PageContainer";

import type { NotificationsResponse, Reminder, UpcomingRenewal, OverduePayment, RecentNotification } from "./types";

export default function NotificationsPage() {
  const router = useRouter();

  const [data, setData] = useState<NotificationsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [readIds, setReadIds] = useState<Set<number>>(new Set());

  const fetchNotifications = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch("/api/notifications");
      if (!response.ok) throw new Error("Failed to fetch notifications");
      const result: NotificationsResponse = await response.json();
      setData(result);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
      setError("Failed to load notifications");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const toggleRead = (id: number) => {
    setReadIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const quickActions = [
    { label: "Send Reminder", icon: Send, color: "from-blue-600 to-blue-700", route: "#" },
    { label: "View Renewals", icon: ClipboardList, color: "from-emerald-600 to-emerald-700", route: "/renewals" },
    { label: "Payment History", icon: CreditCard, color: "from-purple-600 to-purple-700", route: "/payment-history" },
    { label: "Members", icon: Users, color: "from-amber-600 to-amber-700", route: "/members-v4" },
  ];

  const notificationIcons: Record<string, typeof Send> = {
    whatsapp: Send,
    sms: Send,
    payment: CreditCard,
    renewal: CheckCircle2,
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,_#f5f8ff_0%,_#eef5ff_100%)] text-slate-900">
      <AppHeader title="Notifications" />

      <PageContainer>
        <div className="space-y-4">
          {/* Header */}
          <div>
            <p className="text-2xl font-semibold tracking-tight text-slate-950">Notifications</p>
            <p className="mt-1 text-sm text-slate-500">
              Reminders, renewals, and member communications
            </p>
          </div>

          {/* Quick Actions */}
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((action, idx) => {
              const Icon = action.icon;
              return (
                <motion.button
                  key={idx}
                  onClick={() => action.route !== "#" && router.push(action.route)}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.05 }}
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

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
              <p className="mt-4 text-sm text-slate-500">Loading notifications...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center rounded-[1.6rem] border border-slate-200 bg-white p-8 py-16 text-center">
              <AlertCircle className="h-10 w-10 text-rose-400" />
              <p className="mt-3 text-base font-semibold text-slate-900">Failed to load</p>
              <p className="mt-1 text-sm text-slate-500">{error}</p>
              <button
                onClick={fetchNotifications}
                className="mt-4 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-500"
              >
                Retry
              </button>
            </div>
          ) : data ? (
            <>
              {/* Today's Reminders */}
              <section className="rounded-[1.6rem] border border-slate-200 bg-white p-4 shadow-[0_10px_35px_rgba(15,23,42,0.06)] sm:p-5">
                <div className="mb-4">
                  <p className="text-sm font-semibold text-slate-900">Today's Reminders</p>
                  <p className="text-sm text-slate-500">Pending actions for today</p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {data.reminders.map((reminder, idx) => (
                    <motion.div
                      key={reminder.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.05 + idx * 0.05 }}
                      className={`rounded-2xl border border-slate-100 ${reminder.color.split(" ")[0]} p-4 hover:shadow-md transition`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-lg font-semibold text-slate-900">{reminder.icon}</p>
                          <p className="mt-1 font-medium text-slate-900">{reminder.title}</p>
                          <p className="text-sm text-slate-600">{reminder.description}</p>
                        </div>
                        <div className={`rounded-full px-3 py-1 ${reminder.color.split(" ")[0]} text-sm font-bold ${reminder.color.split(" ")[1]}`}>
                          {reminder.count}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </section>

              {/* Upcoming Renewals */}
              <section className="rounded-[1.6rem] border border-slate-200 bg-white p-4 shadow-[0_10px_35px_rgba(15,23,42,0.06)] sm:p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Upcoming Renewals</p>
                    <p className="text-sm text-slate-500">Next 7 days</p>
                  </div>
                  <button
                    onClick={() => router.push("/renewals")}
                    className="text-sm font-medium text-blue-600 hover:text-blue-700"
                  >
                    View All →
                  </button>
                </div>

                <div className="space-y-2">
                  {data.upcomingRenewals.length === 0 ? (
                    <p className="py-4 text-center text-sm text-slate-500">No upcoming renewals</p>
                  ) : (
                    data.upcomingRenewals.map((renewal, idx) => (
                      <motion.div
                        key={renewal.id}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: 0.1 + idx * 0.04 }}
                        className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3 hover:bg-slate-100 transition"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-600">
                          {renewal.avatar}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-medium text-slate-900 truncate">{renewal.memberName}</p>
                            <p className="shrink-0 text-sm font-semibold text-blue-600">In {renewal.daysUntil}d</p>
                          </div>
                          <p className="text-sm text-slate-600">₹{renewal.amount.toLocaleString()} • {renewal.planName}</p>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </section>

              {/* Overdue Payments */}
              <section className="rounded-[1.6rem] border border-slate-200 bg-white p-4 shadow-[0_10px_35px_rgba(15,23,42,0.06)] sm:p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Overdue Payments</p>
                    <p className="text-sm text-slate-500">Require immediate action</p>
                  </div>
                  <button
                    onClick={() => router.push("/payment-history")}
                    className="text-sm font-medium text-blue-600 hover:text-blue-700"
                  >
                    Collect →
                  </button>
                </div>

                <div className="space-y-2">
                  {data.overduePayments.length === 0 ? (
                    <p className="py-4 text-center text-sm text-slate-500">No overdue payments</p>
                  ) : (
                    data.overduePayments.map((payment, idx) => (
                      <motion.div
                        key={payment.id}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: 0.12 + idx * 0.04 }}
                        className={`flex items-center gap-3 rounded-2xl border border-rose-100 ${payment.daysOverdue > 10 ? "bg-rose-50" : "bg-amber-50"} p-3 hover:shadow-md transition`}
                      >
                        <div className={`flex h-10 w-10 items-center justify-center rounded-full ${payment.daysOverdue > 10 ? "bg-rose-100 text-rose-600" : "bg-amber-100 text-amber-600"} text-sm font-semibold`}>
                          {payment.avatar}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-medium text-slate-900 truncate">{payment.memberName}</p>
                            <p className={`shrink-0 text-sm font-bold ${payment.daysOverdue > 10 ? "text-rose-600" : "text-amber-600"}`}>
                              {payment.daysOverdue}d overdue
                            </p>
                          </div>
                          <p className="text-sm text-slate-600">₹{payment.amount.toLocaleString()} • {payment.planName}</p>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </section>

              {/* Recent Notifications */}
              <section className="rounded-[1.6rem] border border-slate-200 bg-white p-4 shadow-[0_10px_35px_rgba(15,23,42,0.06)] sm:p-5">
                <div className="mb-4">
                  <p className="text-sm font-semibold text-slate-900">Recent Notifications</p>
                  <p className="text-sm text-slate-500">Communication timeline</p>
                </div>

                <div className="space-y-3">
                  {data.recentNotifications.length === 0 ? (
                    <p className="py-4 text-center text-sm text-slate-500">No recent notifications</p>
                  ) : (
                    data.recentNotifications.map((notification, idx) => {
                      const Icon = notificationIcons[notification.type] || Bell;
                      const bgColor = notification.color.split(" ")[0];
                      const textColor = notification.color.split(" ")[1];
                      const isRead = readIds.has(notification.id);
                      return (
                        <motion.button
                          key={notification.id}
                          onClick={() => toggleRead(notification.id)}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: 0.15 + idx * 0.05 }}
                          className={`flex w-full items-start gap-3 rounded-2xl border p-3 text-left transition hover:shadow-sm ${
                            isRead
                              ? "border-slate-100 bg-white opacity-70"
                              : "border-blue-100 bg-blue-50"
                          }`}
                        >
                          <div className={`rounded-2xl p-2 ${bgColor} ${textColor}`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <p className={`font-medium ${isRead ? "text-slate-500" : "text-slate-900"}`}>
                                {notification.title}
                              </p>
                              <p className="shrink-0 text-xs text-slate-500">{notification.timestamp}</p>
                            </div>
                            <p className={`mt-0.5 text-sm ${isRead ? "text-slate-400" : "text-slate-600"}`}>
                              {notification.description}
                            </p>
                          </div>
                          {!isRead && (
                            <span className="mt-1.5 flex h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                          )}
                        </motion.button>
                      );
                    })
                  )}
                </div>
              </section>
            </>
          ) : null}
        </div>
      </PageContainer>

    </div>
  );
}