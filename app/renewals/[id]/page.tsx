"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Calendar, Phone, DollarSign, FileText, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { useRouter } from "next/navigation";
import { use, useState, useEffect } from "react";
import { AppHeader } from "@/app/components/AppHeader";
import { BottomNavigation } from "@/app/components/BottomNavigation";
import { PageContainer } from "@/app/components/PageContainer";

type RenewalStatus = "Active" | "Due Soon" | "Expired" | "Renewed";

interface RenewalDetail {
  id: string;
  name: string;
  phone: string;
  plan: string;
  expiryDate: string;
  daysRemaining: number;
  fee: number;
  status: RenewalStatus;
  avatar: string;
  planId: string;
  amount: number;
  discount: number;
  finalAmount: number;
  startDate: string;
  endDate: string;
  updatedAt: string;
  createdAt: string;
  lastPayment: {
    id: string;
    paymentDate: string;
    paymentStatus: string;
    amount: number;
    paymentMode: string;
  } | null;
}

const statusStyles: Record<RenewalStatus, { bg: string; text: string; border: string }> = {
  Active: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  "Due Soon": { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  Expired: { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200" },
  Renewed: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
};

const statusIcons: Record<RenewalStatus, typeof CheckCircle2> = {
  Active: CheckCircle2,
  "Due Soon": Clock,
  Expired: AlertCircle,
  Renewed: CheckCircle2,
};

function formatDate(isoString: string): string {
  const date = new Date(isoString);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

export default function RenewalDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const [renewal, setRenewal] = useState<RenewalDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchRenewal() {
      try {
        const response = await fetch(`/api/renewals/${id}`);
        if (!response.ok) throw new Error("Not found");
        const data = await response.json();
        setRenewal(data.renewal);
      } catch (error) {
        console.error("Failed to fetch renewal:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchRenewal();
  }, [id]);

  if (isLoading) {
    return (
      <div>
        <AppHeader title="Renewal Details" />
        <PageContainer>
          <div className="flex items-center justify-center py-32">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          </div>
        </PageContainer>
      </div>
    );
  }

  if (!renewal) {
    return (
      <div>
        <AppHeader title="Renewal Details" />
        <PageContainer>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-32"
          >
            <AlertCircle className="h-12 w-12 text-slate-300" />
            <p className="mt-4 text-lg font-semibold text-slate-900">Renewal not found</p>
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

  const statusStyle = statusStyles[renewal.status];
  const StatusIcon = statusIcons[renewal.status];

  // Calculate previous expiry date (from startDate or 3 months before current expiry)
  const prevExpiryDate = formatDate(renewal.startDate);

  // Determine duration from the difference between start and end date
  const startDateObj = new Date(renewal.startDate);
  const endDateObj = new Date(renewal.endDate);
  const diffMonths = Math.round((endDateObj.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24 * 30));
  const duration = diffMonths <= 1 ? "1 Month" : diffMonths <= 3 ? "3 Months" : diffMonths <= 6 ? "6 Months" : "12 Months";

  // Determine payment method from last payment
  const paymentMethod = renewal.lastPayment?.paymentMode === "CASH" ? "Cash" :
    renewal.lastPayment?.paymentMode === "UPI" ? "UPI" :
    renewal.lastPayment?.paymentMode === "CARD" ? "Card" : "Cash";

  // Renewal date
  const renewalDate = formatDate(renewal.updatedAt);

  // Notes
  const notes = `Membership ${renewal.status === "Renewed" ? "renewed" : "updated"} successfully for ${duration}`;

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,_#f5f8ff_0%,_#eef5ff_100%)] text-slate-900">
      <AppHeader title="Renewal Details" />

      <PageContainer>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-4 py-4"
        >
          {/* Header with Back Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 text-slate-600 transition hover:border-blue-200 hover:text-blue-600"
              aria-label="Go back"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <p className="text-2xl font-semibold tracking-tight text-slate-950">Renewal Details</p>
              <p className="mt-1 text-sm text-slate-500">Renewal ID: RNL-{renewal.id.slice(0, 6).toUpperCase()}</p>
            </div>
          </div>

          {/* Hero Card */}
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 }}
            className="rounded-[1.6rem] border border-slate-200 bg-white p-4 shadow-[0_10px_35px_rgba(15,23,42,0.06)] sm:p-5"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-500 text-lg font-semibold text-white shadow-lg shadow-blue-600/20">
                  {renewal.avatar}
                </div>
                <div className="min-w-0">
                  <p className="text-2xl font-semibold text-slate-900">{renewal.name}</p>
                  <p className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                    <Phone className="h-4 w-4" />
                    {renewal.phone}
                  </p>
                  <p className="mt-1 text-sm font-medium text-blue-600">{renewal.plan} Plan</p>
                </div>
              </div>
              <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold ring-1 ${statusStyle.bg} ${statusStyle.text} ring-current/20`}>
                <StatusIcon className="h-4 w-4" />
                {renewal.status}
              </div>
            </div>
          </motion.section>

          {/* Renewal Dates Section */}
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="grid gap-4 md:grid-cols-2"
          >
            <div className="rounded-[1.6rem] border border-slate-200 bg-white p-4 shadow-[0_10px_35px_rgba(15,23,42,0.06)] sm:p-5">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="h-4 w-4 text-slate-400" />
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Previous Expiry Date</p>
              </div>
              <p className="text-2xl font-bold text-slate-900">{prevExpiryDate}</p>
            </div>

            <div className="rounded-[1.6rem] border border-blue-200 bg-blue-50 p-4 shadow-[0_10px_35px_rgba(15,23,42,0.06)] sm:p-5">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="h-4 w-4 text-blue-600" />
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-600">New Expiry Date</p>
              </div>
              <p className="text-2xl font-bold text-blue-900">{renewal.expiryDate}</p>
            </div>
          </motion.section>

          {/* Renewal Information Grid */}
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            <div className="rounded-[1.6rem] border border-slate-200 bg-white p-4 shadow-[0_10px_35px_rgba(15,23,42,0.06)]">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Duration</p>
              <p className="mt-2 text-lg font-bold text-slate-900">{duration}</p>
            </div>

            <div className="rounded-[1.6rem] border border-slate-200 bg-white p-4 shadow-[0_10px_35px_rgba(15,23,42,0.06)]">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Renewal Date</p>
              <p className="mt-2 text-lg font-bold text-slate-900">{renewalDate}</p>
            </div>

            <div className="rounded-[1.6rem] border border-slate-200 bg-white p-4 shadow-[0_10px_35px_rgba(15,23,42,0.06)]">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Payment Method</p>
              <p className="mt-2 text-lg font-bold text-slate-900">{paymentMethod}</p>
            </div>

            <div className="rounded-[1.6rem] border border-slate-200 bg-white p-4 shadow-[0_10px_35px_rgba(15,23,42,0.06)]">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Membership Plan</p>
              <p className="mt-2 text-lg font-bold text-slate-900">{renewal.plan}</p>
            </div>
          </motion.section>

          {/* Amount Section */}
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="space-y-3 rounded-[1.6rem] border border-slate-200 bg-white p-4 shadow-[0_10px_35px_rgba(15,23,42,0.06)] sm:p-5"
          >
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="h-4 w-4 text-slate-400" />
              <p className="text-base font-semibold text-slate-900">Payment Details</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-slate-50 border border-slate-100 p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Renewal Amount</p>
                <p className="mt-1.5 text-lg font-bold text-slate-900">₹{renewal.amount.toLocaleString()}</p>
              </div>

              <div className="rounded-2xl bg-amber-50 border border-amber-100 p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-600">Discount</p>
                <p className="mt-1.5 text-lg font-bold text-amber-900">₹{renewal.discount.toLocaleString()}</p>
              </div>

              <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-600">Final Amount</p>
                <p className="mt-1.5 text-lg font-bold text-emerald-900">₹{renewal.finalAmount.toLocaleString()}</p>
              </div>
            </div>

            {/* Amount Breakdown */}
            <div className="border-t border-slate-100 pt-3 mt-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Renewal Amount</span>
                <span className="font-medium text-slate-900">₹{renewal.amount.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Discount Applied</span>
                <span className="font-medium text-amber-600">-₹{renewal.discount.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-base font-semibold">
                <span className="text-slate-900">Total Paid</span>
                <span className="text-blue-600">₹{renewal.finalAmount.toLocaleString()}</span>
              </div>
            </div>
          </motion.section>

          {/* Notes Section */}
          {notes && (
            <motion.section
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.25 }}
              className="rounded-[1.6rem] border border-slate-200 bg-white p-4 shadow-[0_10px_35px_rgba(15,23,42,0.06)] sm:p-5"
            >
              <div className="flex items-center gap-2 mb-3">
                <FileText className="h-4 w-4 text-slate-400" />
                <p className="text-base font-semibold text-slate-900">Notes</p>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">{notes}</p>
            </motion.section>
          )}

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            className="flex flex-col-reverse gap-3 rounded-[1.6rem] border border-slate-200 bg-white p-4 shadow-[0_10px_35px_rgba(15,23,42,0.06)] sm:flex-row sm:justify-between"
          >
            <button
              onClick={() => router.back()}
              className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-blue-200 hover:text-blue-600"
            >
              Back to Renewals
            </button>
            <button
              onClick={() => router.push(`/renewals/${renewal.id}/edit`)}
              className="rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
            >
              Edit Renewal
            </button>
          </motion.div>
        </motion.div>
      </PageContainer>

      <BottomNavigation />
    </div>
  );
}