"use client";

import { motion } from "framer-motion";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarDays, CreditCard, FileText, User, Wallet, DollarSign, ArrowLeft, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { AppHeader } from "@/app/components/AppHeader";
import { BottomNavigation } from "@/app/components/BottomNavigation";
import { FormField } from "@/app/components/FormField";
import { PageContainer } from "@/app/components/PageContainer";
import { mockPayments, type PaymentStatus } from "@/app/payment-history/mockPayments";

const schema = z.object({
  memberName: z.string().min(1, "Member name is required"),
  membershipPlan: z.string().min(1, "Membership plan is required"),
  amount: z.string().min(1, "Amount is required").refine(
    (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
    "Amount must be a valid number greater than 0"
  ),
  paymentMethod: z.string().min(1, "Select a payment method"),
  paymentDate: z.string().min(1, "Payment date is required"),
  paymentStatus: z.string().min(1, "Select payment status"),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const paymentMethods = [
  { value: "Cash", label: "💵 Cash", icon: "💵" },
  { value: "UPI", label: "📱 UPI", icon: "📱" },
  { value: "Card", label: "💳 Card", icon: "💳" },
  { value: "Credit Card", label: "💳 Credit Card", icon: "💳" },
  { value: "Net Banking", label: "🏦 Net Banking", icon: "🏦" },
];

const paymentStatuses = [
  { value: "paid", label: "✓ Paid", icon: CheckCircle2 },
  { value: "pending", label: "⏱ Pending", icon: Clock },
  { value: "failed", label: "✕ Failed", icon: AlertCircle },
];

function convertDateToInputFormat(dateStr: string): string {
  // Convert "Jul 17, 2026" to "2026-07-17"
  const months: Record<string, string> = {
    Jan: "01", Feb: "02", Mar: "03", Apr: "04",
    May: "05", Jun: "06", Jul: "07", Aug: "08",
    Sep: "09", Oct: "10", Nov: "11", Dec: "12",
  };
  const parts = dateStr.split(" ");
  const month = months[parts[0]];
  const day = parts[1].replace(",", "").padStart(2, "0");
  const year = parts[2];
  return `${year}-${month}-${day}`;
}

function convertInputFormatToDate(inputDate: string): string {
  // Convert "2026-07-17" to "Jul 17, 2026"
  const months = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const [year, month, day] = inputDate.split("-");
  const monthName = months[parseInt(month)];
  return `${monthName} ${parseInt(day)}, ${year}`;
}

export default function EditPaymentPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  const payment = mockPayments.find((p) => p.id === parseInt(params.id));

  if (!payment) {
    return (
      <div>
        <AppHeader title="Edit Payment" />
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

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      memberName: payment.memberName,
      membershipPlan: payment.plan,
      amount: payment.amount.toString(),
      paymentMethod: payment.method,
      paymentDate: convertDateToInputFormat(payment.date),
      paymentStatus: payment.status,
      notes: `Monthly subscription renewal for ${payment.memberName}`,
    },
  });

  const onSubmit = async (values: FormValues) => {
    setIsSaving(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 800));

      console.log("Payment updated:", {
        ...values,
        amount: parseFloat(values.amount),
        date: convertInputFormatToDate(values.paymentDate),
      });

      toast.success("Payment updated successfully!", {
        description: `₹${parseFloat(values.amount).toLocaleString()} from ${values.memberName}`,
      });

      // Navigate back to payment details
      router.push(`/payment-history/${payment.id}`);
    } catch (error) {
      toast.error("Failed to update payment", {
        description: "Please try again",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,_#f5f8ff_0%,_#eef5ff_100%)] text-slate-900">
      <AppHeader title="Edit Payment" />

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
              <p className="text-2xl font-semibold tracking-tight text-slate-950">Edit Payment</p>
              <p className="mt-1 text-sm text-slate-500">Update payment details</p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Member Information Section - Read Only */}
            <motion.section
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="rounded-[1.6rem] border border-slate-200 bg-white p-4 shadow-[0_10px_35px_rgba(15,23,42,0.06)] sm:p-5"
            >
              <div className="mb-4 flex items-center gap-2">
                <div className="rounded-2xl bg-blue-600/10 p-2 text-blue-600">
                  <User className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-base font-semibold text-slate-900">Member Information</p>
                  <p className="text-sm text-slate-500">Read-only details</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField label="Member Name" name="memberName">
                  <input
                    id="memberName"
                    {...register("memberName")}
                    readOnly
                    className="w-full rounded-2xl border border-slate-200 bg-slate-100 px-3 py-2.5 text-sm text-slate-600 outline-none"
                  />
                </FormField>

                <FormField label="Membership Plan" name="membershipPlan">
                  <input
                    id="membershipPlan"
                    {...register("membershipPlan")}
                    readOnly
                    className="w-full rounded-2xl border border-slate-200 bg-slate-100 px-3 py-2.5 text-sm text-slate-600 outline-none"
                  />
                </FormField>
              </div>
            </motion.section>

            {/* Payment Details Section */}
            <motion.section
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.15 }}
              className="rounded-[1.6rem] border border-slate-200 bg-white p-4 shadow-[0_10px_35px_rgba(15,23,42,0.06)] sm:p-5"
            >
              <div className="mb-4 flex items-center gap-2">
                <div className="rounded-2xl bg-blue-600/10 p-2 text-blue-600">
                  <CreditCard className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-base font-semibold text-slate-900">Payment Information</p>
                  <p className="text-sm text-slate-500">Amount, method, and date</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField label="Amount" name="amount" required error={errors.amount?.message}>
                  <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus-within:border-blue-500 focus-within:bg-white">
                    <DollarSign className="h-4 w-4 text-slate-400" />
                    <span className="text-sm font-medium text-slate-600">₹</span>
                    <input
                      id="amount"
                      type="number"
                      step="0.01"
                      {...register("amount")}
                      className="w-full border-none bg-transparent text-sm outline-none"
                    />
                  </div>
                </FormField>

                <FormField
                  label="Payment Date"
                  name="paymentDate"
                  required
                  error={errors.paymentDate?.message}
                >
                  <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus-within:border-blue-500 focus-within:bg-white">
                    <CalendarDays className="h-4 w-4 text-slate-400" />
                    <input
                      id="paymentDate"
                      type="date"
                      {...register("paymentDate")}
                      className="w-full border-none bg-transparent text-sm outline-none"
                    />
                  </div>
                </FormField>
              </div>

              {/* Payment Method Selection */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-slate-700">
                  Payment Method
                  <span className="ml-1 text-blue-600">*</span>
                </label>
                <div className="mt-2 grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
                  {paymentMethods.map((method) => (
                    <label
                      key={method.value}
                      className="relative flex cursor-pointer items-center"
                    >
                      <input
                        type="radio"
                        value={method.value}
                        {...register("paymentMethod")}
                        className="sr-only"
                      />
                      <div className="w-full rounded-2xl border-2 border-slate-200 bg-slate-50 px-3 py-2 transition has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm">{method.icon}</span>
                          <span className="text-xs font-medium text-slate-900">
                            {method.label.split(" ").pop()}
                          </span>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
                {errors.paymentMethod && (
                  <p className="mt-2 text-sm text-rose-600">{errors.paymentMethod.message}</p>
                )}
              </div>
            </motion.section>

            {/* Payment Status Section */}
            <motion.section
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="rounded-[1.6rem] border border-slate-200 bg-white p-4 shadow-[0_10px_35px_rgba(15,23,42,0.06)] sm:p-5"
            >
              <div className="mb-4 flex items-center gap-2">
                <div className="rounded-2xl bg-blue-600/10 p-2 text-blue-600">
                  <Wallet className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-base font-semibold text-slate-900">Payment Status</p>
                  <p className="text-sm text-slate-500">Mark transaction status</p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {paymentStatuses.map((status) => {
                  const StatusIcon = status.icon;
                  return (
                    <label
                      key={status.value}
                      className="relative flex cursor-pointer items-center"
                    >
                      <input
                        type="radio"
                        value={status.value}
                        {...register("paymentStatus")}
                        className="sr-only"
                      />
                      <div className="w-full rounded-2xl border-2 border-slate-200 bg-slate-50 px-4 py-3 transition has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50">
                        <div className="flex items-center gap-2">
                          <StatusIcon className="h-4 w-4 text-slate-600" />
                          <span className="text-sm font-medium text-slate-900">
                            {status.label.split(" ").pop()}
                          </span>
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
              {errors.paymentStatus && (
                <p className="mt-2 text-sm text-rose-600">{errors.paymentStatus.message}</p>
              )}
            </motion.section>

            {/* Notes Section */}
            <motion.section
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.25 }}
              className="rounded-[1.6rem] border border-slate-200 bg-white p-4 shadow-[0_10px_35px_rgba(15,23,42,0.06)] sm:p-5"
            >
              <div className="mb-4 flex items-center gap-2">
                <div className="rounded-2xl bg-blue-600/10 p-2 text-blue-600">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-base font-semibold text-slate-900">Additional Notes</p>
                  <p className="text-sm text-slate-500">Optional details</p>
                </div>
              </div>

              <FormField
                label="Notes"
                name="notes"
                hint="Any additional information about this payment"
                error={errors.notes?.message}
              >
                <div className="flex items-start gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus-within:border-blue-500 focus-within:bg-white">
                  <FileText className="mt-0.5 h-4 w-4 text-slate-400" />
                  <textarea
                    id="notes"
                    {...register("notes")}
                    className="min-h-[88px] w-full resize-none border-none bg-transparent text-sm outline-none"
                    placeholder="E.g., 6-month prepayment, UPI reference ID, etc."
                  />
                </div>
              </FormField>
            </motion.section>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
              className="flex flex-col-reverse gap-3 rounded-[1.6rem] border border-slate-200 bg-white p-4 shadow-[0_10px_35px_rgba(15,23,42,0.06)] sm:flex-row sm:justify-end"
            >
              <button
                type="button"
                onClick={handleCancel}
                disabled={isSaving}
                className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-blue-200 hover:text-blue-600 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </motion.div>
          </form>
        </motion.div>
      </PageContainer>

      <BottomNavigation />
    </div>
  );
}
