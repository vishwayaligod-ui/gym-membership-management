"use client";

import { motion } from "framer-motion";
import {
  ArrowLeft,
  CalendarDays,
  CreditCard,
  Hash,
  Loader2,
  UserRound,
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

  const infoRows = [
    { icon: CreditCard, label: "Payment Method", value: modeLabel },
    { icon: CalendarDays, label: "Payment Date", value: formatDate(payment.paymentDate) },
    ...(payment.transactionId
      ? [{ icon: Hash, label: "Transaction ID", value: payment.transactionId }]
      : []),
    { icon: UserRound, label: "Paid by", value: payment.memberName },
  ];

  return (
    <>
      <Toaster position="top-right" richColors closeButton />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ staggerChildren: 0.06, delayChildren: 0.05 }}
        className="mx-auto max-w-md space-y-3 pt-0 pb-2"
      >
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="rounded-2xl border border-slate-800 bg-slate-900 p-4 shadow-[0_12px_36px_rgba(2,6,23,0.28)]"
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-800 bg-slate-950 text-slate-300 transition hover:border-slate-700 hover:bg-slate-800 hover:text-slate-100"
              aria-label="Go back"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="min-w-0">
              <h1 className="text-lg font-semibold tracking-tight text-slate-100 sm:text-xl">Payment Details</h1>
              <p className="mt-0.5 truncate text-xs font-medium text-slate-500">
                #{payment.id.slice(0, 8).toUpperCase()}
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-end justify-between gap-2 border-t border-slate-800 pt-3.5">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-500">Amount Paid</p>
              <p className="mt-1 text-3xl font-semibold tracking-tight text-slate-50">
                {formatCurrency(payment.amount)}
              </p>
            </div>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${statusColors.bg} ${statusColors.text} border-slate-800`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${statusColors.dot}`} />
              {payment.paymentStatus}
            </span>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: "easeOut", delay: 0.06 }}
          className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-[0_12px_36px_rgba(2,6,23,0.28)]"
        >
          <div className="divide-y divide-slate-800">
            {infoRows.map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="flex shrink-0 items-center gap-2">
                  <Icon className="h-4 w-4 text-blue-400" />
                  <p className="text-xs font-medium text-slate-500">{label}</p>
                </div>
                <p className="min-w-0 truncate text-right text-sm font-semibold text-slate-100">{value}</p>
              </div>
            ))}
          </div>
        </motion.section>

      </motion.div>
    </>
  );
}