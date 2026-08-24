"use client";

import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { Calendar, AlertCircle, CheckCircle2, Clock, Search } from "lucide-react";
import { useState, useMemo, useEffect, Suspense } from "react";
import { RenewalForm } from "@/app/renewals/RenewalForm";
import { useMountedDateString } from "@/app/components/useMountedDateString";

interface RenewalMember {
  id: string;
  memberId: string;
  name: string;
  plan: string;
  phone: string;
  expiryDate: string;
  daysRemaining: number;
  fee: number;
  status: "Active" | "Due Soon" | "Expired" | "Renewed";
  avatar: string;
}

interface RenewalsStats {
  today: number;
  soon: number;
  upcoming: number;
  expired: number;
  renewed: number;
}

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
    return { label: "Expires Today", color: "text-rose-400", bgColor: "bg-rose-900/30 ring-rose-900/50", icon: AlertCircle };
  } else if (daysRemaining > 0 && daysRemaining <= 7) {
    return { label: `${daysRemaining}d left`, color: "text-amber-400", bgColor: "bg-amber-900/30 ring-amber-900/50", icon: Clock };
  } else if (daysRemaining > 7 && daysRemaining <= 30) {
    return { label: `${daysRemaining}d left`, color: "text-blue-400", bgColor: "bg-blue-900/30 ring-blue-900/50", icon: CheckCircle2 };
  } else {
    return { label: `${Math.abs(daysRemaining)}d expired`, color: "text-slate-400", bgColor: "bg-slate-700/30 ring-slate-700/50", icon: AlertCircle };
  }
}

function RenewalCard({ renewal, onRenew }: { renewal: RenewalMember; onRenew: (route: string) => void }) {
  const statusDisplay = getRenewalStatusDisplay(renewal.daysRemaining);
  const StatusIcon = statusDisplay.icon;

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="overflow-hidden rounded-xl border border-[#334155] bg-[#1E293B] shadow-sm transition-shadow duration-300 hover:border-slate-600/60 hover:bg-[#273449]"
    >
      {/* Header Section */}
      <div className="border-b border-[#334155] p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-500 text-sm font-semibold text-white shadow-md shadow-blue-600/15">
              {renewal.avatar}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-semibold text-[#F8FAFC]">{renewal.name}</p>
              <p className="truncate text-[13px] text-[#64748B]">{renewal.plan}</p>
            </div>
          </div>
          <div className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${statusDisplay.bgColor}`}>
            <StatusIcon className="h-3.5 w-3.5" />
            <span className={statusDisplay.color}>{statusDisplay.label}</span>
          </div>
        </div>
      </div>

      {/* Details Section */}
      <div className="space-y-3 p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Expiry Date</p>
            <p className="mt-1.5 flex items-center gap-2 text-[14px] font-medium text-[#F8FAFC]">
              <Calendar className="h-4 w-4 text-slate-500" />
              {renewal.expiryDate}
            </p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Renewal Fee</p>
            <p className="mt-1.5 text-[14px] font-medium text-[#F8FAFC]">₹{renewal.fee.toLocaleString()}</p>
          </div>
        </div>

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Contact</p>
          <p className="mt-1.5 text-[14px] font-medium text-[#F8FAFC]">{renewal.phone}</p>
        </div>
      </div>

      {/* Action Section */}
      <div className="border-t border-[#334155] px-5 py-4">
        <button
          onClick={() => onRenew(renewal.daysRemaining < 0 ? `/renewals/${renewal.id}` : `/renewals/add?memberId=${renewal.memberId}`)}
          type="button"
          className={`w-full rounded-xl px-4 py-3 text-[13px] font-semibold transition-all duration-200 ${
            renewal.daysRemaining < 0
              ? "border border-slate-700 text-[#64748B] hover:border-blue-500/40 hover:text-blue-400 hover:bg-blue-900/20"
              : "bg-blue-600 text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 hover:shadow-blue-600/30"
          }`}
        >
          {renewal.daysRemaining < 0 ? "View Details" : "Renew Membership"}
        </button>
      </div>
    </motion.article>
  );
}

function RenewalsDashboard() {
  const router = useRouter();
  // Date is formatted only after mount to avoid hydration mismatches
  // (iOS Safari's locale output differs from the Node.js server render).
  const todayDate = useMountedDateString(() =>
    new Date().toLocaleDateString("en-US", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [renewals, setRenewals] = useState<RenewalMember[]>([]);
  const [stats, setStats] = useState<RenewalsStats>({ today: 0, soon: 0, upcoming: 0, expired: 0, renewed: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchRenewals() {
      try {
        const response = await fetch("/api/renewals");
        if (!response.ok) throw new Error("Failed to fetch");
        const data = await response.json();
        setRenewals(data.renewals);
        setStats(data.stats);
      } catch (error) {
        console.error("Failed to fetch renewals:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchRenewals();
  }, []);

  const handleRenew = (route: string) => {
    router.push(route);
  };

  const filteredRenewals = useMemo(() => {
    return renewals
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
  }, [searchQuery, activeFilter, renewals]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-32">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ═══════════════════════════════════════════
          PAGE HEADER — Renewals
          ═══════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-100">
            Membership Renewals
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {todayDate}
          </p>
        </div>
      </motion.div>

      {/* ═══════════════════════════════════════════
          SEARCH BAR
          ═══════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
      >
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search members by name, plan, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-900/50 py-3 pl-10 pr-4 text-[13px] text-slate-200 outline-none placeholder:text-slate-500 transition-all focus:border-blue-500 focus:bg-slate-900/80 focus:ring-1 focus:ring-blue-500/30"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
            <span className="rounded-md border border-slate-700 bg-slate-800 px-1.5 py-0.5 text-[9px] font-medium text-slate-500 shadow-sm">
              ⌘K
            </span>
          </div>
        </div>
      </motion.div>

      {/* ═══════════════════════════════════════════
          FILTER CHIPS
          ═══════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="flex flex-wrap gap-2"
      >
        {filterOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => setActiveFilter(option.value)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-all ${
              activeFilter === option.value
                ? "bg-blue-600 text-white shadow-sm shadow-blue-600/20"
                : "border border-slate-700 bg-slate-900/50 text-slate-400 hover:border-slate-600 hover:text-slate-200"
            }`}
            type="button"
          >
            <span>{option.icon}</span>
            <span>{option.label}</span>
          </button>
        ))}
      </motion.div>

      {/* ═══════════════════════════════════════════
          KPI STATS CARDS
          ═══════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.15 }}
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
      >
        {[
          { label: "Expiring Today", value: stats.today, icon: Calendar, color: "bg-rose-900/30", iconColor: "text-rose-400", ringColor: "ring-rose-900/50" },
          { label: "Next 7 Days", value: stats.soon, icon: Clock, color: "bg-amber-900/30", iconColor: "text-amber-400", ringColor: "ring-amber-900/50" },
          { label: "This Month", value: stats.upcoming, icon: Calendar, color: "bg-blue-900/30", iconColor: "text-blue-400", ringColor: "ring-blue-900/50" },
          { label: "Expired", value: stats.expired, icon: AlertCircle, color: "bg-slate-700/30", iconColor: "text-slate-400", ringColor: "ring-slate-700/50" },
        ].map((stat, idx) => {
          const StatIcon = stat.icon;
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.15 + idx * 0.05 }}
              whileHover={{ y: -3, transition: { duration: 0.15 } }}
              className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-[18px] transition-all hover:border-slate-600/60 hover:bg-slate-800/60"
            >
              <div className="flex items-center gap-2">
                <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${stat.color}`}>
                  <StatIcon className={`h-3.5 w-3.5 ${stat.iconColor}`} />
                </div>
                <span className="text-[9px] font-medium uppercase tracking-[0.06em] text-slate-500">
                  {stat.label}
                </span>
              </div>
              <p className="mt-2 text-[24px] font-semibold tabular-nums text-slate-100">
                {stat.value}
              </p>
              <p className="mt-0.5 text-[10px] text-slate-500">
                {stat.label === "Expiring Today"
                  ? "Requires immediate action"
                  : stat.label === "Next 7 Days"
                  ? "Due within this week"
                  : stat.label === "This Month"
                  ? "Due within 30 days"
                  : "Overdue memberships"}
              </p>
            </motion.div>
          );
        })}
      </motion.div>

      {/* ═══════════════════════════════════════════
          MEMBER RENEWAL CARDS
          ═══════════════════════════════════════════ */}
      <div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          {filteredRenewals.length > 0 ? (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <p className="text-[13px] font-medium text-slate-500">
                  Showing {filteredRenewals.length} of {renewals.length} members
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
                    <RenewalCard renewal={renewal} onRenew={handleRenew} />
                  </motion.div>
                ))}
              </motion.div>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center justify-center rounded-xl border border-slate-700/60 bg-slate-800/40 px-6 py-20 text-center"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-700/40">
                <AlertCircle className="h-6 w-6 text-slate-500" />
              </div>
              <p className="mt-4 text-base font-semibold text-slate-300">No renewals found</p>
              <p className="mt-1.5 text-sm text-slate-500">
                {searchQuery ? "Try adjusting your search" : "Try selecting a different filter"}
              </p>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

function RenewalsPageContent() {
  const searchParams = useSearchParams();
  const memberId = searchParams.get("memberId");

  if (memberId) {
    return <RenewalForm initialMemberId={memberId} />;
  }

  return <RenewalsDashboard />;
}

export default function RenewalsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-32">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
    </div>}>
      <RenewalsPageContent />
    </Suspense>
  );
}
