"use client";

import { motion } from "framer-motion";
import { zodResolver } from "@hookform/resolvers/zod";
import { DollarSign, FileText, ArrowLeft, CalendarDays, Loader2, Receipt, UserRound } from "lucide-react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useState, use, useEffect } from "react";
import { z } from "zod";
import { Toaster, toast } from "sonner";
import { AppHeader } from "@/app/components/AppHeader";
import { BottomNavigation } from "@/app/components/BottomNavigation";
import { FormField } from "@/app/components/FormField";
import { PageContainer } from "@/app/components/PageContainer";

interface PaymentData {
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
}

const paymentModeOptions = [
  { value: "CASH", label: "Cash" },
  { value: "UPI", label: "UPI" },
  { value: "CARD", label: "Card" },
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "CHEQUE", label: "Cheque" },
];

const paymentStatusOptions = [
  { value: "PAID", label: "Paid" },
  { value: "PARTIAL", label: "Partial" },
  { value: "PENDING", label: "Pending" },
  { value: "FAILED", label: "Failed" },
  { value: "REFUNDED", label: "Refunded" },
];

const schema = z.object({
  amount: z.string().min(1, "Amount is required").refine(
    (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
    "Amount must be a valid number greater than 0"
  ),
  paymentMode: z.string().min(1, "Select a payment mode"),
  paymentStatus: z.string().min(1, "Select a payment status"),
  paymentDate: z.string().min(1, "Payment date is required"),
  transactionId: z.string().optional().or(z.literal("")),
  remarks: z.string().optional().or(z.literal("")),
});

type FormValues = z.infer<typeof schema>;

export default function EditPaymentPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [paymentNotFound, setPaymentNotFound] = useState(false);
  const [payment, setPayment] = useState<PaymentData | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // Unwrap params as required by Next.js 16 App Router (client component)
  const { id } = use(params);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      amount: "",
      paymentMode: "",
      paymentStatus: "PAID",
      paymentDate: new Date().toISOString().split("T")[0],
      transactionId: "",
      remarks: "",
    },
  });

  // Fetch payment data on mount
  useEffect(() => {
    async function fetchPayment() {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/payments/${id}`);
        if (!response.ok) {
          setPaymentNotFound(true);
          return;
        }
        const data = await response.json();
        const p: PaymentData = data.payment;
        setPayment(p);

        // Format date for input
        const formatDate = (dateStr: string) => {
          const d = new Date(dateStr);
          return d.toISOString().split("T")[0];
        };

        reset({
          amount: String(p.amount),
          paymentMode: p.paymentMode,
          paymentStatus: p.paymentStatus,
          paymentDate: formatDate(p.paymentDate),
          transactionId: p.transactionId || "",
          remarks: p.remarks || "",
        });
      } catch (error) {
        console.error("Failed to load payment:", error);
        toast.error("Failed to load payment data");
        setPaymentNotFound(true);
      } finally {
        setIsLoading(false);
      }
    }
    fetchPayment();
  }, [id, reset]);

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

  const onSubmit = async (values: FormValues) => {
    if (submitted || isSaving) return;
    setSubmitted(true);
    setIsSaving(true);

    try {
      const response = await fetch(`/api/payments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(values.amount),
          paymentMode: values.paymentMode,
          paymentStatus: values.paymentStatus,
          paymentDate: values.paymentDate,
          transactionId: values.transactionId?.trim() || undefined,
          remarks: values.remarks?.trim() || undefined,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || "Failed to update payment");
      }

      toast.success("Payment updated successfully!", {
        description: `₹${parseFloat(values.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })} payment updated for ${payment?.memberName || "member"}.`,
      });

      router.push("/payment-history");
    } catch (error) {
      toast.error("Failed to update payment", {
        description: error instanceof Error ? error.message : "Please try again",
      });
      setSubmitted(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <Toaster position="top-right" richColors closeButton />
        <AppHeader title="Edit Payment" />
        <PageContainer>
          <div className="flex flex-col items-center justify-center py-32">
            <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
            <p className="mt-4 text-base font-semibold text-slate-300">Loading payment data...</p>
          </div>
        </PageContainer>
        <BottomNavigation />
      </div>
    );
  }

  if (paymentNotFound) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <Toaster position="top-right" richColors closeButton />
        <AppHeader title="Edit Payment" />
        <PageContainer>
          <div className="flex flex-col items-center justify-center py-32">
            <p className="text-base font-semibold text-slate-300">Payment not found</p>
            <button
              onClick={() => router.back()}
              className="mt-4 flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              <ArrowLeft className="h-4 w-4" />
              Go Back
            </button>
          </div>
        </PageContainer>
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Toaster position="top-right" richColors closeButton />
      <AppHeader title="Edit Payment" />

      <PageContainer>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-4 py-4"
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-700 bg-slate-900/70 text-slate-300 transition hover:border-slate-600 hover:bg-slate-800 hover:text-slate-100"
              aria-label="Go back"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <p className="text-2xl font-semibold tracking-tight text-slate-100">Edit Payment</p>
              <p className="mt-1 text-sm text-slate-500">Update payment details.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            {/* ═══════════════════════════════════════════
                MEMBER & MEMBERSHIP SUMMARY SECTION
                ═══════════════════════════════════════════ */}
            {payment && (
              <motion.section
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="rounded-[1.6rem] border border-slate-700/60 bg-slate-900/70 p-4 shadow-[0_10px_35px_rgba(2,6,23,0.4)] sm:p-5"
              >
                <div className="mb-4 flex items-center gap-2">
                  <div className="rounded-2xl bg-emerald-600/10 p-2 text-emerald-400">
                    <UserRound className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-base font-semibold text-slate-100">Member & Membership</p>
                    <p className="text-sm text-slate-500">Original payment details (read-only)</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Member</p>
                      <p className="mt-1.5 text-base font-semibold text-slate-100">{payment.memberName}</p>
                      <p className="mt-0.5 text-sm text-slate-500">{payment.memberPhone}</p>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-500 text-xs font-semibold text-white">
                      {payment.avatar}
                    </div>
                  </div>
                </div>

                {payment.membershipStartDate && payment.membershipEndDate && (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Plan</p>
                      <p className="mt-1.5 text-sm font-medium text-slate-100">{payment.plan}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Duration</p>
                      <p className="mt-1.5 text-sm font-medium text-slate-100">{payment.planDurationInDays} days</p>
                    </div>
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Start Date</p>
                      <p className="mt-1.5 text-sm font-medium text-slate-100">{formatDate(payment.membershipStartDate)}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">End Date</p>
                      <p className="mt-1.5 text-sm font-medium text-slate-100">{formatDate(payment.membershipEndDate)}</p>
                    </div>
                    {payment.membershipAmount !== null && (
                      <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Plan Amount</p>
                        <p className="mt-1.5 text-sm font-medium text-slate-100">{formatCurrency(payment.membershipAmount)}</p>
                      </div>
                    )}
                    {payment.membershipDiscount !== null && (
                      <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Discount</p>
                        <p className="mt-1.5 text-sm font-medium text-slate-100">{formatCurrency(payment.membershipDiscount)}</p>
                      </div>
                    )}
                    {payment.membershipFinalAmount !== null && (
                      <div className="rounded-2xl border border-blue-900/40 bg-blue-950/30 p-4 sm:col-span-2">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-blue-400">Final Amount</p>
                        <p className="mt-1.5 text-lg font-bold text-blue-200">{formatCurrency(payment.membershipFinalAmount)}</p>
                      </div>
                    )}
                  </div>
                )}
              </motion.section>
            )}

            {/* ═══════════════════════════════════════════
                PAYMENT DETAILS SECTION
                ═══════════════════════════════════════════ */}
            <motion.section
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="rounded-[1.6rem] border border-slate-700/60 bg-slate-900/70 p-4 shadow-[0_10px_35px_rgba(2,6,23,0.4)] sm:p-5"
            >
              <div className="mb-4 flex items-center gap-2">
                <div className="rounded-2xl bg-blue-600/10 p-2 text-blue-400">
                  <DollarSign className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-base font-semibold text-slate-100">Payment Details</p>
                  <p className="text-sm text-slate-500">Amount, mode, and status</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField label="Amount" name="amount" required error={errors.amount?.message}>
                  <div className="flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-950/70 px-3 py-2.5 focus-within:border-blue-500 focus-within:bg-slate-900">
                    <DollarSign className="h-4 w-4 text-slate-500" />
                    <span className="text-sm font-medium text-slate-400">₹</span>
                    <input
                      id="amount"
                      type="number"
                      step="0.01"
                      {...register("amount")}
                      className="w-full border-none bg-transparent text-sm text-slate-100 outline-none"
                      placeholder="0.00"
                    />
                  </div>
                </FormField>

                <FormField label="Payment Mode" name="paymentMode" required error={errors.paymentMode?.message}>
                  <select
                    id="paymentMode"
                    {...register("paymentMode")}
                    className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:border-blue-500 focus:bg-slate-900"
                  >
                    <option value="">Select payment mode</option>
                    {paymentModeOptions.map((mode) => (
                      <option key={mode.value} value={mode.value}>
                        {mode.label}
                      </option>
                    ))}
                  </select>
                </FormField>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <FormField label="Payment Status" name="paymentStatus" required error={errors.paymentStatus?.message}>
                  <select
                    id="paymentStatus"
                    {...register("paymentStatus")}
                    className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:border-blue-500 focus:bg-slate-900"
                  >
                    <option value="">Select payment status</option>
                    {paymentStatusOptions.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Payment Date" name="paymentDate" required error={errors.paymentDate?.message}>
                  <div className="flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-950/70 px-3 py-2.5 focus-within:border-blue-500 focus-within:bg-slate-900">
                    <CalendarDays className="h-4 w-4 text-slate-500" />
                    <input
                      id="paymentDate"
                      type="date"
                      {...register("paymentDate")}
                      className="w-full border-none bg-transparent text-sm text-slate-100 outline-none"
                    />
                  </div>
                </FormField>
              </div>

              <div className="mt-4">
                <FormField
                  label="Transaction ID"
                  name="transactionId"
                  hint="Optional — receipt number, UPI reference, cheque number, etc."
                  error={errors.transactionId?.message}
                >
                  <div className="flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-950/70 px-3 py-2.5 focus-within:border-blue-500 focus-within:bg-slate-900">
                    <Receipt className="h-4 w-4 text-slate-500" />
                    <input
                      id="transactionId"
                      type="text"
                      {...register("transactionId")}
                      className="w-full border-none bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500"
                      placeholder="E.g., TXN123456789"
                    />
                  </div>
                </FormField>
              </div>
            </motion.section>

            {/* ═══════════════════════════════════════════
                REMARKS SECTION
                ═══════════════════════════════════════════ */}
            <motion.section
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.25 }}
              className="rounded-[1.6rem] border border-slate-700/60 bg-slate-900/70 p-4 shadow-[0_10px_35px_rgba(2,6,23,0.4)] sm:p-5"
            >
              <div className="mb-4 flex items-center gap-2">
                <div className="rounded-2xl bg-blue-600/10 p-2 text-blue-400">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-base font-semibold text-slate-100">Additional Notes</p>
                  <p className="text-sm text-slate-500">Optional remarks</p>
                </div>
              </div>

              <FormField
                label="Remarks"
                name="remarks"
                hint="Any notes or comments about this payment"
                error={errors.remarks?.message}
              >
                <div className="flex items-start gap-2 rounded-2xl border border-slate-700 bg-slate-950/70 px-3 py-2.5 focus-within:border-blue-500 focus-within:bg-slate-900">
                  <FileText className="mt-0.5 h-4 w-4 text-slate-500" />
                  <textarea
                    id="remarks"
                    {...register("remarks")}
                    className="min-h-[88px] w-full resize-none border-none bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500"
                    placeholder="E.g., Payment for membership renewal, advance payment, etc."
                  />
                </div>
              </FormField>
            </motion.section>

            {/* ═══════════════════════════════════════════
                ACTION BUTTONS
                ═══════════════════════════════════════════ */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
              className="flex flex-col-reverse gap-3 rounded-[1.6rem] border border-slate-700/60 bg-slate-900/70 p-4 shadow-[0_10px_35px_rgba(2,6,23,0.4)] sm:flex-row sm:justify-end"
            >
              <button
                type="button"
                onClick={handleCancel}
                disabled={isSaving}
                className="rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:border-slate-600 hover:text-slate-100 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:opacity-50"
              >
                {isSaving ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving Changes...
                  </span>
                ) : (
                  "Save Changes"
                )}
              </button>
            </motion.div>
          </form>
        </motion.div>
      </PageContainer>

      <BottomNavigation />
    </div>
  );
}