"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, TrendingUp, Clock, CheckCircle2, AlertCircle, DollarSign } from "lucide-react";
import { AppHeader } from "../components/AppHeader";
import { BottomNavigation } from "../components/BottomNavigation";
import { PageContainer } from "../components/PageContainer";
import { PaymentCard } from "../components/payments/PaymentCard";
import {
  mockPayments,
  paymentSummaryCards,
  type PaymentStatus,
} from "./mockPayments";

type FilterKey = "all" | PaymentStatus;

const filterChips: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "paid", label: "Paid" },
  { key: "pending", label: "Pending" },
  { key: "failed", label: "Failed" },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3 },
  },
};

export default function PaymentHistoryPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");

  const filteredPayments = useMemo(() => {
    let result = mockPayments;

    if (activeFilter !== "all") {
      result = result.filter((p) => p.status === activeFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.memberName.toLowerCase().includes(q) ||
          p.plan.toLowerCase().includes(q) ||
          p.method.toLowerCase().includes(q)
      );
    }

    return result;
  }, [searchQuery, activeFilter]);

  // Calculate collections
  const todaysPayments = mockPayments.filter(p => p.date === "Jul 17, 2026" && p.status === "paid");
  const todaysCollection = todaysPayments.reduce((sum, p) => sum + p.amount, 0);
  
  const pendingPayments = mockPayments.filter(p => p.status === "pending");
  const pendingAmount = pendingPayments.reduce((sum, p) => sum + p.amount, 0);
  
  const thisMonthPaid = mockPayments.filter(p => p.status === "paid");
  const thisMonthCollection = thisMonthPaid.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,_#f5f8ff_0%,_#eef5ff_100%)] text-slate-900">
      <AppHeader title="Payments" />

      <PageContainer>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-6 py-4"
        >
          {/* -------- Header -------- */}
          <div>
            <p className="text-2xl font-semibold tracking-tight text-slate-950">
              Payments Dashboard
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Track revenue, collections, and payment status
            </p>
          </div>

          {/* -------- Revenue Summary Cards -------- */}
          <motion.section
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-600">Revenue Overview</h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {paymentSummaryCards.map((card, i) => (
                <motion.article
                  key={card.label}
                  variants={itemVariants}
                  className={`rounded-[1.4rem] border border-slate-200 bg-white p-4 shadow-[0_10px_35px_rgba(15,23,42,0.06)]`}
                >
                  <p className="text-sm font-medium text-slate-500">{card.label}</p>
                  <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                    {card.value}
                  </p>
                  <p className="mt-2 text-xs font-medium text-slate-600">{card.change}</p>
                </motion.article>
              ))}
            </div>
          </motion.section>

          {/* -------- Collections Cards -------- */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
          >
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-600">Collections</h3>
            <div className="grid gap-3 sm:grid-cols-3">
              {/* Today's Collection */}
              <div className="rounded-[1.4rem] border border-slate-200 bg-gradient-to-br from-emerald-50 to-white p-4 shadow-[0_10px_35px_rgba(15,23,42,0.06)]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Today's Collection</p>
                    <p className="mt-2 text-2xl font-semibold text-emerald-700">₹{todaysCollection.toLocaleString()}</p>
                  </div>
                  <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-600">
                    <DollarSign className="h-5 w-5" />
                  </div>
                </div>
                <p className="mt-2 text-xs text-slate-600">{todaysPayments.length} transactions</p>
              </div>

              {/* This Month Collection */}
              <div className="rounded-[1.4rem] border border-slate-200 bg-gradient-to-br from-blue-50 to-white p-4 shadow-[0_10px_35px_rgba(15,23,42,0.06)]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">This Month</p>
                    <p className="mt-2 text-2xl font-semibold text-blue-700">₹{thisMonthCollection.toLocaleString()}</p>
                  </div>
                  <div className="rounded-2xl bg-blue-100 p-3 text-blue-600">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                </div>
                <p className="mt-2 text-xs text-slate-600">{thisMonthPaid.length} paid transactions</p>
              </div>

              {/* Pending Payments */}
              <div className="rounded-[1.4rem] border border-slate-200 bg-gradient-to-br from-amber-50 to-white p-4 shadow-[0_10px_35px_rgba(15,23,42,0.06)]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Pending Payments</p>
                    <p className="mt-2 text-2xl font-semibold text-amber-700">₹{pendingAmount.toLocaleString()}</p>
                  </div>
                  <div className="rounded-2xl bg-amber-100 p-3 text-amber-600">
                    <Clock className="h-5 w-5" />
                  </div>
                </div>
                <p className="mt-2 text-xs text-slate-600">{pendingPayments.length} pending</p>
              </div>
            </div>
          </motion.section>

          {/* -------- Search Bar -------- */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="relative"
          >
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, plan, or payment method..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm font-medium text-slate-900 placeholder-slate-400 shadow-[0_10px_35px_rgba(15,23,42,0.06)] transition focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </motion.div>

          {/* -------- Filter Chips -------- */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.25 }}
            className="flex flex-wrap items-center gap-2"
          >
            {filterChips.map((chip) => {
              const active = chip.key === activeFilter;
              return (
                <button
                  key={chip.key}
                  type="button"
                  onClick={() => setActiveFilter(chip.key)}
                  className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
                    active
                      ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                      : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900"
                  }`}
                >
                  {chip.label}
                </button>
              );
            })}
          </motion.div>

          {/* -------- Recent Payment List -------- */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-900">Recent Payments</h3>
                <p className="mt-0.5 text-sm text-slate-500">{filteredPayments.length} transaction(s)</p>
              </div>
            </div>

            <div className="space-y-3">
              {filteredPayments.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center rounded-[1.6rem] border border-slate-200 bg-white p-8 text-center shadow-[0_10px_35px_rgba(15,23,42,0.06)]"
                >
                  <AlertCircle className="h-10 w-10 text-slate-300" />
                  <p className="mt-3 text-sm font-semibold text-slate-900">
                    No payments found
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Try adjusting your search or filter.
                  </p>
                </motion.div>
              ) : (
                filteredPayments.map((payment, i) => (
                  <PaymentCard key={payment.id} payment={payment} index={i} />
                ))
              )}
            </div>
          </motion.section>
        </motion.div>
      </PageContainer>

      <BottomNavigation />
    </div>
  );
}