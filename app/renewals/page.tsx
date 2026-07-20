"use client";

import { motion } from "framer-motion";
import { Calendar, Search, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { useState, useMemo } from "react";
import { AppHeader } from "@/app/components/AppHeader";
import { BottomNavigation } from "@/app/components/BottomNavigation";
import { PageContainer } from "@/app/components/PageContainer";
import { mockRenewals, type RenewalMember } from "@/app/renewals/mockRenewals";

type FilterType = "all" | "today" | "7days" | "30days" | "expired";

const filterOptions: Array<{ value: FilterType; label: string; icon: string }> = [
  { value: "all", label: "All", icon: "📊" },
  { value: "today", label: "Today", icon: "📅" },
  { value: "7days", label: "7 Days", icon: "📆" },
  { value: "30days", label: "30 Days", icon: "📋" },
  { value: "expired", label: "Expired", icon: "⏰" },
];

function categorizeRenewal(renewal: RenewalMember): FilterType[] {
  const categories: FilterType[] = [];

  if (renewal.daysRemaining === 0) {
    categories.push("today", "all");
  } else if (renewal.daysRemaining > 0 && renewal.daysRemaining <= 7) {
    categories.push("7days", "all");
  } else if (renewal.daysRemaining > 7 && renewal.daysRemaining <= 30) {
    categories.push("30days", "all");
  } else if (renewal.daysRemaining < 0) {
    categories.push("expired", "all");
  }

  return categories;
}

function getRenewalStatusDisplay(daysRemaining: number): { label: string; color: string; bgColor: string; icon: typeof CheckCircle2 } {
  if (daysRemaining === 0) {
    return { label: "Expires Today", color: "text-rose-600", bgColor: "bg-rose-50 ring-rose-200", icon: AlertCircle };
  } else if (daysRemaining > 0 && daysRemaining <= 7) {
    return { label: `${daysRemaining}d left`, color: "text-amber-600", bgColor: "bg-amber-50 ring-amber-200", icon: Clock };
  } else if (daysRemaining > 7 && daysRemaining <= 30) {
    return { label: `${daysRemaining}d left`, color: "text-blue-600", bgColor: "bg-blue-50 ring-blue-200", icon: CheckCircle2 };
  } else {
    return { label: `${Math.abs(daysRemaining)}d expired`, color: "text-slate-600", bgColor: "bg-slate-50 ring-slate-200", icon: AlertCircle };
  }
}

function RenewalCard({ renewal }: { renewal: RenewalMember }) {
  const statusDisplay = getRenewalStatusDisplay(renewal.daysRemaining);
  const StatusIcon = statusDisplay.icon;

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="overflow-hidden rounded-[1.6rem] border border-slate-200 bg-white shadow-[0_10px_35px_rgba(15,23,42,0.06)]"
    >
      {/* Header Section */}
      <div className="border-b border-slate-100 p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-500 text-sm font-semibold text-white shadow-lg shadow-blue-600/10">
              {renewal.avatar}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-semibold text-slate-900">{renewal.name}</p>
              <p className="truncate text-sm text-slate-500">{renewal.plan}</p>
            </div>
          </div>
          <div className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${statusDisplay.bgColor}`}>
            <StatusIcon className="h-3.5 w-3.5" />
            <span className={statusDisplay.color}>{statusDisplay.label}</span>
          </div>
        </div>
      </div>

      {/* Details Section */}
      <div className="space-y-3 p-4 sm:p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Expiry Date</p>
            <p className="mt-1.5 flex items-center gap-2 text-sm font-medium text-slate-900">
              <Calendar className="h-4 w-4 text-slate-400" />
              {renewal.expiryDate}
            </p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Renewal Fee</p>
            <p className="mt-1.5 text-sm font-medium text-slate-900">₹{renewal.fee.toLocaleString()}</p>
          </div>
        </div>

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Contact</p>
          <p className="mt-1.5 text-sm font-medium text-slate-900">{renewal.phone}</p>
        </div>
      </div>

      {/* Action Section */}
      <div className="border-t border-slate-100 px-4 py-3 sm:px-5">
        <button
          type="button"
          className={`w-full rounded-2xl px-4 py-2.5 text-sm font-semibold transition ${
            renewal.daysRemaining < 0
              ? "border border-slate-200 text-slate-600 hover:border-blue-200 hover:text-blue-600"
              : "bg-blue-600 text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700"
          }`}
        >
          {renewal.daysRemaining < 0 ? "View Details" : "Renew Membership"}
        </button>
      </div>
    </motion.article>
  );
}

export default function RenewalsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");

  const filteredRenewals = useMemo(() => {
    return mockRenewals
      .filter((renewal) => {
        // Search filter
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          return (
            renewal.name.toLowerCase().includes(query) ||
            renewal.plan.toLowerCase().includes(query) ||
            renewal.phone.includes(query)
          );
        }
        return true;
      })
      .filter((renewal) => {
        // Category filter
        const categories = categorizeRenewal(renewal);
        return categories.includes(activeFilter);
      });
  }, [searchQuery, activeFilter]);

  const stats = useMemo(() => {
    return {
      today: mockRenewals.filter((r) => r.daysRemaining === 0).length,
      soon: mockRenewals.filter((r) => r.daysRemaining > 0 && r.daysRemaining <= 7).length,
      upcoming: mockRenewals.filter((r) => r.daysRemaining > 7 && r.daysRemaining <= 30).length,
      expired: mockRenewals.filter((r) => r.daysRemaining < 0).length,
    };
  }, []);

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,_#f5f8ff_0%,_#eef5ff_100%)] text-slate-900">
      <AppHeader title="Renewals" />

      <PageContainer>
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-6"
        >
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            Membership Renewals
          </h1>
          <p className="mt-2 text-slate-600">
            Track and manage upcoming membership renewals
          </p>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="mb-5 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 shadow-[0_10px_35px_rgba(15,23,42,0.06)] focus-within:border-blue-500"
        >
          <Search className="h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, plan, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full border-none bg-transparent text-sm outline-none"
          />
        </motion.div>

        {/* Filter Chips */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="mb-8 flex flex-wrap gap-2"
        >
          {filterOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setActiveFilter(option.value)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition ${
                activeFilter === option.value
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                  : "border border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:text-blue-600"
              }`}
            >
              <span>{option.icon}</span>
              <span>{option.label}</span>
            </button>
          ))}
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {[
            { label: "Expiring Today", value: stats.today, icon: "📅", color: "bg-rose-50" },
            { label: "Next 7 Days", value: stats.soon, icon: "⏰", color: "bg-amber-50" },
            { label: "This Month", value: stats.upcoming, icon: "📆", color: "bg-blue-50" },
            { label: "Expired", value: stats.expired, icon: "⛔", color: "bg-slate-50" },
          ].map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.15 + idx * 0.05 }}
              className={`rounded-[1.6rem] border border-slate-200 ${stat.color} p-4 shadow-[0_10px_35px_rgba(15,23,42,0.06)]`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">{stat.label}</p>
                  <p className="mt-2 text-3xl font-bold text-slate-900">{stat.value}</p>
                </div>
                <span className="text-2xl">{stat.icon}</span>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Content Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          {filteredRenewals.length > 0 ? (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm font-medium text-slate-600">
                  Showing {filteredRenewals.length} of {mockRenewals.length} members
                </p>
              </div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.25 }}
                className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
              >
                {filteredRenewals.map((renewal, idx) => (
                  <motion.div
                    key={renewal.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.25 + idx * 0.04 }}
                  >
                    <RenewalCard renewal={renewal} />
                  </motion.div>
                ))}
              </motion.div>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center justify-center rounded-[1.6rem] border border-slate-200 bg-white py-16 shadow-[0_10px_35px_rgba(15,23,42,0.06)]"
            >
              <AlertCircle className="h-12 w-12 text-slate-300" />
              <p className="mt-4 text-lg font-semibold text-slate-900">No renewals found</p>
              <p className="mt-1 text-sm text-slate-500">
                {searchQuery ? "Try adjusting your search" : "Try selecting a different filter"}
              </p>
            </motion.div>
          )}
        </motion.div>
      </PageContainer>

      <BottomNavigation />
    </div>
  );
}
