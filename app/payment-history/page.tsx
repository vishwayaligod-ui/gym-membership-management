"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  DollarSign,
  TrendingUp,
  Calendar,
  Clock,
  Eye,
  Loader2,
  ChevronDown,
  Banknote,
} from "lucide-react";
import { motion } from "framer-motion";
import { Toaster, toast } from "sonner";
import { Pagination } from "../components/v4/Pagination";
import { FadeUp } from "../components/v4/MotionDiv";
import {
  type Payment,
  type PaymentStatus,
  type PaymentMode,
  type PaymentsSummary,
  paymentStatusColors,
  paymentModeLabels,
  paymentModeColors,
  paymentStatusFilters,
  paymentMethodFilters,
} from "./types";

export default function PaymentHistoryPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | "All">("All");
  const [methodFilter, setMethodFilter] = useState<PaymentMode | "All">("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [summary, setSummary] = useState<PaymentsSummary>({
    todayRevenue: 0,
    weeklyRevenue: 0,
    monthlyRevenue: 0,
    pendingCount: 0,
    pendingAmount: 0,
  });
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  const fetchPayments = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.set("search", searchQuery);
      if (statusFilter !== "All") params.set("status", statusFilter);
      if (methodFilter !== "All") params.set("method", methodFilter);
      params.set("page", String(currentPage));
      params.set("limit", String(rowsPerPage));

      const response = await fetch(`/api/payments?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch payments");
      const data = await response.json();
      setPayments(data.payments);
      setSummary(data.summary);
      setTotalPages(data.pagination.totalPages);
      setTotalItems(data.pagination.total);
    } catch (error) {
      console.error("Failed to fetch payments:", error);
      toast.error("Failed to load payments");
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, statusFilter, methodFilter, currentPage, rowsPerPage]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  // Reset to page 1 when filters change
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (value: PaymentStatus | "All") => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const handleMethodFilterChange = (value: PaymentMode | "All") => {
    setMethodFilter(value);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleRowsPerPageChange = (rows: number) => {
    setRowsPerPage(rows);
    setCurrentPage(1);
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString("en-IN")}`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const hasActiveFilters = statusFilter !== "All" || methodFilter !== "All" || searchQuery !== "";

  const resetFilters = () => {
    setStatusFilter("All");
    setMethodFilter("All");
    setSearchQuery("");
    setCurrentPage(1);
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
            Payment History
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Track all payments across the gym.
          </p>
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
                <DollarSign className="h-3.5 w-3.5 text-emerald-400" />
              </div>
              <span className="text-[9px] font-medium uppercase tracking-[0.06em] text-slate-500">
                Today's Revenue
              </span>
            </div>
            <p className="mt-2 text-[24px] font-semibold tabular-nums text-slate-100">
              {isLoading ? "..." : formatCurrency(summary.todayRevenue)}
            </p>
            <p className="mt-0.5 text-[10px] text-slate-500">Payments received today</p>
          </motion.div>
        </FadeUp>

        <FadeUp delay={0.1}>
          <motion.div
            whileHover={{ y: -3, transition: { duration: 0.15 } }}
            className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-[18px] transition-all hover:border-slate-600/60 hover:bg-slate-800/60"
          >
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-900/30">
                <TrendingUp className="h-3.5 w-3.5 text-blue-400" />
              </div>
              <span className="text-[9px] font-medium uppercase tracking-[0.06em] text-slate-500">
                This Week
              </span>
            </div>
            <p className="mt-2 text-[24px] font-semibold tabular-nums text-slate-100">
              {isLoading ? "..." : formatCurrency(summary.weeklyRevenue)}
            </p>
            <p className="mt-0.5 text-[10px] text-slate-500">Weekly revenue</p>
          </motion.div>
        </FadeUp>

        <FadeUp delay={0.15}>
          <motion.div
            whileHover={{ y: -3, transition: { duration: 0.15 } }}
            className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-[18px] transition-all hover:border-slate-600/60 hover:bg-slate-800/60"
          >
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-900/30">
                <Calendar className="h-3.5 w-3.5 text-purple-400" />
              </div>
              <span className="text-[9px] font-medium uppercase tracking-[0.06em] text-slate-500">
                This Month
              </span>
            </div>
            <p className="mt-2 text-[24px] font-semibold tabular-nums text-slate-100">
              {isLoading ? "..." : formatCurrency(summary.monthlyRevenue)}
            </p>
            <p className="mt-0.5 text-[10px] text-slate-500">Monthly revenue</p>
          </motion.div>
        </FadeUp>

        <FadeUp delay={0.2}>
          <motion.div
            whileHover={{ y: -3, transition: { duration: 0.15 } }}
            className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-[18px] transition-all hover:border-slate-600/60 hover:bg-slate-800/60"
          >
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-900/30">
                <Clock className="h-3.5 w-3.5 text-amber-400" />
              </div>
              <span className="text-[9px] font-medium uppercase tracking-[0.06em] text-slate-500">
                Pending
              </span>
            </div>
            <p className="mt-2 text-[24px] font-semibold tabular-nums text-slate-100">
              {isLoading ? "..." : `${summary.pendingCount} (${formatCurrency(summary.pendingAmount)})`}
            </p>
            <p className="mt-0.5 text-[10px] text-slate-500">Pending payments</p>
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
                placeholder="Search by member name, phone, or transaction ID..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900/50 py-3 pl-10 pr-4 text-[13px] text-slate-200 outline-none placeholder:text-slate-500 transition-all focus:border-blue-500 focus:bg-slate-900/80 focus:ring-1 focus:ring-blue-500/30"
              />
            </div>
          </div>

          {/* Filter Chips */}
          <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-slate-700/40 pt-4">
            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <label className="text-[11px] font-medium text-slate-500">Status:</label>
              <div className="flex flex-wrap gap-1.5">
                {paymentStatusFilters.map((f) => (
                  <motion.button
                    key={f.value}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => handleStatusFilterChange(f.value)}
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

            {/* Method Filter */}
            <div className="flex items-center gap-2">
              <label className="text-[11px] font-medium text-slate-500">Method:</label>
              <div className="flex flex-wrap gap-1.5">
                {paymentMethodFilters.map((f) => (
                  <motion.button
                    key={f.value}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => handleMethodFilterChange(f.value)}
                    className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-all ${
                      methodFilter === f.value
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

            {/* Reset */}
            {hasActiveFilters && (
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={resetFilters}
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-900/40 bg-red-950/20 px-3 py-1.5 text-[11px] font-semibold text-red-400 transition-all hover:bg-red-950/30"
                type="button"
              >
                Reset Filters
              </motion.button>
            )}
          </div>
        </div>
      </FadeUp>

      {/* ═══════════════════════════════════════════
         MAIN CONTENT: TABLE
         ═══════════════════════════════════════════ */}
      <div className="flex-1 min-w-0 space-y-4">
        {isLoading ? (
          <FadeUp delay={0.15}>
            <div className="flex flex-col items-center justify-center rounded-xl border border-slate-700/60 bg-slate-800/40 px-6 py-20 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
              <p className="mt-4 text-base font-semibold text-slate-300">Loading payments...</p>
            </div>
          </FadeUp>
        ) : payments.length === 0 ? (
          <FadeUp delay={0.15}>
            <div className="flex flex-col items-center justify-center rounded-xl border border-slate-700/60 bg-slate-800/40 px-6 py-20 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-700/40">
                <Banknote className="h-6 w-6 text-slate-500" />
              </div>
              <p className="mt-4 text-base font-semibold text-slate-300">No Payments Found</p>
              <p className="mt-1.5 text-sm text-slate-500 max-w-sm">
                {searchQuery || hasActiveFilters
                  ? "Try adjusting your search terms or filters to find what you're looking for."
                  : "No payments have been recorded yet."}
              </p>
            </div>
          </FadeUp>
        ) : (
          <>
            <FadeUp delay={0.15}>
              <div className="overflow-x-auto rounded-xl border border-slate-700/60 bg-slate-800/40">
                {/* Table Header */}
                <div className="hidden md:grid md:grid-cols-[56px_minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,0.9fr)_minmax(0,1fr)_minmax(0,1.1fr)_minmax(0,1.4fr)_minmax(0,1.2fr)_60px_40px] gap-3 border-b border-slate-700/60 px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500">
                  <div />
                  <div>Member</div>
                  <div>Plan</div>
                  <div>Amount</div>
                  <div>Method</div>
                  <div>Status</div>
                  <div>Transaction ID</div>
                  <div>Date</div>
                  <div />
                </div>

                {/* Table Rows */}
                <div className="divide-y divide-slate-700/40">
                  {payments.map((payment, idx) => {
                    const statusColors = paymentStatusColors[payment.paymentStatus];
                    const modeColor = paymentModeColors[payment.paymentMode];

                    return (
                      <motion.div
                        key={payment.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: idx * 0.03 }}
                        onMouseEnter={() => setHoveredRow(payment.id)}
                        onMouseLeave={() => setHoveredRow(null)}
                        onClick={() => router.push(`/payment-history/${payment.id}`)}
                        className={`grid grid-cols-1 md:grid-cols-[56px_minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,0.9fr)_minmax(0,1fr)_minmax(0,1.1fr)_minmax(0,1.4fr)_minmax(0,1.2fr)_60px_40px] gap-3 px-5 py-4 transition-all duration-200 cursor-pointer ${
                          hoveredRow === payment.id ? "bg-slate-700/40 shadow-[0_2px_8px_rgba(0,0,0,0.15)]" : "bg-transparent"
                        }`}
                      >
                        {/* Avatar */}
                        <div className="hidden md:flex items-center">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-[11px] font-bold text-white shadow-sm shadow-blue-900/30">
                            {payment.avatar}
                          </div>
                        </div>

                        {/* Mobile Row */}
                        <div className="flex items-center gap-3 md:hidden">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-[11px] font-bold text-white shadow-sm shadow-blue-900/30">
                            {payment.avatar}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-slate-200 truncate">{payment.memberName}</p>
                              <span className={`inline-flex items-center gap-1 rounded-full ${statusColors.bg} px-2 py-0.5 text-[10px] font-bold ${statusColors.text} whitespace-nowrap`}>
                                <span className={`h-1.5 w-1.5 rounded-full ${statusColors.dot}`} />
                                {payment.paymentStatus}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5">{payment.memberPhone}</p>
                            <div className="flex items-center gap-2 mt-1.5">
                              <span className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap ${modeColor}`}>
                                {paymentModeLabels[payment.paymentMode]}
                              </span>
                              <span className="text-[10px] text-slate-500 whitespace-nowrap">
                                {formatCurrency(payment.amount)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Desktop: Member column */}
                        <div className="hidden md:flex items-center min-w-0">
                          <div className="min-w-0">
                            <p className="text-[13px] font-semibold text-slate-200 truncate">{payment.memberName}</p>
                            <p className="text-[11px] text-slate-500 truncate">{payment.memberPhone}</p>
                          </div>
                        </div>

                        {/* Desktop: Plan */}
                        <div className="hidden md:flex items-center min-w-0">
                          <span className="text-[12px] text-slate-400 truncate" title={payment.plan}>{payment.plan}</span>
                        </div>

                        {/* Desktop: Amount */}
                        <div className="hidden md:flex items-center">
                          <span className="text-[13px] font-semibold text-slate-200 whitespace-nowrap">
                            {formatCurrency(payment.amount)}
                          </span>
                        </div>

                        {/* Desktop: Payment Mode */}
                        <div className="hidden md:flex items-center">
                          <span className={`rounded-md border px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap ${modeColor}`}>
                            {paymentModeLabels[payment.paymentMode]}
                          </span>
                        </div>

                        {/* Desktop: Payment Status */}
                        <div className="hidden md:flex items-center">
                          <span className={`inline-flex items-center gap-1.5 rounded-full ${statusColors.bg} px-[10px] py-1 text-[11px] font-bold ${statusColors.text} whitespace-nowrap`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${statusColors.dot}`} />
                            {payment.paymentStatus}
                          </span>
                        </div>

                        {/* Desktop: Transaction ID */}
                        <div className="hidden md:flex items-center">
                          <span className="text-[12px] text-slate-400 truncate max-w-[130px]" title={payment.transactionId || ""}>
                            {payment.transactionId || "—"}
                          </span>
                        </div>

                        {/* Desktop: Date */}
                        <div className="hidden md:flex items-center">
                          <span className="text-[12px] text-slate-400 whitespace-nowrap" title={formatDateTime(payment.paymentDate)}>
                            {formatDate(payment.paymentDate)}
                          </span>
                        </div>

                        {/* Desktop: Actions */}
                        <div className="hidden md:flex items-center gap-1">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/payment-history/${payment.id}`);
                            }}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-all duration-200 ease-out hover:bg-blue-900/30 hover:text-blue-400"
                            title="View Details"
                            type="button"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </motion.button>
                        </div>

                        {/* Chevron for mobile */}
                        <div className="hidden md:flex items-center justify-end">
                          <ChevronDown className={`h-3.5 w-3.5 text-slate-600 transition-transform duration-200 ${
                            hoveredRow === payment.id ? "rotate-[-90deg]" : ""
                          }`} />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </FadeUp>

            <FadeUp delay={0.2}>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                rowsPerPage={rowsPerPage}
                onPageChange={handlePageChange}
                onRowsPerPageChange={handleRowsPerPageChange}
              />
            </FadeUp>
          </>
        )}
      </div>
    </div>
  );
}