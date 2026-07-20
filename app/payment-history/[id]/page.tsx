"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Edit2, Copy, CheckCircle2, Clock, AlertCircle, DollarSign, Calendar, Wallet, FileText, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { AppHeader } from "@/app/components/AppHeader";
import { BottomNavigation } from "@/app/components/BottomNavigation";
import { PageContainer } from "@/app/components/PageContainer";
import { mockPayments } from "@/app/payment-history/mockPayments";

const statusConfig = {
  paid: {
    label: "Paid",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    ring: "ring-emerald-200",
    icon: CheckCircle2,
  },
  pending: {
    label: "Pending",
    bg: "bg-amber-50",
    text: "text-amber-700",
    ring: "ring-amber-200",
    icon: Clock,
  },
  failed: {
    label: "Failed",
    bg: "bg-rose-50",
    text: "text-rose-700",
    ring: "ring-rose-200",
    icon: AlertCircle,
  },
};

const methodConfig: Record<string, { color: string; icon: string }> = {
  Cash: { color: "bg-green-100 text-green-700", icon: "💵" },
  UPI: { color: "bg-blue-100 text-blue-700", icon: "📱" },
  "Credit Card": { color: "bg-purple-100 text-purple-700", icon: "💳" },
  "Net Banking": { color: "bg-indigo-100 text-indigo-700", icon: "🏦" },
};

export default function PaymentDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  const payment = mockPayments.find((p) => p.id === parseInt(params.id));

  if (!payment) {
    return (
      <div>
        <AppHeader title="Payment Details" />
        <PageContainer>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-32"
          >
            <AlertCircle className="h-12 w-12 text-slate-300" />
            <p className="mt-4 text-lg font-semibold text-slate-900">Payment not found</p>
            <button
              onClick={() => router.back()}
              className="mt-4 flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              <ArrowLeft className="h-4 w-4" />
              Go Back
            </button>
          </motion.div>
        </PageContainer>
      </div>
    );
  }

  const transactionId = `TXN-${String(payment.id).padStart(6, "0")}-${new Date().getFullYear()}`;
  const StatusIcon = statusConfig[payment.status].icon;
  const methodConfig_ = methodConfig[payment.method] || { color: "bg-slate-100 text-slate-700", icon: "💰" };

  const handleCopyTransactionId = () => {
    navigator.clipboard.writeText(transactionId);
    setCopied(true);
    toast.success("Transaction ID copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,_#f5f8ff_0%,_#eef5ff_100%)] text-slate-900">
      <AppHeader title="Payment Details" />

      <PageContainer>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-6 py-4"
        >
          {/* Header with Back Button */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 text-slate-600 transition hover:border-blue-200 hover:text-blue-600"
              aria-label="Go back"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => router.push(`/payment-history/${payment.id}/edit`)}
              className="flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              <Edit2 className="h-4 w-4" />
              Edit
            </button>
          </div>

          {/* Hero Card - Member & Status */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 }}
            className="overflow-hidden rounded-[1.6rem] border border-slate-200 bg-gradient-to-br from-blue-50 to-white shadow-[0_10px_35px_rgba(15,23,42,0.06)]"
          >
            <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-500 text-2xl font-bold text-white shadow-lg shadow-blue-600/20">
                  {payment.avatar}
                </div>
                <div>
                  <p className="text-xl font-semibold text-slate-900">{payment.memberName}</p>
                  <p className="text-sm text-slate-600">{payment.plan} Membership</p>
                  <p className="mt-1 text-xs text-slate-500">{payment.date}</p>
                </div>
              </div>

              <div className={`flex items-center gap-2 rounded-full px-4 py-2 ${statusConfig[payment.status].bg} ${statusConfig[payment.status].text}`}>
                <StatusIcon className="h-4 w-4" />
                <span className="font-semibold">{statusConfig[payment.status].label}</span>
              </div>
            </div>
          </motion.section>

          {/* Amount Section */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="rounded-[1.6rem] border border-slate-200 bg-white p-6 shadow-[0_10px_35px_rgba(15,23,42,0.06)]"
          >
            <div className="flex items-baseline justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Amount Paid</p>
                <p className="mt-2 text-4xl font-bold text-slate-900">₹{payment.amount.toLocaleString()}</p>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                <DollarSign className="h-6 w-6" />
              </div>
            </div>
          </motion.section>

          {/* Payment Details Grid */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            className="grid gap-3 sm:grid-cols-2"
          >
            {/* Payment Date */}
            <div className="rounded-[1.4rem] border border-slate-200 bg-white p-4 shadow-[0_10px_35px_rgba(15,23,42,0.06)]">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
                  <Calendar className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-600">Payment Date</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{payment.date}</p>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="rounded-[1.4rem] border border-slate-200 bg-white p-4 shadow-[0_10px_35px_rgba(15,23,42,0.06)]">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${methodConfig_.color}`}>
                  <span className="text-lg">{methodConfig_.icon}</span>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-600">Payment Method</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{payment.method}</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Transaction Details */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="rounded-[1.6rem] border border-slate-200 bg-white p-6 shadow-[0_10px_35px_rgba(15,23,42,0.06)]"
          >
            <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-900">
              <Wallet className="h-4.5 w-4.5 text-blue-600" />
              Transaction Details
            </h3>

            <div className="space-y-4">
              {/* Transaction ID */}
              <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div>
                  <p className="text-xs font-medium text-slate-600">Transaction ID</p>
                  <p className="mt-1 font-mono text-sm font-semibold text-slate-900">{transactionId}</p>
                </div>
                <button
                  onClick={handleCopyTransactionId}
                  className={`rounded-2xl p-2 transition ${
                    copied
                      ? "bg-emerald-100 text-emerald-600"
                      : "border border-slate-200 text-slate-600 hover:border-blue-200 hover:text-blue-600"
                  }`}
                  aria-label="Copy transaction ID"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>

              {/* Membership Plan */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-medium text-slate-600">Membership Plan</p>
                <p className="mt-2 text-sm font-semibold text-slate-900">{payment.plan}</p>
              </div>

              {/* Payment Status Detail */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-medium text-slate-600">Status</p>
                <div className="mt-2 flex items-center gap-2">
                  <div className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusConfig[payment.status].bg} ${statusConfig[payment.status].text} ring-1 ${statusConfig[payment.status].ring}`}>
                    {statusConfig[payment.status].label}
                  </div>
                  {payment.status === "paid" && (
                    <p className="text-xs text-emerald-600">Successfully processed</p>
                  )}
                  {payment.status === "pending" && (
                    <p className="text-xs text-amber-600">Awaiting confirmation</p>
                  )}
                  {payment.status === "failed" && (
                    <p className="text-xs text-rose-600">Retry payment</p>
                  )}
                </div>
              </div>
            </div>
          </motion.section>

          {/* Notes Section */}
          {true && (
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.25 }}
              className="rounded-[1.6rem] border border-slate-200 bg-white p-6 shadow-[0_10px_35px_rgba(15,23,42,0.06)]"
            >
              <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-900">
                <FileText className="h-4.5 w-4.5 text-blue-600" />
                Notes
              </h3>

              <p className="whitespace-pre-wrap rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                {`Monthly subscription renewal for ${payment.memberName}\n6-month prepayment plan\nAuto-renewal enabled`}
              </p>
            </motion.section>
          )}

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            className="flex flex-col gap-3 rounded-[1.6rem] border border-slate-200 bg-white p-6 shadow-[0_10px_35px_rgba(15,23,42,0.06)] sm:flex-row sm:justify-end"
          >
            <button
              onClick={() => router.back()}
              className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-blue-200 hover:text-blue-600"
            >
              Back
            </button>
            <button
              onClick={() => router.push(`/payment-history/${payment.id}/edit`)}
              className="flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
            >
              <Edit2 className="h-4 w-4" />
              Edit Payment
            </button>
          </motion.div>
        </motion.div>
      </PageContainer>

      <BottomNavigation />
    </div>
  );
}
