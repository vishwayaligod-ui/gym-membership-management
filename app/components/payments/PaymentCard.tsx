"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Download,
  Eye,
  Share2,
  type LucideIcon,
} from "lucide-react";
import type { Payment } from "../../payment-history/types";

type PaymentCardProps = {
  payment: Payment;
  index: number;
};

const statusConfig: Record<
  Payment["paymentStatus"],
  { label: string; bg: string; text: string; ring: string; dot: string }
> = {
  PAID: {
    label: "Paid",
    bg: "bg-emerald-900/30",
    text: "text-emerald-400",
    ring: "ring-emerald-900/50",
    dot: "bg-emerald-400",
  },
  PENDING: {
    label: "Pending",
    bg: "bg-amber-900/30",
    text: "text-amber-400",
    ring: "ring-amber-900/50",
    dot: "bg-amber-400",
  },
  FAILED: {
    label: "Failed",
    bg: "bg-rose-900/30",
    text: "text-rose-400",
    ring: "ring-rose-900/50",
    dot: "bg-rose-400",
  },
  PARTIAL: {
    label: "Partial",
    bg: "bg-amber-900/30",
    text: "text-amber-400",
    ring: "ring-amber-900/50",
    dot: "bg-amber-400",
  },
  REFUNDED: {
    label: "Refunded",
    bg: "bg-purple-900/30",
    text: "text-purple-400",
    ring: "ring-purple-900/50",
    dot: "bg-purple-400",
  },
};

const methodIcons: Record<string, string> = {
  UPI: "💳",
  CASH: "💵",
  CARD: "💳",
  BANK_TRANSFER: "🏦",
  CHEQUE: "💳",
};

type ActionButtonProps = {
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
};

function ActionButton({ icon: Icon, label, onClick }: ActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900/50 px-3.5 py-2 text-[12px] font-semibold text-slate-400 shadow-sm transition-all duration-200 hover:border-blue-500/40 hover:bg-blue-900/20 hover:text-blue-400"
    >
      <Icon className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

export function PaymentCard({ payment, index }: PaymentCardProps) {
  const router = useRouter();
  const status = statusConfig[payment.paymentStatus];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-xl border border-[#334155] bg-[#1E293B] shadow-sm transition-all duration-300 hover:border-slate-600/60 hover:bg-[#273449]"
    >
      {/* Top section: avatar + info + amount */}
      <div className="p-5 pb-3">
        <div className="flex items-start justify-between gap-3">
          {/* Left: avatar + info */}
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-500 text-sm font-semibold text-white shadow-md shadow-blue-600/15">
              {payment.avatar}
            </div>
            <div className="min-w-0">
              <p className="truncate text-[15px] font-semibold text-[#F8FAFC]">
                {payment.memberName}
              </p>
              <p className="mt-0.5 text-[13px] text-[#64748B]">{payment.plan} Plan</p>
            </div>
          </div>

          {/* Right: amount + status */}
          <div className="shrink-0 text-right">
            <p className="text-xl font-bold tracking-tight text-[#F8FAFC]">
              ₹{payment.amount.toLocaleString("en-US")}
            </p>
            <span
              className={`mt-1.5 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold ring-1 ${status.bg} ${status.text} ${status.ring}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
              {status.label}
            </span>
          </div>
        </div>

        {/* Middle: method + date */}
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-[#64748B]">
          <span className="flex items-center gap-1.5">
            <span className="text-xs">{methodIcons[payment.paymentMode] ?? "💳"}</span>
            {payment.paymentMode === "CASH" ? "Cash" : payment.paymentMode === "CARD" ? "Card" : payment.paymentMode === "UPI" ? "UPI" : payment.paymentMode === "BANK_TRANSFER" ? "Bank Transfer" : "Cheque"}
          </span>
          <span className="text-slate-600">•</span>
          <span>{payment.paymentDate}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="border-t border-[#334155] px-5 py-4">
        <div className="flex items-center gap-2">
          <ActionButton icon={Eye} label="View" onClick={() => router.push(`/payment-history/${payment.id}`)} />
          <ActionButton icon={Download} label="Download" />
          <ActionButton icon={Share2} label="Share" />
        </div>
      </div>
    </motion.div>
  );
}