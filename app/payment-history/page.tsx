"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
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

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,_#f5f8ff_0%,_#eef5ff_100%)] text-slate-900">
      <AppHeader title="Payment History" />

      <PageContainer>
        <div className="space-y-4">
          {/* -------- Header -------- */}
          <div>
            <p className="text-2xl font-semibold tracking-tight text-slate-950">
              Payment History
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Track revenue, invoices, and payment status
            </p>
          </div>

          {/* -------- Summary Cards -------- */}
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {paymentSummaryCards.map((card, i) => (
              <motion.article
                key={card.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: i * 0.05, ease: "easeOut" }}
                className="rounded-[1.4rem] border border-slate-200 bg-white p-4 shadow-[0_10px_35px_rgba(15,23,42,0.06)]"
              >
                <p className="text-sm font-medium text-slate-500">{card.label}</p>
                <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
                  {card.value}
                </p>
                <p className="mt-2 text-sm text-slate-500">{card.change}</p>
              </motion.article>
            ))}
          </section>

          {/* -------- Search Bar -------- */}
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, plan, or payment method..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm font-medium text-slate-900 placeholder-slate-400 shadow-[0_10px_35px_rgba(15,23,42,0.06)] transition focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>

          {/* -------- Filter Chips -------- */}
          <div className="flex flex-wrap items-center gap-2">
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
          </div>

          {/* -------- Payment List -------- */}
          <div className="space-y-3">
            {filteredPayments.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center rounded-[1.6rem] border border-slate-200 bg-white p-8 text-center shadow-[0_10px_35px_rgba(15,23,42,0.06)]"
              >
                <p className="text-sm font-semibold text-slate-900">
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
        </div>
      </PageContainer>

      <BottomNavigation />
    </div>
  );
}