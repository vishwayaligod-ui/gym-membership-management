export type PaymentStatus = "PAID" | "PARTIAL" | "PENDING" | "FAILED" | "REFUNDED";
export type PaymentMode = "CASH" | "UPI" | "CARD" | "BANK_TRANSFER" | "CHEQUE";

export type Payment = {
  id: string;
  memberId: string;
  membershipId: string;
  memberName: string;
  memberPhone: string;
  plan: string;
  planId: string;
  amount: number;
  paymentMode: PaymentMode;
  paymentStatus: PaymentStatus;
  transactionId: string;
  paymentDate: string;
  remarks: string;
  avatar: string;
  membershipStartDate: string | null;
  membershipEndDate: string | null;
  membershipAmount: number | null;
  membershipDiscount: number | null;
  membershipFinalAmount: number | null;
  createdAt: string;
  updatedAt: string;
};

export type PaymentsSummary = {
  todayRevenue: number;
  weeklyRevenue: number;
  monthlyRevenue: number;
  pendingCount: number;
  pendingAmount: number;
};

export type PaymentsResponse = {
  payments: Payment[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  summary: PaymentsSummary;
};

export const paymentStatusColors: Record<PaymentStatus, { bg: string; text: string; dot: string }> = {
  PAID: { bg: "bg-emerald-900/30", text: "text-emerald-400", dot: "bg-emerald-400" },
  PARTIAL: { bg: "bg-amber-900/30", text: "text-amber-400", dot: "bg-amber-400" },
  PENDING: { bg: "bg-yellow-900/30", text: "text-yellow-400", dot: "bg-yellow-400" },
  FAILED: { bg: "bg-red-900/30", text: "text-red-400", dot: "bg-red-400" },
  REFUNDED: { bg: "bg-purple-900/30", text: "text-purple-400", dot: "bg-purple-400" },
};

export const paymentModeLabels: Record<PaymentMode, string> = {
  CASH: "Cash",
  UPI: "UPI",
  CARD: "Card",
  BANK_TRANSFER: "Bank Transfer",
  CHEQUE: "Cheque",
};

export const paymentModeColors: Record<PaymentMode, string> = {
  CASH: "bg-gradient-to-r from-emerald-600/20 to-emerald-500/20 text-emerald-400 border-emerald-500/30",
  UPI: "bg-gradient-to-r from-blue-600/20 to-blue-500/20 text-blue-400 border-blue-500/30",
  CARD: "bg-gradient-to-r from-purple-600/20 to-purple-500/20 text-purple-400 border-purple-500/30",
  BANK_TRANSFER: "bg-gradient-to-r from-cyan-600/20 to-cyan-500/20 text-cyan-400 border-cyan-500/30",
  CHEQUE: "bg-gradient-to-r from-slate-600/20 to-slate-500/20 text-slate-400 border-slate-500/30",
};

export const paymentStatusFilters: Array<{ label: string; value: PaymentStatus | "All" }> = [
  { label: "All", value: "All" },
  { label: "Paid", value: "PAID" },
  { label: "Partial", value: "PARTIAL" },
  { label: "Pending", value: "PENDING" },
  { label: "Failed", value: "FAILED" },
  { label: "Refunded", value: "REFUNDED" },
];

export const paymentMethodFilters: Array<{ label: string; value: PaymentMode | "All" }> = [
  { label: "All", value: "All" },
  { label: "Cash", value: "CASH" },
  { label: "UPI", value: "UPI" },
  { label: "Card", value: "CARD" },
  { label: "Bank Transfer", value: "BANK_TRANSFER" },
  { label: "Cheque", value: "CHEQUE" },
];