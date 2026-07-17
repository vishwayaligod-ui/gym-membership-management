"use client";

import { motion } from "framer-motion";
import {
  Download,
  Eye,
  Share2,
  type LucideIcon,
} from "lucide-react";
import type { Payment } from "../../payment-history/mockPayments";

type PaymentCardProps = {
  payment: Payment;
  index: number;
};

const statusConfig: Record<
  Payment["status"],
  { label: string; bg: string; text: string; ring: string }
> = {
  paid: {
    label: "Paid",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    ring: "ring-emerald-200",
  },
  pending: {
    label: "Pending",
    bg: "bg-amber-50",
    text: "text-amber-700",
    ring: "ring-amber-200",
  },
  failed: {
    label: "Failed",
    bg: "bg-rose-50",
    text: "text-rose-700",
    ring: "ring-rose-200",
  },
};

const methodIcons: Record<string, string> = {
  UPI: "💳",
  Cash: "💵",
  "Credit Card": "💳",
  "Net Banking": "🏦",
};

type ActionButtonProps = {
  icon: LucideIcon;
  label: string;
};

function ActionButton({ icon: Icon, label }: ActionButtonProps) {
  return (
    <button
      type="button"
      className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-600 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
    >
      <Icon className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

export function PaymentCard({ payment, index }: PaymentCardProps) {
  const status = statusConfig[payment.status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.04, ease: "easeOut" }}
      className="rounded-[1.6rem] border border-slate-200 bg-white p-4 shadow-[0_10px_35px_rgba(15,23,42,0.06)] sm:p-5"
    >
      <div className="flex items-start justify-between gap-3">
        {/* Left: avatar + info */}
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-500 text-sm font-semibold text-white shadow-md">
            {payment.avatar}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">
              {payment.memberName}
            </p>
            <p className="text-xs text-slate-500">{payment.plan} Plan</p>
          </div>
        </div>

        {/* Right: amount + status */}
        <div className="shrink-0 text-right">
          <p className="text-lg font-bold tracking-tight text-slate-900">
            ₹{payment.amount.toLocaleString("en-US")}
          </p>
          <span
            className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ${status.bg} ${status.text} ${status.ring}`}
          >
            {status.label}
          </span>
        </div>
      </div>

      {/* Middle: method + date */}
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <span className="text-xs">{methodIcons[payment.method] ?? "💳"}</span>
          {payment.method}
        </span>
        <span>•</span>
        <span>{payment.date}</span>
      </div>

      {/* Actions */}
      <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3">
        <ActionButton icon={Eye} label="View" />
        <ActionButton icon={Download} label="Download" />
        <ActionButton icon={Share2} label="Share" />
      </div>
    </motion.div>
  );
}