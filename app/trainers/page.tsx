"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  Dumbbell,
  Users,
  Award,
  UserCheck,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { motion } from "framer-motion";
import { Toaster, toast } from "sonner";
import type { Trainer, TrainerStatus, TrainersResponse } from "./types";
import { TrainersTable } from "@/components/trainers/TrainersTable";
import { Pagination } from "../components/v4/Pagination";
import { FadeUp } from "../components/v4/MotionDiv";

const statusFilters: Array<{ label: string; value: TrainerStatus | "All" }> = [
  { label: "All", value: "All" },
  { label: "Active", value: "Active" },
  { label: "On Leave", value: "On Leave" },
  { label: "Inactive", value: "Inactive" },
];

const defaultSpecializationFilters = ["All", "Strength", "Cardio", "CrossFit", "Yoga", "Zumba"];
const sortOptions = [
  { label: "Experience (High)", value: "exp-desc" },
  { label: "Experience (Low)", value: "exp-asc" },
  { label: "Name A-Z", value: "name-asc" },
  { label: "Name Z-A", value: "name-desc" },
  { label: "Rating (High)", value: "rating-desc" },
  { label: "Rating (Low)", value: "rating-asc" },
];

export default function TrainersPage() {
  const router = useRouter();
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [kpis, setKpis] = useState({
    totalTrainers: 0,
    activeTrainers: 0,
    onLeaveTrainers: 0,
    totalAssignedMembers: 0,
  });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<TrainerStatus | "All">("All");
  const [specializationFilter, setSpecializationFilter] = useState("All");
  const [sortBy, setSortBy] = useState("exp-desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [showFilters, setShowFilters] = useState(false);
  const [trainerToDelete, setTrainerToDelete] = useState<Trainer | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchTrainers = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError(null);

      const response = await fetch("/api/trainers", { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Failed to fetch trainers");
      }

      const data = (await response.json()) as TrainersResponse;

      setTrainers(data.trainers ?? []);
      setKpis(
        data.kpis ?? {
          totalTrainers: 0,
          activeTrainers: 0,
          onLeaveTrainers: 0,
          totalAssignedMembers: 0,
        }
      );
    } catch (error) {
      console.error("Failed to load trainers:", error);
      setLoadError("Unable to load trainers right now.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrainers();
  }, [fetchTrainers]);

  const specializationFilters = useMemo(() => {
    const uniqueValues = Array.from(
      new Set(
        trainers
          .map((trainer) => trainer.specialization)
          .filter((specialization) => specialization.trim().length > 0)
      )
    );

    return uniqueValues.length > 0
      ? ["All", ...uniqueValues]
      : defaultSpecializationFilters;
  }, [trainers]);

  // Compute KPIs
  const totalTrainers = kpis.totalTrainers;
  const activeTrainers = kpis.activeTrainers;
  const onLeaveTrainers = kpis.onLeaveTrainers;
  const totalAssignedMembers = kpis.totalAssignedMembers;

  // Filter and sort trainers
  const filteredTrainers = useMemo(() => {
    let result = [...trainers];

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.email.toLowerCase().includes(q) ||
          t.phone.includes(q) ||
          t.specialization.toLowerCase().includes(q)
      );
    }

    // Status filter
    if (statusFilter !== "All") {
      result = result.filter((t) => t.status === statusFilter);
    }

    // Specialization filter
    if (specializationFilter !== "All") {
      result = result.filter((t) => t.specialization === specializationFilter);
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case "exp-desc":
          return b.experience - a.experience;
        case "exp-asc":
          return a.experience - b.experience;
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "name-desc":
          return b.name.localeCompare(a.name);
        case "rating-desc":
          return b.rating - a.rating;
        case "rating-asc":
          return a.rating - b.rating;
        default:
          return 0;
      }
    });

    return result;
  }, [searchQuery, statusFilter, specializationFilter, sortBy, trainers]);

  // Pagination
  const totalPages = Math.ceil(filteredTrainers.length / rowsPerPage);
  const paginatedTrainers = filteredTrainers.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const hasActiveFilters = statusFilter !== "All" || specializationFilter !== "All" || sortBy !== "exp-desc";

  const resetFilters = () => {
    setStatusFilter("All");
    setSpecializationFilter("All");
    setSortBy("exp-desc");
    setSearchQuery("");
    setCurrentPage(1);
  };

  const handleDeleteTrainer = async () => {
    if (!trainerToDelete) return;

    try {
      setIsDeleting(true);
      const response = await fetch(`/api/trainers/${trainerToDelete.id}`, {
        method: "DELETE",
      });

      const payload = (await response.json().catch(() => null)) as
        | { error?: string; message?: string }
        | null;

      if (!response.ok) {
        throw new Error(payload?.error || "Failed to delete trainer");
      }

      toast.success(payload?.message || "Trainer deleted successfully");
      setTrainerToDelete(null);
      await fetchTrainers();
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete trainer";
      toast.error(message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Toaster position="top-right" richColors closeButton />
      <div className="space-y-6">
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
            Trainers
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage all personal trainers and their schedules.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <motion.button
            whileHover={{ y: -2, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push("/trainers/add")}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 px-5 py-2.5 text-[13px] font-semibold text-white shadow-lg shadow-emerald-600/25 transition-all hover:from-emerald-500 hover:to-emerald-400 hover:shadow-emerald-500/30"
            type="button"
          >
            <Plus className="h-4 w-4" />
            Add Trainer
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
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-900/30">
                <Dumbbell className="h-3.5 w-3.5 text-emerald-400" />
              </div>
              <span className="text-[9px] font-medium uppercase tracking-[0.06em] text-slate-500">
                Total Trainers
              </span>
            </div>
            <p className="mt-2 text-[24px] font-semibold tabular-nums text-slate-100">
              {totalTrainers}
            </p>
            <p className="mt-0.5 text-[10px] text-slate-500">All registered trainers</p>
          </motion.div>
        </FadeUp>

        <FadeUp delay={0.1}>
          <motion.div
            whileHover={{ y: -3, transition: { duration: 0.15 } }}
            className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-[18px] transition-all hover:border-slate-600/60 hover:bg-slate-800/60"
          >
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-900/30">
                <UserCheck className="h-3.5 w-3.5 text-blue-400" />
              </div>
              <span className="text-[9px] font-medium uppercase tracking-[0.06em] text-slate-500">
                Active
              </span>
            </div>
            <p className="mt-2 text-[24px] font-semibold tabular-nums text-slate-100">
              {activeTrainers}
            </p>
            <p className="mt-0.5 text-[10px] text-slate-500">
              {totalTrainers === 0 ? 0 : Math.round((activeTrainers / totalTrainers) * 100)}% of total
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
                <Award className="h-3.5 w-3.5 text-amber-400" />
              </div>
              <span className="text-[9px] font-medium uppercase tracking-[0.06em] text-slate-500">
                On Leave
              </span>
            </div>
            <p className="mt-2 text-[24px] font-semibold tabular-nums text-slate-100">
              {onLeaveTrainers}
            </p>
            <p className="mt-0.5 text-[10px] text-slate-500">Currently unavailable</p>
          </motion.div>
        </FadeUp>

        <FadeUp delay={0.2}>
          <motion.div
            whileHover={{ y: -3, transition: { duration: 0.15 } }}
            className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-[18px] transition-all hover:border-slate-600/60 hover:bg-slate-800/60"
          >
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-900/30">
                <Users className="h-3.5 w-3.5 text-purple-400" />
              </div>
              <span className="text-[9px] font-medium uppercase tracking-[0.06em] text-slate-500">
                Total Members
              </span>
            </div>
            <p className="mt-2 text-[24px] font-semibold tabular-nums text-slate-100">
              {totalAssignedMembers}
            </p>
            <p className="mt-0.5 text-[10px] text-slate-500">Across all trainers</p>
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
                placeholder="Search by name, email, phone, or specialization..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full rounded-lg border border-slate-700 bg-slate-900/50 py-3 pl-10 pr-4 text-[13px] text-slate-200 outline-none placeholder:text-slate-500 transition-all focus:border-emerald-500 focus:bg-slate-900/80 focus:ring-1 focus:ring-emerald-500/30"
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-[12px] font-semibold transition-all ${
                showFilters || hasActiveFilters
                  ? "border-emerald-500/40 bg-emerald-900/20 text-emerald-400"
                  : "border-slate-700 bg-slate-900/50 text-slate-400 hover:border-slate-600 hover:text-slate-200"
              }`}
              type="button"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Filters
              {hasActiveFilters && (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[9px] font-bold text-white">
                  {
                    [statusFilter !== "All", specializationFilter !== "All", sortBy !== "exp-desc"].filter(Boolean).length
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
                          ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/20"
                          : "border border-slate-700 bg-slate-900/50 text-slate-400 hover:border-slate-600 hover:text-slate-200"
                      }`}
                      type="button"
                    >
                      {f.label}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Specialization Filter */}
              <div className="flex items-center gap-2">
                <label className="text-[11px] font-medium text-slate-500">Specialization:</label>
                <select
                  value={specializationFilter}
                  onChange={(e) => {
                    setSpecializationFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-1.5 text-[12px] font-medium text-slate-300 outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20"
                >
                  {specializationFilters.map((s) => (
                    <option key={s} value={s} className="bg-slate-800 text-slate-300">
                      {s}
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
                  className="rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-1.5 text-[12px] font-medium text-slate-300 outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20"
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
         MAIN CONTENT: TABLE + PAGINATION
         ═══════════════════════════════════════════ */}
      <div className="flex flex-col gap-6">
        <div className="flex-1 min-w-0 space-y-4">
          {loading ? (
            <FadeUp delay={0.15}>
              <div className="flex flex-col items-center justify-center rounded-xl border border-slate-700/60 bg-slate-800/40 px-6 py-20 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-700/40">
                  <Dumbbell className="h-6 w-6 animate-pulse text-slate-500" />
                </div>
                <p className="mt-4 text-base font-semibold text-slate-300">Loading Trainers...</p>
                <p className="mt-1.5 text-sm text-slate-500 max-w-sm">
                  Fetching your trainer data from the database.
                </p>
              </div>
            </FadeUp>
          ) : loadError ? (
            <FadeUp delay={0.15}>
              <div className="flex flex-col items-center justify-center rounded-xl border border-slate-700/60 bg-slate-800/40 px-6 py-20 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-950/20">
                  <X className="h-6 w-6 text-red-400" />
                </div>
                <p className="mt-4 text-base font-semibold text-slate-300">Unable To Load Trainers</p>
                <p className="mt-1.5 text-sm text-slate-500 max-w-sm">{loadError}</p>
                <motion.button
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={fetchTrainers}
                  className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 px-5 py-2.5 text-[13px] font-semibold text-white shadow-lg shadow-emerald-600/25 transition-all hover:from-emerald-500 hover:to-emerald-400"
                  type="button"
                >
                  Retry
                </motion.button>
              </div>
            </FadeUp>
          ) : paginatedTrainers.length === 0 ? (
            <FadeUp delay={0.15}>
              <div className="flex flex-col items-center justify-center rounded-xl border border-slate-700/60 bg-slate-800/40 px-6 py-20 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-700/40">
                  <Dumbbell className="h-6 w-6 text-slate-500" />
                </div>
                <p className="mt-4 text-base font-semibold text-slate-300">No Trainers Found</p>
                <p className="mt-1.5 text-sm text-slate-500 max-w-sm">
                  {searchQuery || hasActiveFilters
                    ? "Try adjusting your search terms or filters to find what you're looking for."
                    : "Get started by adding your first trainer to the system."}
                </p>
                {!searchQuery && !hasActiveFilters && (
                  <motion.button
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => router.push("/trainers/add")}
                    className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 px-5 py-2.5 text-[13px] font-semibold text-white shadow-lg shadow-emerald-600/25 transition-all hover:from-emerald-500 hover:to-emerald-400"
                    type="button"
                  >
                    <Plus className="h-4 w-4" />
                    Add Trainer
                  </motion.button>
                )}
              </div>
            </FadeUp>
          ) : (
            <>
              <FadeUp delay={0.15}>
                <TrainersTable
                  trainers={paginatedTrainers}
                  onDelete={(trainer) => setTrainerToDelete(trainer)}
                />
              </FadeUp>

              <FadeUp delay={0.2}>
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={filteredTrainers.length}
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
      </div>
      </div>

      {trainerToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 px-4">
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-[0_24px_64px_rgba(2,6,23,0.45)]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-trainer-title"
          >
            <h3 id="delete-trainer-title" className="text-lg font-semibold text-slate-100">
              Delete Trainer?
            </h3>
            <p className="mt-2 text-sm text-slate-400">This action cannot be undone.</p>

            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setTrainerToDelete(null)}
                disabled={isDeleting}
                className="inline-flex items-center rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-600 hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteTrainer}
                disabled={isDeleting}
                className="inline-flex items-center rounded-xl border border-red-800/70 bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-500 disabled:opacity-70"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}