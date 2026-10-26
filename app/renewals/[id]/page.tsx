"use client";

import { motion } from "framer-motion";
import {
  ArrowLeft,
  Calendar,
  Phone,
  DollarSign,
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { use, useState, useEffect } from "react";
import { AppHeader } from "@/app/components/AppHeader";
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

const statusStyles: Record<
  RenewalStatus,
  { bg: string; text: string; border: string }
> = {
  Active: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
    border: "border-emerald-500/20",
  },
  "Due Soon": {
    bg: "bg-amber-500/10",
    text: "text-amber-400",
    border: "border-amber-500/20",
  },
  Expired: {
    bg: "bg-rose-500/10",
    text: "text-rose-400",
    border: "border-rose-500/20",
  },
  Renewed: {
    bg: "bg-blue-500/10",
    text: "text-blue-400",
    border: "border-blue-500/20",
  },
};

const statusIcons: Record<RenewalStatus, typeof CheckCircle2> = {
  Active: CheckCircle2,
  "Due Soon": Clock,
  Expired: AlertCircle,
  Renewed: CheckCircle2,
};

function formatDate(isoString: string): string {
  const date = new Date(isoString);
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

export default function RenewalDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
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
      <div className="min-h-screen bg-slate-950 text-slate-100">
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
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <AppHeader title="Renewal Details" />

        <PageContainer>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-32"
          >
            <AlertCircle className="h-12 w-12 text-slate-500" />

            <p className="mt-4 text-base font-semibold text-slate-100">
              Renewal not found
            </p>

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

  const diffMonths = Math.round(
    (endDateObj.getTime() - startDateObj.getTime()) /
      (1000 * 60 * 60 * 24 * 30)
  );

  const duration =
    diffMonths <= 1
      ? "1 Month"
      : diffMonths <= 3
        ? "3 Months"
        : diffMonths <= 6
          ? "6 Months"
          : "12 Months";

  // Determine payment method from last payment
  const paymentMethod =
    renewal.lastPayment?.paymentMode === "CASH"
      ? "Cash"
      : renewal.lastPayment?.paymentMode === "UPI"
        ? "UPI"
        : renewal.lastPayment?.paymentMode === "CARD"
          ? "Card"
          : "Cash";

  // Renewal date
  const renewalDate = formatDate(renewal.updatedAt);

  // Notes
  const notes = `Membership ${
    renewal.status === "Renewed" ? "renewed" : "updated"
  } successfully for ${duration}`;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <AppHeader title="Renewal Details" />

      <PageContainer>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-4 py-4"
        >
          {/* Header with Back Button */}
          <div className="flex items-center gap-3 pt-1 sm:pt-0">
            <button
              onClick={() => router.back()}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/50 text-slate-400 transition hover:border-blue-500/30 hover:text-blue-400"
              aria-label="Go back"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>

            <div className="min-w-0">
              <p className="text-lg font-semibold leading-tight tracking-tight text-slate-100">
                Renewal Details
              </p>

              <p className="mt-0.5 text-xs text-slate-500">
                Renewal ID: RNL-{renewal.id.slice(0, 6).toUpperCase()}
              </p>
            </div>
          </div>

          {/* Member Summary */}
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 }}
            className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-sm font-semibold text-white">
                {renewal.avatar}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-semibold leading-snug text-slate-100">
                  {renewal.name}
                </p>

                <p className="mt-0.5 flex items-center gap-1.5 text-sm text-slate-400">
                  <Phone className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{renewal.phone}</span>
                </p>

                <p className="mt-0.5 truncate text-xs font-medium text-blue-400">
                  {renewal.plan} Plan
                </p>
              </div>

              <div
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
              >
                <StatusIcon className="h-3.5 w-3.5" />
                {renewal.status}
              </div>
            </div>
          </motion.section>

          {/* Renewal Summary */}
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4"
          >
            <div className="mb-3 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-slate-500" />

              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Renewal Summary
              </p>
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                  Previous Expiry Date
                </p>

                <p className="mt-1 text-sm font-semibold text-slate-100">
                  {prevExpiryDate}
                </p>
              </div>

              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                  New Expiry Date
                </p>

                <p className="mt-1 text-sm font-semibold text-blue-300">
                  {renewal.expiryDate}
                </p>
              </div>

              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                  Duration
                </p>

                <p className="mt-1 text-sm font-semibold text-slate-100">
                  {duration}
                </p>
              </div>

              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                  Renewal Date
                </p>

                <p className="mt-1 text-sm font-semibold text-slate-100">
                  {renewalDate}
                </p>
              </div>
            </div>
          </motion.section>

          {/* Amount & plan details moved into Renewal/Payment summaries */}

          {/* Payment Summary */}
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4"
          >
            <div className="mb-3 flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-slate-500" />

              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Payment Summary
              </p>
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                  Payment Method
                </p>

                <p className="mt-1 text-sm font-semibold text-slate-100">
                  {paymentMethod}
                </p>
              </div>

              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                  Membership Plan
                </p>

                <p className="mt-1 text-sm font-semibold text-slate-100">
                  {renewal.plan}
                </p>
              </div>

              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                  Renewal Amount
                </p>

                <p className="mt-1 text-sm font-semibold text-slate-100">
                  ₹{renewal.amount.toLocaleString()}
                </p>
              </div>

              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                  Discount
                </p>

                <p className="mt-1 text-sm font-semibold text-amber-400">
                  -₹{renewal.discount.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-slate-800 pt-3">
              <span className="text-sm font-semibold text-slate-100">Total Paid</span>

              <span className="text-lg font-bold text-blue-400">
                ₹{renewal.finalAmount.toLocaleString()}
              </span>
            </div>
          </motion.section>

          {/* Notes Section */}
          {notes && (
            <motion.section
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="flex items-start gap-2.5 rounded-2xl border border-slate-800 bg-slate-900/70 p-3.5"
            >
              <FileText className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />

              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Notes
                </p>

                <p className="mt-1 text-sm leading-relaxed text-slate-400">
                  {notes}
                </p>
              </div>
            </motion.section>
          )}

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.25 }}
            className="flex flex-col gap-3 pt-1 sm:flex-row"
          >
            <button
              onClick={() => router.push(`/renewals/${renewal.id}/edit`)}
              className="flex h-12 w-full items-center justify-center rounded-2xl bg-blue-600 px-6 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 sm:h-11 sm:w-auto"
            >
              Edit Renewal
            </button>

            <button
              onClick={() => router.back()}
              className="flex h-12 w-full items-center justify-center rounded-2xl border border-slate-800 px-6 text-sm font-semibold text-slate-400 transition hover:border-blue-500/30 hover:text-blue-400 sm:h-11 sm:w-auto"
            >
              Back to Renewals
            </button>
          </motion.div>
        </motion.div>
      </PageContainer>
    </div>
  );
}