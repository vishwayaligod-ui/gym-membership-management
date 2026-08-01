"use client";

import { motion } from "framer-motion";
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  CreditCard,
  IndianRupee,
  Loader2,
  UserRound,
  Hash,
  Tag,
} from "lucide-react";
import React, { useState, useEffect } from "react";
import { Toaster, toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  paymentStatusColors,
  paymentModeLabels,
  type PaymentStatus,
  type PaymentMode,
} from "../types";

type PaymentData = {
  id: string;
  memberId: string;
  membershipId: string;
  memberName: string;
  memberPhone: string;
  plan: string;
  planId: string;
  planDurationInDays: number;
  amount: number;
  paymentMode: string;
  paymentStatus: string;
  transactionId: string | null;
  paymentDate: string;
  remarks: string | null;
  avatar: string;
  membershipStartDate: string | null;
  membershipEndDate: string | null;
  membershipAmount: number | null;
  membershipDiscount: number | null;
  membershipFinalAmount: number | null;
  createdAt: string;
  updatedAt: string;
};

export default function PaymentDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [payment, setPayment] = useState<PaymentData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPayment() {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/payments/${id}`);
        if (!response.ok) {
          if (response.status === 404) {
            setError("Payment not found");
          } else {
            throw new Error("Failed to fetch payment");
          }
          return;
        }
        const data = await response.json();
        setPayment(data.payment);
      } catch (error) {
        console.error("Failed to fetch payment:", error);
        setError("Failed to load payment data");
        toast.error("Failed to load payment data");
      } finally {
        setIsLoading(false);
      }
    }
    fetchPayment();
  }, [id]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-2xl border border-slate-800 bg-slate-900 px-4 py-8 shadow-[0_12px_36px_rgba(2,6,23,0.28)]">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
          <p className="mt-3 text-sm font-medium text-slate-300">Loading payment data...</p>
        </div>
      </div>
    );
  }

  if (error || !payment) {
    return (
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex min-h-[40vh] flex-col items-center justify-center rounded-2xl border border-slate-800 bg-slate-900 px-4 py-8 text-center shadow-[0_12px_36px_rgba(2,6,23,0.28)]"
        >
          <p className="text-sm text-slate-400">{error || "Payment not found"}</p>
          <button
            onClick={() => router.back()}
            className="mt-4 inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-100 transition hover:border-slate-600 hover:bg-slate-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </button>
        </motion.div>
      </div>
    );
  }

  const statusColors = paymentStatusColors[payment.paymentStatus as PaymentStatus];
  const modeLabel = paymentModeLabels[payment.paymentMode as PaymentMode];

  return (
    <>
      <Toaster position="top-right" richColors closeButton />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ staggerChildren: 0.06, delayChildren: 0.05 }}
        className="space-y-6"
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ staggerChildren: 0.06, delayChildren: 0.05 }}
          className="space-y-4 pt-0 pb-2"
        >
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="rounded-2xl border border-slate-800 bg-slate-900 p-4 shadow-[0_12px_36px_rgba(2,6,23,0.28)]"
          >
            <div className="flex flex-col gap-3.5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => router.back()}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-800 bg-slate-950 text-slate-300 transition hover:border-slate-700 hover:bg-slate-800 hover:text-slate-100"
                  aria-label="Go back"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-xl font-semibold tracking-tight text-slate-100 sm:text-2xl">Payment Details</h1>
                    <span className="rounded-full border border-slate-800 bg-slate-950 px-2.5 py-1 text-[11px] font-medium text-slate-400">
                      #{payment.id.slice(0, 8).toUpperCase()}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500 sm:text-sm">View complete payment information.</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${statusColors.bg} ${statusColors.text} border-slate-800`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${statusColors.dot}`} />
                  {payment.paymentStatus}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs font-semibold text-slate-200">
                  <IndianRupee className="h-3.5 w-3.5 text-slate-400" />
                  {formatCurrency(payment.amount)}
                </span>
              </div>
            </div>
          </motion.section>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="rounded-2xl border border-slate-800 bg-slate-900 p-3.5 shadow-[0_12px_36px_rgba(2,6,23,0.28)]"
          >
            <div className="flex flex-col gap-3.5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-xl font-bold text-white ring-1 ring-slate-800">
                  {payment.avatar}
                </div>
                <div className="min-w-0">
                  <h2 className="truncate text-lg font-semibold tracking-tight text-slate-100 sm:text-xl">{payment.memberName}</h2>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-300">
                      <Tag className="h-3.5 w-3.5" />
                      {payment.plan}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-800 bg-slate-950 px-3 py-1 text-xs font-medium text-slate-300">
                      <CreditCard className="h-3.5 w-3.5 text-slate-400" />
                      {modeLabel}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-800 bg-slate-950 px-3 py-1 text-xs font-medium text-slate-300">
                      <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
                      {formatDate(payment.paymentDate)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-1.5">
                  <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-slate-500">Amount</p>
                  <p className="mt-0.5 text-sm font-semibold text-slate-100">{formatCurrency(payment.amount)}</p>
                </div>
                <div className={`rounded-xl border px-3 py-1.5 ${statusColors.bg} ${statusColors.text} border-slate-800`}>
                  <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-inherit opacity-80">Status</p>
                  <p className="mt-0.5 text-sm font-semibold text-inherit">{payment.paymentStatus}</p>
                </div>
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="rounded-2xl border border-slate-800 bg-slate-900 p-3.5 shadow-[0_12px_36px_rgba(2,6,23,0.28)]"
          >
            <div className="mb-3.5 flex items-center gap-2">
              <IndianRupee className="h-4 w-4 text-blue-400" />
              <h3 className="text-sm font-semibold text-slate-100">Payment Information</h3>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-2.5">
                <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-500">Amount</p>
                <p className="mt-1 text-sm font-semibold text-slate-100">{formatCurrency(payment.amount)}</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-2.5">
                <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-500">Payment Method</p>
                <p className="mt-1 text-sm font-semibold text-slate-100">{modeLabel}</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-2.5">
                <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-500">Status</p>
                <div className="mt-1">
                  <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusColors.bg} ${statusColors.text} border-slate-800`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${statusColors.dot}`} />
                    {payment.paymentStatus}
                  </span>
                </div>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-2.5">
                <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-500">Transaction ID</p>
                <p className="mt-1 truncate text-sm font-semibold text-slate-100">{payment.transactionId || "—"}</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-2.5 sm:col-span-2">
                <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-500">Payment Date</p>
                <p className="mt-1 text-sm font-semibold text-slate-100">{formatDate(payment.paymentDate)}</p>
              </div>
            </div>
          </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: "easeOut", delay: 0.03 }}
              className="rounded-2xl border border-slate-800 bg-slate-900 p-3.5 shadow-[0_12px_36px_rgba(2,6,23,0.28)]"
            >
              <div className="mb-3.5 flex items-center gap-2">
                <UserRound className="h-4 w-4 text-blue-400" />
                <h3 className="text-sm font-semibold text-slate-100">Member Information</h3>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-2.5">
                  <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-500">Name</p>
                  <p className="mt-1 text-sm font-semibold text-slate-100">{payment.memberName}</p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-2.5">
                  <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-500">Phone</p>
                  <p className="mt-1 text-sm font-semibold text-slate-100">{payment.memberPhone}</p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-2.5">
                  <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-500">Member ID</p>
                  <p className="mt-1 text-sm font-semibold text-slate-100">#{payment.memberId.slice(0, 8).toUpperCase()}</p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-2.5">
                  <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-500">Membership ID</p>
                  <p className="mt-1 text-sm font-semibold text-slate-100">#{payment.membershipId.slice(0, 8).toUpperCase()}</p>
                </div>
              </div>
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: "easeOut", delay: 0.06 }}
              className="rounded-2xl border border-slate-800 bg-slate-900 p-3.5 shadow-[0_12px_36px_rgba(2,6,23,0.28)]"
            >
              <div className="mb-3.5 flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-blue-400" />
                <h3 className="text-sm font-semibold text-slate-100">Membership Details</h3>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-2.5">
                  <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-500">Plan</p>
                  <p className="mt-1 text-sm font-semibold text-slate-100">{payment.plan}</p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-2.5">
                  <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-500">Plan ID</p>
                  <p className="mt-1 text-sm font-semibold text-slate-100">#{payment.planId.slice(0, 8).toUpperCase()}</p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-2.5">
                  <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-500">Duration</p>
                  <p className="mt-1 text-sm font-semibold text-slate-100">{payment.planDurationInDays} days</p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-2.5">
                  <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-500">Start Date</p>
                  <p className="mt-1 text-sm font-semibold text-slate-100">{payment.membershipStartDate ? formatDate(payment.membershipStartDate) : "—"}</p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-2.5">
                  <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-500">End Date</p>
                  <p className="mt-1 text-sm font-semibold text-slate-100">{payment.membershipEndDate ? formatDate(payment.membershipEndDate) : "—"}</p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-2.5">
                  <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-500">Membership Amount</p>
                  <p className="mt-1 text-sm font-semibold text-slate-100">{payment.membershipAmount !== null ? formatCurrency(payment.membershipAmount) : "—"}</p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-2.5">
                  <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-500">Discount</p>
                  <p className="mt-1 text-sm font-semibold text-slate-100">{payment.membershipDiscount !== null ? formatCurrency(payment.membershipDiscount) : "—"}</p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-2.5 sm:col-span-2">
                  <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-500">Final Amount</p>
                  <p className="mt-1 text-sm font-semibold text-slate-100">{payment.membershipFinalAmount !== null ? formatCurrency(payment.membershipFinalAmount) : "—"}</p>
                </div>
              </div>
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: "easeOut", delay: 0.09 }}
              className="rounded-2xl border border-slate-800 bg-slate-900 p-3.5 shadow-[0_12px_36px_rgba(2,6,23,0.28)]"
            >
              <div className="mb-3.5 flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-400" />
                <h3 className="text-sm font-semibold text-slate-100">Payment Metadata</h3>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-2.5">
                  <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-500">Created</p>
                  <p className="mt-1 text-sm font-semibold text-slate-100">{formatDateTime(payment.createdAt)}</p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-2.5">
                  <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-500">Last Updated</p>
                  <p className="mt-1 text-sm font-semibold text-slate-100">{formatDateTime(payment.updatedAt)}</p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-2.5">
                  <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-500">Payment Status</p>
                  <p className="mt-1 text-sm font-semibold text-slate-100">{payment.paymentStatus}</p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-2.5">
                  <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-500">Payment Method</p>
                  <p className="mt-1 text-sm font-semibold text-slate-100">{modeLabel}</p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-2.5 sm:col-span-2">
                  <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-500">Payment ID</p>
                  <p className="mt-1 text-sm font-semibold text-slate-100">#{payment.id.slice(0, 8).toUpperCase()}</p>
                </div>
              </div>
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: "easeOut", delay: 0.12 }}
              className="rounded-2xl border border-slate-800 bg-slate-900 p-3.5 shadow-[0_12px_36px_rgba(2,6,23,0.28)] lg:col-span-2"
            >
              <div className="mb-3.5 flex items-center gap-2">
                <Hash className="h-4 w-4 text-blue-400" />
                <h3 className="text-sm font-semibold text-slate-100">Notes / Remarks</h3>
              </div>
              <p className="rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-sm leading-6 text-slate-300">
                {payment.remarks || "No remarks"}
              </p>
            </motion.section>
          </div>
        </motion.div>
      </motion.div>
    </>
  );
}