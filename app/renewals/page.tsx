"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  AlertTriangle, 
  CalendarCheck, 
  CalendarClock, 
  CalendarDays, 
  CalendarX, 
  CheckCircle2, 
  Clock, 
  Filter, 
  IndianRupee, 
  Phone, 
  RefreshCw, 
  Search, 
  ShieldCheck, 
  Sparkles, 
  UserRound, 
  UserRoundCheck, 
  Wallet 
} from "lucide-react";
import { Toaster, toast } from "sonner";

import { AppHeader } from "../components/AppHeader";
import { AttendanceSummaryCard } from "../components/AttendanceSummaryCard";
import { BottomNavigation } from "../components/BottomNavigation";
import { PageContainer } from "../components/PageContainer";
import { mockRenewals, type RenewalMember, type RenewalStatus } from "./mockRenewals";

type FilterType = "All" | "Due Today" | "Next 7 Days" | "Expired";

export default function RenewalsPage() {
  const [renewalsList, setRenewalsList] = useState<RenewalMember[]>(mockRenewals);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("All");

  // Dynamic calculations for summary cards
  const totalRevenue = renewalsList
    .filter((m) => m.daysRemaining <= 7)
    .reduce((sum, m) => sum + m.fee, 0);

  const renewalsTodayCount = renewalsList.filter((m) => m.daysRemaining === 0).length;
  const next7DaysCount = renewalsList.filter((m) => m.daysRemaining >= 0 && m.daysRemaining <= 7).length;
  const expiredCount = renewalsList.filter((m) => m.daysRemaining < 0).length;

  // Handle local renewal action
  const handleRenew = (id: number, name: string) => {
    setRenewalsList((prevList) =>
      prevList.map((member) => {
        if (member.id === id) {
          return {
            ...member,
            status: "Active",
            daysRemaining: 30,
            expiryDate: "Aug 15, 2026", // Extended by 30 days
          };
        }
        return member;
      })
    );
    toast.success(`Membership for ${name} renewed successfully!`, {
      description: "Plan extended by 30 days. Invoice generated.",
      duration: 4000,
    });
  };

  const handleViewProfile = (name: string) => {
    toast.info(`Profile view for ${name}`, {
      description: "Full profiles and history logs are a premium feature.",
      duration: 3000,
    });
  };

  // Filter & search logic
  const filteredMembers = renewalsList.filter((member) => {
    const matchesSearch =
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.phone.includes(searchTerm);

    if (!matchesSearch) return false;

    if (activeFilter === "Due Today") {
      return member.daysRemaining === 0;
    }
    if (activeFilter === "Next 7 Days") {
      return member.daysRemaining >= 0 && member.daysRemaining <= 7;
    }
    if (activeFilter === "Expired") {
      return member.daysRemaining < 0;
    }
    return true; // "All"
  });

  const getStatusStyle = (status: RenewalStatus, daysRemaining: number) => {
    if (status === "Active") {
      return {
        badge: "bg-emerald-50 text-emerald-700 ring-emerald-200",
        border: "border-slate-200/80 bg-white",
        glow: "hover:shadow-[0_15px_30px_rgba(16,185,129,0.06)]",
        daysColor: "text-emerald-600 font-semibold",
      };
    }
    if (daysRemaining < 0) {
      return {
        badge: "bg-rose-50 text-rose-700 ring-rose-200",
        border: "border-rose-100 bg-rose-50/10",
        glow: "hover:shadow-[0_15px_30px_rgba(239,68,68,0.08)]",
        daysColor: "text-rose-600 font-bold",
      };
    }
    // Due Soon
    return {
      badge: "bg-amber-50 text-amber-700 ring-amber-200",
      border: "border-amber-100 bg-amber-50/5",
      glow: "hover:shadow-[0_15px_30px_rgba(245,158,11,0.08)]",
      daysColor: "text-amber-700 font-semibold",
    };
  };

  const resetFilters = () => {
    setSearchTerm("");
    setActiveFilter("All");
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,_#f5f8ff_0%,_#eef5ff_100%)] text-slate-900">
      <Toaster position="top-right" richColors closeButton />
      <AppHeader title="Renewals" />

      <PageContainer>
        <div className="space-y-4">
          {/* Title and Subtitle */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-semibold tracking-tight text-slate-950">Renewals</p>
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500/10 text-blue-600">
                  <Sparkles className="h-3 w-3" />
                </div>
              </div>
              <p className="mt-1 text-sm text-slate-500">Manage membership extensions, due payments, and expired plans</p>
            </div>
            <div className="text-xs font-semibold uppercase tracking-widest text-slate-400 sm:text-right">
              Today: Jul 16, 2026
            </div>
          </div>

          {/* Summary Cards */}
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <AttendanceSummaryCard 
              label="Renewals Today" 
              value={renewalsTodayCount.toString()} 
              tone="bg-amber-50 text-amber-700" 
              icon={Clock} 
            />
            <AttendanceSummaryCard 
              label="Next 7 Days" 
              value={next7DaysCount.toString()} 
              tone="bg-blue-50 text-blue-700" 
              icon={CalendarDays} 
            />
            <AttendanceSummaryCard 
              label="Expired Plans" 
              value={expiredCount.toString()} 
              tone="bg-rose-50 text-rose-700" 
              icon={AlertTriangle} 
            />
            <AttendanceSummaryCard 
              label="Expected Revenue" 
              value={`₹${totalRevenue.toLocaleString()}`} 
              tone="bg-emerald-50 text-emerald-700" 
              icon={Wallet} 
            />
          </section>

          {/* Search Bar & Filter Chips */}
          <section className="flex flex-col gap-3 rounded-[1.5rem] border border-slate-200 bg-white/90 p-3 shadow-[0_10px_35px_rgba(15,23,42,0.06)] md:flex-row md:items-center">
            {/* Search Input */}
            <label className="flex flex-1 items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-500">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search member by name or phone..."
                className="w-full border-none bg-transparent outline-none placeholder:text-slate-400"
              />
            </label>

            {/* Filter Chips Container */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
              <span className="hidden items-center gap-1 text-xs font-semibold uppercase tracking-[0.15em] text-slate-400 md:inline-flex px-1.5">
                <Filter className="h-3 w-3" /> Filter:
              </span>
              {(["All", "Due Today", "Next 7 Days", "Expired"] as FilterType[]).map((filter) => {
                const active = filter === activeFilter;
                return (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setActiveFilter(filter)}
                    className={`shrink-0 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
                      active
                        ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                        : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900"
                    }`}
                  >
                    {filter}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Renewal Member Cards List */}
          <section className="relative min-h-[300px]">
            <motion.div layout className="space-y-3">
              <AnimatePresence mode="popLayout">
                {filteredMembers.map((member, index) => {
                  const style = getStatusStyle(member.status, member.daysRemaining);
                  return (
                    <motion.article
                      key={member.id}
                      layout
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      transition={{ duration: 0.22, delay: index * 0.02 }}
                      className={`rounded-[1.4rem] border p-4 shadow-[0_8px_30px_rgba(15,23,42,0.04)] transition-all ${style.border} ${style.glow}`}
                    >
                      {/* Card Header Info */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          {/* Avatar with Premium Gradient background */}
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-500 text-sm font-semibold text-white shadow-md shadow-blue-600/10">
                            {member.avatar}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-base font-semibold text-slate-900">{member.name}</p>
                            <div className="mt-1 flex flex-wrap items-center gap-2">
                              <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-semibold text-blue-700">
                                {member.plan}
                              </span>
                              <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                                <Phone className="h-3 w-3 text-slate-400" />
                                {member.phone}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 capitalize ${style.badge}`}>
                          {member.status === "Due Soon" && member.daysRemaining === 0 ? "Due Today" : member.status}
                        </span>
                      </div>

                      {/* Card Details Grid */}
                      <div className="mt-4 grid gap-2.5 text-xs text-slate-600 sm:grid-cols-4">
                        <div className="rounded-2xl bg-slate-50/80 p-3 border border-slate-100">
                          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 flex items-center gap-1">
                            <ShieldCheck className="h-3 w-3" /> Expires On
                          </p>
                          <p className="mt-1 font-semibold text-slate-800">{member.expiryDate}</p>
                        </div>

                        <div className="rounded-2xl bg-slate-50/80 p-3 border border-slate-100">
                          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 flex items-center gap-1">
                            <Clock className="h-3 w-3" /> Time Remaining
                          </p>
                          <p className={`mt-1 ${style.daysColor}`}>
                            {member.daysRemaining === 0 && "Expires Today"}
                            {member.daysRemaining > 0 && `In ${member.daysRemaining} Days`}
                            {member.daysRemaining < 0 && `${Math.abs(member.daysRemaining)} Days Overdue`}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-slate-50/80 p-3 border border-slate-100">
                          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 flex items-center gap-1">
                            <IndianRupee className="h-3 w-3" /> Membership Fee
                          </p>
                          <p className="mt-1 font-semibold text-slate-800">₹{member.fee.toLocaleString()}</p>
                        </div>

                        <div className="rounded-2xl bg-slate-50/80 p-3 border border-slate-100">
                          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 flex items-center gap-1">
                            <UserRound className="h-3 w-3" /> Plan Type
                          </p>
                          <p className="mt-1 font-semibold text-slate-800">{member.plan} Access</p>
                        </div>
                      </div>

                      {/* Card Footer Actions */}
                      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
                        {member.status !== "Active" ? (
                          <button
                            type="button"
                            onClick={() => handleRenew(member.id, member.name)}
                            className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white shadow-md shadow-blue-600/10 transition hover:-translate-y-0.5 hover:bg-blue-700"
                          >
                            <RefreshCw className="h-3.5 w-3.5" />
                            Renew Membership
                          </button>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3.5 py-1.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Renewed Successfully
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => handleViewProfile(member.name)}
                          className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-600"
                        >
                          <UserRoundCheck className="h-3.5 w-3.5" />
                          View Profile
                        </button>
                      </div>
                    </motion.article>
                  );
                })}
              </AnimatePresence>
            </motion.div>

            {/* Empty State */}
            {filteredMembers.length === 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mx-auto flex max-w-md flex-col items-center justify-center rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-[0_15px_45px_rgba(15,23,42,0.05)] mt-6"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-50 text-blue-600 shadow-inner">
                  <CalendarX className="h-8 w-8" />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-slate-900">No renewals found</h3>
                <p className="mt-2 text-sm text-slate-500 max-w-xs leading-relaxed">
                  We couldn&apos;t find any renewal records matching &quot;{searchTerm}&quot; under the &quot;{activeFilter}&quot; filter.
                </p>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-600/15 transition hover:bg-blue-700"
                >
                  Clear Filters
                </button>
              </motion.div>
            )}
          </section>
        </div>
      </PageContainer>

      <BottomNavigation />
    </div>
  );
}
