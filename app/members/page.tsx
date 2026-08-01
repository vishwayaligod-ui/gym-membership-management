"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  Users,
  UserCheck,
  Calendar,
  UserPlus,
  Download,
  Upload,
  X,
  ChevronDown,
  SlidersHorizontal,
  Loader2,
} from "lucide-react";
import { motion } from "framer-motion";
import { Toaster, toast } from "sonner";
import { type MemberStatus, type Member, type MembersKPIs, planColors } from "./types";
import { MembersTable } from "../components/v4/MembersTable";
import { QuickPanel } from "../components/v4/QuickPanel";
import { Pagination } from "../components/v4/Pagination";
import { StatusBadge } from "../components/v4/StatusBadge";
import { FadeUp } from "../components/v4/MotionDiv";

const statusFilters: Array<{ label: string; value: MemberStatus | "All" }> = [
  { label: "All", value: "All" },
  { label: "Active", value: "Active" },
  { label: "Expiring", value: "Expiring" },
  { label: "Expired", value: "Expired" },
  { label: "Pending", value: "Pending" },
];

const planFilters = ["All", "Platinum", "Premium", "Classic", "Basic"];
const genderFilters = ["All", "Male", "Female"];
const sortOptions = [
  { label: "Newest First", value: "newest" },
  { label: "Oldest First", value: "oldest" },
  { label: "Name A-Z", value: "name-asc" },
  { label: "Name Z-A", value: "name-desc" },
  { label: "Expiry Soon", value: "expiry-asc" },
];

export default function MembersPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<MemberStatus | "All">("All");
  const [planFilter, setPlanFilter] = useState("All");
  const [genderFilter, setGenderFilter] = useState("All");
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [showFilters, setShowFilters] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [kpis, setKpis] = useState<MembersKPIs>({
    totalMembers: 0,
    activeMembers: 0,
    expiringSoon: 0,
    newThisMonth: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const fetchMembers = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.set("search", searchQuery);
      if (statusFilter !== "All") params.set("status", statusFilter);
      if (planFilter !== "All") params.set("plan", planFilter);
      if (genderFilter !== "All") params.set("gender", genderFilter);
      if (sortBy !== "newest") params.set("sortBy", sortBy);

      const response = await fetch(`/api/members?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch members");
      const data = await response.json();
      setMembers(data.members);
      setKpis(data.kpis);
    } catch (error) {
      console.error("Failed to fetch members:", error);
      toast.error("Failed to load members");
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, statusFilter, planFilter, genderFilter, sortBy]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  // Pagination (client-side after filtering)
  const filteredMembers = useMemo(() => {
    return members;
  }, [members]);

  const totalPages = Math.ceil(filteredMembers.length / rowsPerPage);
  const paginatedMembers = filteredMembers.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const hasActiveFilters = statusFilter !== "All" || planFilter !== "All" || genderFilter !== "All" || sortBy !== "newest";

  const resetFilters = () => {
    setStatusFilter("All");
    setPlanFilter("All");
    setGenderFilter("All");
    setSortBy("newest");
    setSearchQuery("");
    setCurrentPage(1);
  };

  const handleDelete = async (memberId: string) => {
    if (!window.confirm("Are you sure you want to delete this member? This action cannot be undone.")) {
      return;
    }

    setIsDeleting(memberId);
    try {
      const response = await fetch(`/api/members/${memberId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete member");
      }

      toast.success("Member deleted successfully");
      fetchMembers();
    } catch (error) {
      console.error("Failed to delete member:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete member");
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="space-y-6">
      <Toaster position="top-right" richColors closeButton />
      {/* ═══════════════════════════════════════════
         PAGE HEADER
         ═══════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-100">
            Members
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage all gym members from one place.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <motion.button
            whileHover={{ y: -2, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push("/members/add")}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-5 py-2.5 text-[13px] font-semibold text-white shadow-lg shadow-blue-600/25 transition-all hover:from-blue-500 hover:to-blue-400 hover:shadow-blue-500/30"
            type="button"
          >
            <Plus className="h-4 w-4" />
            Add Member
          </motion.button>
          <motion.button
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-2.5 text-[12px] font-semibold text-slate-400 transition-all hover:border-slate-600 hover:text-slate-200"
            type="button"
          >
            <Download className="h-3.5 w-3.5" />
            Export
          </motion.button>
          <motion.button
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-2.5 text-[12px] font-semibold text-slate-400 transition-all hover:border-slate-600 hover:text-slate-200"
            type="button"
          >
            <Upload className="h-3.5 w-3.5" />
            Import
          </motion.button>
        </div>
      </motion.div>

      {/* ═══════════════════════════════════════════
         TOP SUMMARY CARDS
         ═══════════════════════════════════════════ */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <FadeUp delay={0.05}>
          <motion.div
            whileHover={{ y: -3, transition: { duration: 0.15 } }}
            className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-[18px] transition-all hover:border-slate-600/60 hover:bg-slate-800/60"
          >
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-900/30">
                <Users className="h-3.5 w-3.5 text-blue-400" />
              </div>
              <span className="text-[9px] font-medium uppercase tracking-[0.06em] text-slate-500">
                Total Members
              </span>
            </div>
            <p className="mt-2 text-[24px] font-semibold tabular-nums text-slate-100">
              {isLoading ? "..." : kpis.totalMembers}
            </p>
            <p className="mt-0.5 text-[10px] text-slate-500">All registered members</p>
          </motion.div>
        </FadeUp>

        <FadeUp delay={0.1}>
          <motion.div
            whileHover={{ y: -3, transition: { duration: 0.15 } }}
            className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-[18px] transition-all hover:border-slate-600/60 hover:bg-slate-800/60"
          >
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-900/30">
                <UserCheck className="h-3.5 w-3.5 text-emerald-400" />
              </div>
              <span className="text-[9px] font-medium uppercase tracking-[0.06em] text-slate-500">
                Active Memberships
              </span>
            </div>
            <p className="mt-2 text-[24px] font-semibold tabular-nums text-slate-100">
              {isLoading ? "..." : kpis.activeMembers}
            </p>
            <p className="mt-0.5 text-[10px] text-slate-500">
              {kpis.totalMembers > 0 ? `${Math.round((kpis.activeMembers / kpis.totalMembers) * 100)}% of total` : "0% of total"}
            </p>
          </motion.div>
        </FadeUp>

        <FadeUp delay={0.15}>
          <motion.div
            whileHover={{ y: -3, transition: { duration: 0.15 } }}
            className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-[18px] transition-all hover:border-slate-600/60 hover:bg-slate-800/60"
          >
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-900/30">
                <Calendar className="h-3.5 w-3.5 text-amber-400" />
              </div>
              <span className="text-[9px] font-medium uppercase tracking-[0.06em] text-slate-500">
                Expiring This Month
              </span>
            </div>
            <p className="mt-2 text-[24px] font-semibold tabular-nums text-slate-100">
              {isLoading ? "..." : kpis.expiringSoon}
            </p>
            <p className="mt-0.5 text-[10px] text-slate-500">Requires attention</p>
          </motion.div>
        </FadeUp>

        <FadeUp delay={0.2}>
          <motion.div
            whileHover={{ y: -3, transition: { duration: 0.15 } }}
            className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-[18px] transition-all hover:border-slate-600/60 hover:bg-slate-800/60"
          >
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-900/30">
                <UserPlus className="h-3.5 w-3.5 text-purple-400" />
              </div>
              <span className="text-[9px] font-medium uppercase tracking-[0.06em] text-slate-500">
                New This Month
              </span>
            </div>
            <p className="mt-2 text-[24px] font-semibold tabular-nums text-slate-100">
              {isLoading ? "..." : kpis.newThisMonth}
            </p>
            <p className="mt-0.5 text-[10px] text-slate-500">New registrations</p>
          </motion.div>
        </FadeUp>
      </div>

      {/* ═══════════════════════════════════════════
         SEARCH & FILTER BAR
         ═══════════════════════════════════════════ */}
      <FadeUp delay={0.1}>
        <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-4 sm:p-5">
          {/* Search Row */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search by name, phone, email, or username..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full rounded-lg border border-slate-700 bg-slate-900/50 py-3 pl-10 pr-4 text-[13px] text-slate-200 outline-none placeholder:text-slate-500 transition-all focus:border-blue-500 focus:bg-slate-900/80 focus:ring-1 focus:ring-blue-500/30"
              />
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
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Filters
              {hasActiveFilters && (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-[9px] font-bold text-white">
                  {
                    [statusFilter !== "All", planFilter !== "All", genderFilter !== "All", sortBy !== "newest"].filter(Boolean).length
                  }
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
              className="mt-4 flex flex-wrap items-center gap-3 border-t border-slate-700/40 pt-4"
            >
              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <label className="text-[11px] font-medium text-slate-500">Status:</label>
                <div className="flex flex-wrap gap-1.5">
                  {statusFilters.map((f) => (
                    <motion.button
                      key={f.value}
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => {
                        setStatusFilter(f.value);
                        setCurrentPage(1);
                      }}
                      className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-all ${
                        statusFilter === f.value
                          ? "bg-blue-600 text-white shadow-sm shadow-blue-600/20"
                          : "border border-slate-700 bg-slate-900/50 text-slate-400 hover:border-slate-600 hover:text-slate-200"
                      }`}
                      type="button"
                    >
                      {f.label}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Plan Filter */}
              <div className="flex items-center gap-2">
                <label className="text-[11px] font-medium text-slate-500">Plan:</label>
                <select
                  value={planFilter}
                  onChange={(e) => {
                    setPlanFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-1.5 text-[12px] font-medium text-slate-300 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20"
                >
                  {planFilters.map((p) => (
                    <option key={p} value={p} className="bg-slate-800 text-slate-300">
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              {/* Gender Filter */}
              <div className="flex items-center gap-2">
                <label className="text-[11px] font-medium text-slate-500">Gender:</label>
                <select
                  value={genderFilter}
                  onChange={(e) => {
                    setGenderFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-1.5 text-[12px] font-medium text-slate-300 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20"
                >
                  {genderFilters.map((g) => (
                    <option key={g} value={g} className="bg-slate-800 text-slate-300">
                      {g}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort */}
              <div className="flex items-center gap-2">
                <label className="text-[11px] font-medium text-slate-500">Sort:</label>
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-1.5 text-[12px] font-medium text-slate-300 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20"
                >
                  {sortOptions.map((s) => (
                    <option key={s.value} value={s.value} className="bg-slate-800 text-slate-300">
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Reset */}
              {hasActiveFilters && (
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={resetFilters}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-red-900/40 bg-red-950/20 px-3 py-1.5 text-[11px] font-semibold text-red-400 transition-all hover:bg-red-950/30"
                  type="button"
                >
                  <X className="h-3 w-3" />
                  Reset
                </motion.button>
              )}
            </motion.div>
          )}
        </div>
      </FadeUp>

      {/* ═══════════════════════════════════════════
         MAIN CONTENT: TABLE + QUICK PANEL
         ═══════════════════════════════════════════ */}
      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Table Section */}
        <div className="flex-1 min-w-0 space-y-4">
          {isLoading ? (
            <FadeUp delay={0.15}>
              <div className="flex flex-col items-center justify-center rounded-xl border border-slate-700/60 bg-slate-800/40 px-6 py-20 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
                <p className="mt-4 text-base font-semibold text-slate-300">Loading members...</p>
              </div>
            </FadeUp>
          ) : paginatedMembers.length === 0 ? (
            <FadeUp delay={0.15}>
              <div className="flex flex-col items-center justify-center rounded-xl border border-slate-700/60 bg-slate-800/40 px-6 py-20 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-700/40">
                  <Users className="h-6 w-6 text-slate-500" />
                </div>
                <p className="mt-4 text-base font-semibold text-slate-300">No Members Found</p>
                <p className="mt-1.5 text-sm text-slate-500 max-w-sm">
                  {searchQuery || hasActiveFilters
                    ? "Try adjusting your search terms or filters to find what you're looking for."
                    : "Get started by adding your first member to the system."}
                </p>
                {!searchQuery && !hasActiveFilters && (
                  <motion.button
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => router.push("/members/add")}
                    className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-5 py-2.5 text-[13px] font-semibold text-white shadow-lg shadow-blue-600/25 transition-all hover:from-blue-500 hover:to-blue-400"
                    type="button"
                  >
                    <Plus className="h-4 w-4" />
                    Add Member
                  </motion.button>
                )}
              </div>
            </FadeUp>
          ) : (
            <>
              <FadeUp delay={0.15}>
                <MembersTable
                  members={paginatedMembers}
                  onDelete={handleDelete}
                  isDeleting={isDeleting}
                />
              </FadeUp>

              <FadeUp delay={0.2}>
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={filteredMembers.length}
                  rowsPerPage={rowsPerPage}
                  onPageChange={setCurrentPage}
                  onRowsPerPageChange={(rows) => {
                    setRowsPerPage(rows);
                    setCurrentPage(1);
                  }}
                />
              </FadeUp>
            </>
          )}
        </div>

        {/* Quick Panel */}
        <div className="hidden lg:block">
          <QuickPanel members={members} />
        </div>
      </div>
    </div>
  );
}