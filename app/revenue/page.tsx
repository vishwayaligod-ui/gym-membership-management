"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, CreditCard, Smartphone, Banknote } from "lucide-react";

import { AppHeader } from "../components/AppHeader";
import { BottomNavigation } from "../components/BottomNavigation";
import { PageContainer } from "../components/PageContainer";
import { ComparisonCard } from "../components/revenue/ComparisonCard";
import { MonthlyRevenueChart } from "../components/revenue/MonthlyRevenue";
import { PaymentMethodBreakdown } from "../components/revenue/PaymentMethod";
import { PlanBreakdown } from "../components/revenue/PlanBreakdown";
import { RevenueInsights } from "../components/revenue/RevenueInsights";
import { TopMembersList } from "../components/revenue/TopMembersList";

import {
  mockComparisons,
  mockMonthlyRevenue,
  mockPaymentMethods,
  mockPlanRevenue,
  mockRevenueInsights,
  mockTopMembers,
  mockRevenueBreakdown,
  mockMonthlyTrend,
  mockMembershipPlans,
} from "./mockRevenue";

export default function RevenuePage() {
  const totalRevenue = useMemo(() => {
    return mockRevenueBreakdown.reduce((sum, item) => sum + item.amount, 0);
  }, []);

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,_#f5f8ff_0%,_#eef5ff_100%)] text-slate-900">
      <AppHeader title="Revenue" />

      <PageContainer>
        <div className="space-y-4">
          {/* Header */}
          <div>
            <p className="text-2xl font-semibold tracking-tight text-slate-950">Revenue</p>
            <p className="mt-1 text-sm text-slate-500">
              Revenue analytics, payment breakdown, and top members
            </p>
          </div>

          {/* Comparison Cards */}
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {mockComparisons.map((item, index) => (
              <ComparisonCard key={item.label} data={item} index={index} />
            ))}
          </section>

          {/* Revenue Breakdown */}
          <section className="rounded-[1.6rem] border border-slate-200 bg-white p-4 shadow-[0_10px_35px_rgba(15,23,42,0.06)] sm:p-5">
            <div className="mb-4">
              <p className="text-sm font-semibold text-slate-900">Revenue Breakdown</p>
              <p className="text-sm text-slate-500">Revenue sources this month</p>
            </div>

            <div className="space-y-3">
              {mockRevenueBreakdown.map((item, idx) => (
                <motion.div
                  key={item.category}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 + idx * 0.05 }}
                  className="flex items-center gap-3"
                >
                  <div className={`rounded-2xl p-2 text-lg ${item.color}`}>
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-slate-900">{item.category}</p>
                      <p className="text-sm font-semibold text-slate-900">₹{(item.amount / 1000).toFixed(0)}K</p>
                    </div>
                    <div className="mt-1.5 h-2 w-full rounded-full bg-slate-100">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${item.percentage}%` }}
                        transition={{ duration: 0.6, delay: 0.2 + idx * 0.05 }}
                        className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600"
                      />
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{item.percentage}% of total</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.4 }}
              className="mt-4 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 p-4"
            >
              <p className="text-sm text-blue-900">Total Revenue (This Month)</p>
              <p className="mt-1 text-2xl font-bold text-blue-600">₹{(totalRevenue / 100000).toFixed(2)}L</p>
            </motion.div>
          </section>

          {/* Monthly Revenue Trend + Payment Method Distribution */}
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Monthly Revenue Trend Cards */}
            <section className="rounded-[1.6rem] border border-slate-200 bg-white p-4 shadow-[0_10px_35px_rgba(15,23,42,0.06)] sm:p-5">
              <div className="mb-4">
                <p className="text-sm font-semibold text-slate-900">Monthly Revenue Trend</p>
                <p className="text-sm text-slate-500">Last 6 months</p>
              </div>

              <div className="space-y-2">
                {mockMonthlyTrend.map((item, idx) => (
                  <motion.div
                    key={item.month}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.15 + idx * 0.05 }}
                    className="rounded-2xl border border-slate-100 bg-slate-50 p-3 hover:bg-slate-100 transition"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="font-medium text-slate-900">{item.month}</p>
                      <div className="flex items-center gap-1">
                        {item.growth > 0 ? (
                          <>
                            <TrendingUp className="h-4 w-4 text-emerald-600" />
                            <span className="text-sm font-semibold text-emerald-600">+{item.growth}%</span>
                          </>
                        ) : (
                          <>
                            <TrendingDown className="h-4 w-4 text-rose-600" />
                            <span className="text-sm font-semibold text-rose-600">{item.growth}%</span>
                          </>
                        )}
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-slate-600">₹{(item.revenue / 1000).toFixed(0)}K</p>
                  </motion.div>
                ))}
              </div>
            </section>

            {/* Payment Method Distribution */}
            <section className="rounded-[1.6rem] border border-slate-200 bg-white p-4 shadow-[0_10px_35px_rgba(15,23,42,0.06)] sm:p-5">
              <div className="mb-4">
                <p className="text-sm font-semibold text-slate-900">Payment Methods</p>
                <p className="text-sm text-slate-500">Distribution of payments</p>
              </div>

              <div className="space-y-3">
                {(() => {
                  const upi = mockPaymentMethods.find(m => m.method === "UPI");
                  const card = mockPaymentMethods.find(m => m.method === "Credit Card");
                  const cash = mockPaymentMethods.find(m => m.method === "Cash");
                  const methods = [
                    { method: "UPI", data: upi, icon: Smartphone },
                    { method: "Card", data: card, icon: CreditCard },
                    { method: "Cash", data: cash, icon: Banknote },
                  ];
                  return methods.map((item, idx) => {
                    const Icon = item.icon;
                    return (
                      <motion.div
                        key={item.method}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: 0.15 + idx * 0.05 }}
                        className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3 hover:bg-slate-100 transition"
                      >
                        <div className="flex items-center gap-2">
                          <Icon className="h-5 w-5 text-slate-600" />
                          <span className="text-sm font-medium text-slate-900 min-w-12">{item.method}</span>
                        </div>
                        <div className="flex-1 text-right">
                          <p className="text-sm font-semibold text-slate-900">₹{item.data && (item.data.amount / 1000).toFixed(0) || 0}K</p>
                          <p className="text-xs text-slate-500">{item.data?.percentage || 0}%</p>
                        </div>
                      </motion.div>
                    );
                  });
                })()}
              </div>
            </section>
          </div>

          {/* Top Membership Plans */}
          <section className="rounded-[1.6rem] border border-slate-200 bg-white p-4 shadow-[0_10px_35px_rgba(15,23,42,0.06)] sm:p-5">
            <div className="mb-4">
              <p className="text-sm font-semibold text-slate-900">Top Membership Plans</p>
              <p className="text-sm text-slate-500">Revenue by plan tier</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {mockMembershipPlans.map((plan, idx) => (
                <motion.div
                  key={plan.name}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.15 + idx * 0.05 }}
                  className={`rounded-[1.6rem] bg-gradient-to-br ${plan.color} p-4 text-white shadow-lg hover:shadow-xl transition`}
                >
                  <p className="font-semibold text-white/90">{plan.name}</p>
                  <div className="mt-3 space-y-2">
                    <div>
                      <p className="text-sm text-white/70">Members</p>
                      <p className="text-lg font-bold text-white">{plan.members}</p>
                    </div>
                    <div className="border-t border-white/20 pt-2">
                      <p className="text-sm text-white/70">Revenue</p>
                      <p className="text-lg font-bold text-white">₹{(plan.revenue / 100000).toFixed(1)}L</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Monthly Revenue Trend Chart */}
          <MonthlyRevenueChart data={mockMonthlyRevenue} />

          {/* Revenue by Plan + Payment Method */}
          <div className="grid gap-4 sm:grid-cols-2">
            <PlanBreakdown data={mockPlanRevenue} />
            <PaymentMethodBreakdown data={mockPaymentMethods} />
          </div>

          {/* Top Members + Insights */}
          <div className="grid gap-4 sm:grid-cols-2">
            <TopMembersList data={mockTopMembers} />
            <RevenueInsights items={mockRevenueInsights} />
          </div>
        </div>
      </PageContainer>

      <BottomNavigation />
    </div>
  );
}