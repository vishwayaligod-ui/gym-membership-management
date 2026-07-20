"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Calendar, Phone, DollarSign, CreditCard, FileText, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/app/components/AppHeader";
import { BottomNavigation } from "@/app/components/BottomNavigation";
import { PageContainer } from "@/app/components/PageContainer";
import { mockRenewals, type RenewalStatus } from "@/app/renewals/mockRenewals";

type DetailedRenewal = {
  id: number;
  name: string;
  phone: string;
  plan: string;
  previousExpiryDate: string;
  newExpiryDate: string;
  duration: string;
  renewalAmount: number;
  discount: number;
  finalAmount: number;
  paymentMethod: string;
  renewalDate: string;
  notes: string;
  status: RenewalStatus;
  avatar: string;
};

function generateRenewalDetails(id: number): DetailedRenewal | null {
  const renewal = mockRenewals.find((r) => r.id === id);
  if (!renewal) return null;

  // Calculate previous expiry date (3 months before current expiry)
  const currExpiry = new Date(renewal.expiryDate);
  const prevExpiry = new Date(currExpiry);
  prevExpiry.setMonth(prevExpiry.getMonth() - 3);

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const formatDate = (date: Date) => {
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  };

  // Determine duration based on days remaining
  let duration = "3 Months";
  if (renewal.daysRemaining <= 7) duration = "1 Month";
  else if (renewal.daysRemaining > 30) duration = "12 Months";
  else if (renewal.daysRemaining > 14) duration = "6 Months";

  // Calculate amounts
  const baseAmount = renewal.fee;
  const discount = Math.floor(baseAmount * 0.1); // 10% discount
  const finalAmount = baseAmount - discount;

  // Payment methods
  const paymentMethods = ["Cash", "UPI", "Card"];
  const paymentMethod = paymentMethods[renewal.id % paymentMethods.length];

  // Renewal date (today's date in mock scenario)
  const renewalDate = "Jul 20, 2026";

  // Notes
  const notesList = [
    "Membership successfully renewed for 3 months",
    "Early renewal bonus: 10% discount applied",
    "Previous plan: Premium (expired)",
    "Monthly subscription renewal as per schedule",
  ];
  const notes = notesList[renewal.id % notesList.length];

  return {
    id: renewal.id,
    name: renewal.name,
    phone: renewal.phone,
    plan: renewal.plan,
    previousExpiryDate: formatDate(prevExpiry),
    newExpiryDate: renewal.expiryDate,
    duration,
    renewalAmount: baseAmount,
    discount,
    finalAmount,
    paymentMethod,
    renewalDate,
    notes,
    status: renewal.status,
    avatar: renewal.avatar,
  };
}

const statusStyles: Record<RenewalStatus, { bg: string; text: string; border: string }> = {
  Active: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  "Due Soon": { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  Expired: { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200" },
};

const statusIcons: Record<RenewalStatus, typeof CheckCircle2> = {
  Active: CheckCircle2,
  "Due Soon": Clock,
  Expired: AlertCircle,
};

export default function RenewalDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const renewal = generateRenewalDetails(parseInt(params.id));

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
              <p className="mt-1 text-sm text-slate-500">Renewal ID: RNL-{renewal.id.toString().padStart(6, "0")}</p>
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
              <p className="text-2xl font-bold text-slate-900">{renewal.previousExpiryDate}</p>
            </div>

            <div className="rounded-[1.6rem] border border-blue-200 bg-blue-50 p-4 shadow-[0_10px_35px_rgba(15,23,42,0.06)] sm:p-5">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="h-4 w-4 text-blue-600" />
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-600">New Expiry Date</p>
              </div>
              <p className="text-2xl font-bold text-blue-900">{renewal.newExpiryDate}</p>
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
              <p className="mt-2 text-lg font-bold text-slate-900">{renewal.duration}</p>
            </div>

            <div className="rounded-[1.6rem] border border-slate-200 bg-white p-4 shadow-[0_10px_35px_rgba(15,23,42,0.06)]">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Renewal Date</p>
              <p className="mt-2 text-lg font-bold text-slate-900">{renewal.renewalDate}</p>
            </div>

            <div className="rounded-[1.6rem] border border-slate-200 bg-white p-4 shadow-[0_10px_35px_rgba(15,23,42,0.06)]">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Payment Method</p>
              <p className="mt-2 text-lg font-bold text-slate-900">{renewal.paymentMethod}</p>
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
                <p className="mt-1.5 text-lg font-bold text-slate-900">₹{renewal.renewalAmount.toLocaleString()}</p>
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
                <span className="font-medium text-slate-900">₹{renewal.renewalAmount.toLocaleString()}</span>
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
          {renewal.notes && (
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
              <p className="text-sm text-slate-600 leading-relaxed">{renewal.notes}</p>
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
