"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  Dumbbell,
  CheckCircle2,
  Clock,
  IndianRupee,
  SlidersHorizontal,
  X,
  Save,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Toaster, toast } from "sonner";
import { type MembershipPlan, type PlanStatus, transformPlan, type ApiPlan } from "./types";
import { PlansTable } from "@/components/membership-plans/PlansTable";
import { Pagination } from "../components/v4/Pagination";
import { FadeUp } from "../components/v4/MotionDiv";

const statusFilters: Array<{ label: string; value: PlanStatus | "All" }> = [
  { label: "All", value: "All" },
  { label: "Active", value: "Active" },
  { label: "Inactive", value: "Inactive" },
];

const sortOptions = [
  { label: "Name A-Z", value: "name-asc" },
  { label: "Name Z-A", value: "name-desc" },
  { label: "Price (Low)", value: "price-asc" },
  { label: "Price (High)", value: "price-desc" },
  { label: "Duration (Short)", value: "duration-asc" },
  { label: "Duration (Long)", value: "duration-desc" },
];

type ModalMode = "add" | "edit" | null;

const emptyForm = {
  name: "",
  duration: "",
  durationInDays: "",
  joiningFee: "",
  membershipFee: "",
  freezeDays: "0",
  description: "",
  status: "Active" as PlanStatus,
};

export default function MembershipPlansPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<PlanStatus | "All">("All");
  const [sortBy, setSortBy] = useState("name-asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [showFilters, setShowFilters] = useState(false);

  // Modal state
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editingPlan, setEditingPlan] = useState<MembershipPlan | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<MembershipPlan | null>(null);

  // Fetch plans from API
  const fetchPlans = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/membership-plans");
      if (!res.ok) throw new Error("Failed to fetch plans");
      const data: ApiPlan[] = await res.json();
      setPlans(data.map(transformPlan));
    } catch (err) {
      console.error("Failed to fetch plans:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  // Compute KPIs
  const totalPlans = plans.length;
  const activePlans = plans.filter((p) => p.status === "Active").length;
  const avgDuration = plans.length > 0
    ? Math.round(plans.reduce((sum, p) => sum + p.durationInDays, 0) / plans.length)
    : 0;
  const avgPrice = plans.length > 0
    ? Math.round(plans.reduce((sum, p) => sum + p.membershipFee, 0) / plans.length)
    : 0;

  // Filter and sort plans
  const filteredPlans = useMemo(() => {
    let result = [...plans];

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.duration.toLowerCase().includes(q)
      );
    }

    // Status filter
    if (statusFilter !== "All") {
      result = result.filter((p) => p.status === statusFilter);
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "name-desc":
          return b.name.localeCompare(a.name);
        case "price-asc":
          return a.membershipFee - b.membershipFee;
        case "price-desc":
          return b.membershipFee - a.membershipFee;
        case "duration-asc":
          return a.durationInDays - b.durationInDays;
        case "duration-desc":
          return b.durationInDays - a.durationInDays;
        default:
          return 0;
      }
    });

    return result;
  }, [plans, searchQuery, statusFilter, sortBy]);

  // Pagination
  const totalPages = Math.ceil(filteredPlans.length / rowsPerPage);
  const paginatedPlans = filteredPlans.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const hasActiveFilters = statusFilter !== "All" || sortBy !== "name-asc";

  const resetFilters = () => {
    setStatusFilter("All");
    setSortBy("name-asc");
    setSearchQuery("");
    setCurrentPage(1);
  };

  // ─── Modal helpers ───────────────────────────────────────

  const openAddModal = () => {
    setEditingPlan(null);
    setFormData(emptyForm);
    setFormErrors({});
    setModalMode("add");
  };

  const openEditModal = (plan: MembershipPlan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      duration: plan.duration,
      durationInDays: String(plan.durationInDays),
      joiningFee: String(plan.joiningFee),
      membershipFee: String(plan.membershipFee),
      freezeDays: String(plan.freezeDays),
      description: plan.description,
      status: plan.status,
    });
    setFormErrors({});
    setModalMode("edit");
  };

  const closeModal = () => {
    setModalMode(null);
    setEditingPlan(null);
    setFormData(emptyForm);
    setFormErrors({});
  };

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = "Plan name is required";
    }

    const days = Number(formData.durationInDays);
    if (!formData.durationInDays || !Number.isInteger(days) || days <= 0) {
      errors.durationInDays = "Duration must be a positive number";
    }

    const fee = Number(formData.membershipFee);
    if (!formData.membershipFee || isNaN(fee) || fee < 0) {
      errors.membershipFee = "Membership fee must be >= 0";
    }

    const joining = Number(formData.joiningFee) || 0;
    if (joining < 0) {
      errors.joiningFee = "Joining fee must be >= 0";
    }

    const freeze = Number(formData.freezeDays) || 0;
    if (freeze < 0) {
      errors.freezeDays = "Freeze days must be >= 0";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);

    const days = Number(formData.durationInDays);
    const fee = Number(formData.membershipFee);
    const joining = Number(formData.joiningFee) || 0;
    const freeze = Number(formData.freezeDays) || 0;

    try {
      if (modalMode === "add") {
        const res = await fetch("/api/membership-plans", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name.trim(),
            durationInDays: days,
            price: fee,
            joiningFee: joining,
            freezeDays: freeze,
            description: formData.description.trim() || null,
            isActive: formData.status === "Active",
          }),
        });

        if (!res.ok) {
          const err = await res.json();
          console.error("Failed to create plan:", err);
          return;
        }
      } else if (modalMode === "edit" && editingPlan) {
        const res = await fetch(`/api/membership-plans/${editingPlan.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name.trim(),
            durationInDays: days,
            price: fee,
            joiningFee: joining,
            freezeDays: freeze,
            description: formData.description.trim() || null,
            isActive: formData.status === "Active",
          }),
        });

        if (!res.ok) {
          const err = await res.json();
          console.error("Failed to update plan:", err);
          return;
        }
      }

      await fetchPlans();
      closeModal();
    } catch (err) {
      console.error("Failed to save plan:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDuplicate = async (plan: MembershipPlan) => {
    try {
      const res = await fetch("/api/membership-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${plan.name} (Copy)`,
          durationInDays: plan.durationInDays,
          price: plan.membershipFee,
          joiningFee: plan.joiningFee,
          freezeDays: plan.freezeDays,
          description: plan.description || null,
          isActive: plan.status === "Active",
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        console.error("Failed to duplicate plan:", err);
        return;
      }

      await fetchPlans();
    } catch (err) {
      console.error("Failed to duplicate plan:", err);
    }
  };

  const handleToggleStatus = async (plan: MembershipPlan) => {
    try {
      const res = await fetch(`/api/membership-plans/${plan.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isActive: plan.status === "Inactive",
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        console.error("Failed to toggle status:", err);
        return;
      }

      await fetchPlans();
    } catch (err) {
      console.error("Failed to toggle status:", err);
    }
  };

  const handleDelete = (plan: MembershipPlan) => {
    setDeleteTarget(plan);
  };

  const handleEditRoute = (plan: MembershipPlan) => {
    router.push(`/membership-plans/${plan.id}/edit`);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      const res = await fetch(`/api/membership-plans/${deleteTarget.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const err = await res.json();
        const message =
          typeof err?.error === "string" && err.error.length > 0
            ? err.error
            : "Failed to delete plan";
        toast.error(message);
        console.error("Failed to delete plan:", err);
        return;
      }

      toast.success(`Plan "${deleteTarget.name}" deleted successfully`);
      setDeleteTarget(null);
      await fetchPlans();
    } catch (err) {
      toast.error("Failed to delete plan. Please try again.");
      console.error("Failed to delete plan:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
      </div>
    );
  }

  return (
    <div className="membership-plans-page flex min-w-0 flex-col space-y-6">
      <Toaster position="top-right" richColors closeButton />

      {/* ═══════════════════════════════════════════
         PAGE HEADER
         ═══════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex w-full items-center justify-between gap-4 max-lg:flex-wrap"
      >
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-100">
            Membership Plans
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage gym membership plans, pricing and durations.
          </p>
        </div>
        <div className="flex w-full flex-none items-center justify-end sm:w-auto">
          <motion.button
            whileHover={{ y: -2, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={openAddModal}
            className="inline-flex w-full max-w-full flex-none items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 px-5 py-2.5 text-[13px] font-semibold text-white shadow-lg shadow-emerald-600/25 transition-all hover:from-emerald-500 hover:to-emerald-400 hover:shadow-emerald-500/30 sm:w-auto"
            type="button"
          >
            <Plus className="h-4 w-4" />
            Add Plan
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
                Total Plans
              </span>
            </div>
            <p className="mt-2 text-[24px] font-semibold tabular-nums text-slate-100">
              {totalPlans}
            </p>
            <p className="mt-0.5 text-[10px] text-slate-500">All membership plans</p>
          </motion.div>
        </FadeUp>

        <FadeUp delay={0.1}>
          <motion.div
            whileHover={{ y: -3, transition: { duration: 0.15 } }}
            className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-[18px] transition-all hover:border-slate-600/60 hover:bg-slate-800/60"
          >
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-900/30">
                <CheckCircle2 className="h-3.5 w-3.5 text-blue-400" />
              </div>
              <span className="text-[9px] font-medium uppercase tracking-[0.06em] text-slate-500">
                Active Plans
              </span>
            </div>
            <p className="mt-2 text-[24px] font-semibold tabular-nums text-slate-100">
              {activePlans}
            </p>
            <p className="mt-0.5 text-[10px] text-slate-500">
              {totalPlans > 0 ? Math.round((activePlans / totalPlans) * 100) : 0}% of total
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
                <Clock className="h-3.5 w-3.5 text-amber-400" />
              </div>
              <span className="text-[9px] font-medium uppercase tracking-[0.06em] text-slate-500">
                Avg. Duration
              </span>
            </div>
            <p className="mt-2 text-[24px] font-semibold tabular-nums text-slate-100">
              {avgDuration} days
            </p>
            <p className="mt-0.5 text-[10px] text-slate-500">Across all plans</p>
          </motion.div>
        </FadeUp>

        <FadeUp delay={0.2}>
          <motion.div
            whileHover={{ y: -3, transition: { duration: 0.15 } }}
            className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-[18px] transition-all hover:border-slate-600/60 hover:bg-slate-800/60"
          >
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-900/30">
                <IndianRupee className="h-3.5 w-3.5 text-purple-400" />
              </div>
              <span className="text-[9px] font-medium uppercase tracking-[0.06em] text-slate-500">
                Avg. Price
              </span>
            </div>
            <p className="mt-2 text-[24px] font-semibold tabular-nums text-slate-100">
              ₹{avgPrice.toLocaleString("en-IN")}
            </p>
            <p className="mt-0.5 text-[10px] text-slate-500">Across all plans</p>
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
                placeholder="Search by plan name..."
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
                  {[statusFilter !== "All", sortBy !== "name-asc"].filter(Boolean).length}
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
          {paginatedPlans.length === 0 ? (
            <FadeUp delay={0.15}>
              <div className="flex flex-col items-center justify-center rounded-xl border border-slate-700/60 bg-slate-800/40 px-6 py-20 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-700/40">
                  <Dumbbell className="h-6 w-6 text-slate-500" />
                </div>
                <p className="mt-4 text-base font-semibold text-slate-300">No Plans Found</p>
                <p className="mt-1.5 text-sm text-slate-500 max-w-sm">
                  {searchQuery || hasActiveFilters
                    ? "Try adjusting your search terms or filters to find what you're looking for."
                    : "Get started by creating your first membership plan."}
                </p>
                {!searchQuery && !hasActiveFilters && (
                  <motion.button
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={openAddModal}
                    className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 px-5 py-2.5 text-[13px] font-semibold text-white shadow-lg shadow-emerald-600/25 transition-all hover:from-emerald-500 hover:to-emerald-400"
                    type="button"
                  >
                    <Plus className="h-4 w-4" />
                    Add Plan
                  </motion.button>
                )}
              </div>
            </FadeUp>
          ) : (
            <>
              <FadeUp delay={0.15}>
                <div className="membership-plans-table-shell min-w-0">
                  <PlansTable
                    plans={paginatedPlans}
                    onEdit={handleEditRoute}
                    onDuplicate={handleDuplicate}
                    onToggleStatus={handleToggleStatus}
                    onDelete={handleDelete}
                  />
                </div>
              </FadeUp>

              <FadeUp delay={0.2}>
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={filteredPlans.length}
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

      {/* ═══════════════════════════════════════════
         ADD / EDIT MODAL
         ═══════════════════════════════════════════ */}
      <AnimatePresence>
        {modalMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={closeModal}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl rounded-2xl border border-slate-700/60 bg-slate-800 shadow-2xl shadow-black/40"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-700/60 px-6 py-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-100">
                    {modalMode === "add" ? "Add Plan" : "Edit Plan"}
                  </h2>
                  <p className="text-[12px] text-slate-500 mt-0.5">
                    {modalMode === "add"
                      ? "Create a new membership plan."
                      : "Update plan details and pricing."}
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={closeModal}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700 bg-slate-800/50 text-slate-400 transition-colors hover:border-slate-600 hover:text-slate-200"
                  type="button"
                >
                  <X className="h-4 w-4" />
                </motion.button>
              </div>

              {/* Modal Body */}
              <div className="p-6">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  {/* Plan Name */}
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-semibold uppercase tracking-[0.06em] text-slate-400">
                      Plan Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => updateField("name", e.target.value)}
                      placeholder="e.g. Platinum Monthly"
                      className={`w-full rounded-lg border bg-slate-900/50 px-4 py-3 text-[13px] text-slate-200 outline-none placeholder:text-slate-500 transition-all focus:bg-slate-900/80 focus:ring-1 ${
                        formErrors.name
                          ? "border-red-500 focus:border-red-500 focus:ring-red-500/30"
                          : "border-slate-700 focus:border-emerald-500 focus:ring-emerald-500/30"
                      }`}
                    />
                    {formErrors.name && (
                      <p className="text-[11px] text-red-400">{formErrors.name}</p>
                    )}
                  </div>

                  {/* Duration (Days) */}
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-semibold uppercase tracking-[0.06em] text-slate-400">
                      Duration (Days) <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={formData.durationInDays}
                      onChange={(e) => updateField("durationInDays", e.target.value)}
                      placeholder="e.g. 30"
                      className={`w-full rounded-lg border bg-slate-900/50 px-4 py-3 text-[13px] text-slate-200 outline-none placeholder:text-slate-500 transition-all focus:bg-slate-900/80 focus:ring-1 ${
                        formErrors.durationInDays
                          ? "border-red-500 focus:border-red-500 focus:ring-red-500/30"
                          : "border-slate-700 focus:border-emerald-500 focus:ring-emerald-500/30"
                      }`}
                    />
                    {formErrors.durationInDays && (
                      <p className="text-[11px] text-red-400">{formErrors.durationInDays}</p>
                    )}
                  </div>

                  {/* Joining Fee */}
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-semibold uppercase tracking-[0.06em] text-slate-400">
                      Joining Fee (₹)
                    </label>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={formData.joiningFee}
                      onChange={(e) => updateField("joiningFee", e.target.value)}
                      placeholder="e.g. 500"
                      className={`w-full rounded-lg border bg-slate-900/50 px-4 py-3 text-[13px] text-slate-200 outline-none placeholder:text-slate-500 transition-all focus:bg-slate-900/80 focus:ring-1 ${
                        formErrors.joiningFee
                          ? "border-red-500 focus:border-red-500 focus:ring-red-500/30"
                          : "border-slate-700 focus:border-emerald-500 focus:ring-emerald-500/30"
                      }`}
                    />
                    {formErrors.joiningFee && (
                      <p className="text-[11px] text-red-400">{formErrors.joiningFee}</p>
                    )}
                  </div>

                  {/* Membership Fee */}
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-semibold uppercase tracking-[0.06em] text-slate-400">
                      Membership Fee (₹) <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={formData.membershipFee}
                      onChange={(e) => updateField("membershipFee", e.target.value)}
                      placeholder="e.g. 5000"
                      className={`w-full rounded-lg border bg-slate-900/50 px-4 py-3 text-[13px] text-slate-200 outline-none placeholder:text-slate-500 transition-all focus:bg-slate-900/80 focus:ring-1 ${
                        formErrors.membershipFee
                          ? "border-red-500 focus:border-red-500 focus:ring-red-500/30"
                          : "border-slate-700 focus:border-emerald-500 focus:ring-emerald-500/30"
                      }`}
                    />
                    {formErrors.membershipFee && (
                      <p className="text-[11px] text-red-400">{formErrors.membershipFee}</p>
                    )}
                  </div>

                  {/* Freeze Days */}
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-semibold uppercase tracking-[0.06em] text-slate-400">
                      Freeze Days
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={formData.freezeDays}
                      onChange={(e) => updateField("freezeDays", e.target.value)}
                      placeholder="e.g. 7"
                      className={`w-full rounded-lg border bg-slate-900/50 px-4 py-3 text-[13px] text-slate-200 outline-none placeholder:text-slate-500 transition-all focus:bg-slate-900/80 focus:ring-1 ${
                        formErrors.freezeDays
                          ? "border-red-500 focus:border-red-500 focus:ring-red-500/30"
                          : "border-slate-700 focus:border-emerald-500 focus:ring-emerald-500/30"
                      }`}
                    />
                    {formErrors.freezeDays && (
                      <p className="text-[11px] text-red-400">{formErrors.freezeDays}</p>
                    )}
                  </div>

                  {/* Status */}
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-semibold uppercase tracking-[0.06em] text-slate-400">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => updateField("status", e.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-900/50 px-4 py-3 text-[13px] text-slate-200 outline-none transition-all focus:border-emerald-500 focus:bg-slate-900/80 focus:ring-1 focus:ring-emerald-500/30"
                    >
                      <option value="Active" className="bg-slate-800 text-slate-200">Active</option>
                      <option value="Inactive" className="bg-slate-800 text-slate-200">Inactive</option>
                    </select>
                  </div>

                  {/* Description */}
                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-[12px] font-semibold uppercase tracking-[0.06em] text-slate-400">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => updateField("description", e.target.value)}
                      placeholder="Describe what this plan includes, benefits, and any special features..."
                      rows={3}
                      className="w-full rounded-lg border border-slate-700 bg-slate-900/50 px-4 py-3 text-[13px] text-slate-200 outline-none placeholder:text-slate-500 transition-all focus:border-emerald-500 focus:bg-slate-900/80 focus:ring-1 focus:ring-emerald-500/30 resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 border-t border-slate-700/60 px-6 py-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={closeModal}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/50 px-5 py-2.5 text-[13px] font-semibold text-slate-400 transition-all hover:border-slate-600 hover:text-slate-200"
                  type="button"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ y: -2, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSave}
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 px-5 py-2.5 text-[13px] font-semibold text-white shadow-lg shadow-emerald-600/25 transition-all hover:from-emerald-500 hover:to-emerald-400 hover:shadow-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-60"
                  type="button"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Save Plan
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════
         DELETE CONFIRMATION MODAL
         ═══════════════════════════════════════════ */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setDeleteTarget(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl border border-slate-700/60 bg-slate-800 shadow-2xl shadow-black/40 p-6"
            >
              <div className="flex flex-col items-center text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-900/30 mb-4">
                  <AlertTriangle className="h-7 w-7 text-red-400" />
                </div>
                <h2 className="text-lg font-bold text-slate-100">Delete Plan</h2>
                <p className="mt-2 text-sm text-slate-500 max-w-sm">
                  Are you sure you want to delete <span className="font-semibold text-slate-300">{deleteTarget.name}</span>? This action cannot be undone.
                </p>
              </div>
              <div className="mt-6 flex items-center justify-center gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setDeleteTarget(null)}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/50 px-5 py-2.5 text-[13px] font-semibold text-slate-400 transition-all hover:border-slate-600 hover:text-slate-200"
                  type="button"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ y: -2, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={confirmDelete}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-500 px-5 py-2.5 text-[13px] font-semibold text-white shadow-lg shadow-red-600/25 transition-all hover:from-red-500 hover:to-red-400 hover:shadow-red-500/30"
                  type="button"
                >
                  <TrashIcon className="h-4 w-4" />
                  Delete Plan
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .membership-plans-page {
          width: 100%;
          min-width: 0;
          overflow-x: hidden;
        }

        .membership-plans-table-shell {
          width: 100%;
          min-width: 0;
        }

        @media (min-width: 768px) {
          .membership-plans-table-shell > div > div:first-child,
          .membership-plans-table-shell > div > div:nth-child(2) > div {
            grid-template-columns:
              minmax(0, 1.6fr)
              minmax(70px, 0.72fr)
              minmax(74px, 0.76fr)
              minmax(82px, 0.85fr)
              minmax(68px, 0.7fr)
              minmax(70px, 0.74fr)
              minmax(64px, 0.68fr)
              minmax(176px, 1.15fr) !important;
            column-gap: 0.5rem !important;
            padding-left: 1rem !important;
            padding-right: 1rem !important;
          }

          .membership-plans-table-shell > div > div:nth-child(2) > div > div:last-child {
            min-width: 0;
            justify-content: flex-end;
          }

          .membership-plans-table-shell > div > div:nth-child(2) > div > div:last-child > div {
            display: flex;
            width: 100%;
            min-width: 0;
            max-width: 176px;
            margin-left: auto;
            align-items: stretch;
            justify-content: flex-end;
            gap: 0.5rem;
          }

          .membership-plans-table-shell > div > div:nth-child(2) > div > div:last-child button {
            min-width: 0;
            justify-content: center;
            white-space: nowrap;
          }
        }

        @media (min-width: 768px) and (max-width: 1380px) {
          .membership-plans-table-shell > div > div:nth-child(2) > div > div:last-child > div {
            flex-direction: column;
          }
        }

        @media (min-width: 1381px) {
          .membership-plans-table-shell > div > div:nth-child(2) > div > div:last-child > div {
            flex-direction: row;
            flex-wrap: nowrap;
          }
        }

        @media (min-width: 1600px) {
          .membership-plans-table-shell > div > div:first-child,
          .membership-plans-table-shell > div > div:nth-child(2) > div {
            grid-template-columns:
              minmax(0, 1.7fr)
              minmax(78px, 0.78fr)
              minmax(82px, 0.82fr)
              minmax(92px, 0.92fr)
              minmax(74px, 0.74fr)
              minmax(78px, 0.8fr)
              minmax(70px, 0.7fr)
              minmax(188px, 1.18fr) !important;
          }

          .membership-plans-table-shell > div > div:nth-child(2) > div > div:last-child > div {
            max-width: 188px;
          }
        }
      `}</style>
    </div>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}