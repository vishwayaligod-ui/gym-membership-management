"use client";

import { motion } from "framer-motion";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarDays, ArrowLeft, FileText, Tag, DollarSign, Percent, AlertCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useState, useMemo, use, useEffect } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { AppHeader } from "@/app/components/AppHeader";
import { FormField } from "@/app/components/FormField";
import { PageContainer } from "@/app/components/PageContainer";

interface EditRenewalData {
  id: string;
  name: string;
  plan: string;
  phone: string;
  expiryDate: string;
  fee: number;
  avatar: string;
  planId: string;
  amount: number;
  discount: number;
  finalAmount: number;
  startDate: string;
  endDate: string;
}

const schema = z.object({
  memberName: z.string().min(1, "Member name is required"),
  membershipPlan: z.string().min(1, "Membership plan is required"),
  duration: z.string().min(1, "Select a duration"),
  startDate: z.string().min(1, "Start date is required"),
  renewalAmount: z.string().min(1, "Renewal amount is required").refine(
    (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
    "Amount must be a valid number greater than 0"
  ),
  discount: z.string().optional(),
  paymentMethod: z.string().min(1, "Select a payment method"),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const durationMonths: Record<string, number> = {
  "1 Month": 1,
  "3 Months": 3,
  "6 Months": 6,
  "12 Months": 12,
};

const paymentMethods = [
  { value: "Cash", label: "💵 Cash", icon: "💵" },
  { value: "UPI", label: "📱 UPI", icon: "📱" },
  { value: "Card", label: "💳 Card", icon: "💳" },
];

function addMonthsToDate(dateStr: string, months: number): string {
  const date = new Date(dateStr);
  date.setMonth(date.getMonth() + months);
  
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = monthNames[date.getMonth()];
  const day = date.getDate();
  const year = date.getFullYear();
  return `${month} ${day}, ${year}`;
}

function convertInputFormatToDate(inputDate: string): string {
  const months = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const [year, month, day] = inputDate.split("-");
  const monthName = months[parseInt(month)];
  return `${monthName} ${parseInt(day)}, ${year}`;
}

export default function EditRenewalPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [renewal, setRenewal] = useState<EditRenewalData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { id } = use(params);

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

  // Determine duration based on plan and defaults
  const defaultDuration = "3 Months";
  const defaultAmount = renewal?.fee || 0;
  const defaultDiscount = Math.floor(defaultAmount * 0.1);
  const paymentMethodsList = ["Cash", "UPI", "Card"];
  const defaultPaymentMethod = paymentMethodsList[0];

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      memberName: "",
      membershipPlan: "",
      duration: defaultDuration,
      startDate: new Date().toISOString().split("T")[0],
      renewalAmount: "",
      discount: "",
      paymentMethod: defaultPaymentMethod,
      notes: "",
    },
  });

  // Reset form when renewal data loads
  useEffect(() => {
    if (renewal) {
      reset({
        memberName: renewal.name,
        membershipPlan: renewal.plan,
        duration: defaultDuration,
        startDate: new Date().toISOString().split("T")[0],
        renewalAmount: renewal.amount.toString(),
        discount: renewal.discount.toString(),
        paymentMethod: defaultPaymentMethod,
        notes: `Renewal of ${renewal.plan} membership for ${renewal.name}`,
      });
    }
  }, [renewal, reset, defaultDuration, defaultPaymentMethod]);

  const duration = watch("duration");
  const startDate = watch("startDate");
  const renewalAmountStr = watch("renewalAmount");
  const discountStr = watch("discount");

  // Calculate end date
  const endDate = useMemo(() => {
    if (!startDate || !duration) return "";
    const durationMonthsValue = durationMonths[duration] || 0;
    const startDateObj = new Date(startDate);
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = monthNames[startDateObj.getMonth()];
    const day = startDateObj.getDate();
    const year = startDateObj.getFullYear();
    const currentFormatDate = `${month} ${day}, ${year}`;
    return addMonthsToDate(currentFormatDate, durationMonthsValue);
  }, [startDate, duration]);

  // Calculate final amount
  const finalAmount = useMemo(() => {
    if (!renewalAmountStr) return 0;
    const amount = parseFloat(renewalAmountStr);
    const discount = discountStr ? parseFloat(discountStr) : 0;
    return Math.max(0, amount - discount);
  }, [renewalAmountStr, discountStr]);

  const onSubmit = async (values: FormValues) => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/renewals/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: renewal?.planId,
          startDate: values.startDate,
          endDate: endDate,
          amount: parseFloat(values.renewalAmount),
          discount: values.discount ? parseFloat(values.discount) : 0,
          finalAmount: finalAmount,
          paymentMethod: values.paymentMethod,
          notes: values.notes || "",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update renewal");
      }

      toast.success("Renewal updated successfully!", {
        description: `${renewal?.name}'s renewal updated for ${duration}.`,
      });

      router.push(`/renewals/${id}`);
    } catch (error) {
      toast.error("Failed to update renewal", {
        description: error instanceof Error ? error.message : "Please try again",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  if (isLoading) {
    return (
      <div>
        <AppHeader title="Edit Renewal" />
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
        <AppHeader title="Edit Renewal" />
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

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,_#f5f8ff_0%,_#eef5ff_100%)] text-slate-900">
      <AppHeader title="Edit Renewal" />

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
              <p className="text-2xl font-semibold tracking-tight text-slate-950">Edit Renewal</p>
              <p className="mt-1 text-sm text-slate-500">Update renewal details</p>
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
                  <Tag className="h-4 w-4" />
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

            {/* Renewal Details Section */}
            <motion.section
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.15 }}
              className="rounded-[1.6rem] border border-slate-200 bg-white p-4 shadow-[0_10px_35px_rgba(15,23,42,0.06)] sm:p-5"
            >
              <div className="mb-4 flex items-center gap-2">
                <div className="rounded-2xl bg-blue-600/10 p-2 text-blue-600">
                  <CalendarDays className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-base font-semibold text-slate-900">Renewal Details</p>
                  <p className="text-sm text-slate-500">Plan and duration</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField label="Duration" name="duration" required error={errors.duration?.message}>
                  <select
                    {...register("duration")}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:bg-white"
                  >
                    <option value="">Select duration</option>
                    <option value="1 Month">1 Month</option>
                    <option value="3 Months">3 Months</option>
                    <option value="6 Months">6 Months</option>
                    <option value="12 Months">12 Months</option>
                  </select>
                </FormField>

                <FormField label="Start Date" name="startDate" required>
                  <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus-within:border-blue-500 focus-within:bg-white">
                    <CalendarDays className="h-4 w-4 text-slate-400" />
                    <input
                      type="date"
                      {...register("startDate")}
                      className="w-full border-none bg-transparent text-sm outline-none"
                    />
                  </div>
                </FormField>
              </div>

              <div className="grid gap-4 md:grid-cols-2 pt-4">
                <FormField label="Start Date Display" name="startDateDisplay" hint="For reference">
                  <input
                    type="text"
                    readOnly
                    value={startDate ? convertInputFormatToDate(startDate) : ""}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-600 outline-none"
                  />
                </FormField>

                <FormField label="End Date" name="endDate" hint="Auto-calculated from duration">
                  <input
                    type="text"
                    readOnly
                    value={endDate}
                    className="w-full rounded-2xl border border-slate-200 bg-blue-50 px-3 py-2.5 text-sm text-blue-600 outline-none font-medium"
                  />
                </FormField>
              </div>
            </motion.section>

            {/* Payment Section */}
            <motion.section
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="rounded-[1.6rem] border border-slate-200 bg-white p-4 shadow-[0_10px_35px_rgba(15,23,42,0.06)] sm:p-5"
            >
              <div className="mb-4 flex items-center gap-2">
                <div className="rounded-2xl bg-blue-600/10 p-2 text-blue-600">
                  <DollarSign className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-base font-semibold text-slate-900">Payment Information</p>
                  <p className="text-sm text-slate-500">Amount and payment method</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  label="Renewal Amount"
                  name="renewalAmount"
                  required
                  error={errors.renewalAmount?.message}
                >
                  <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus-within:border-blue-500 focus-within:bg-white">
                    <DollarSign className="h-4 w-4 text-slate-400" />
                    <span className="text-sm font-medium text-slate-600">₹</span>
                    <input
                      type="number"
                      step="0.01"
                      {...register("renewalAmount")}
                      className="w-full border-none bg-transparent text-sm outline-none"
                    />
                  </div>
                </FormField>

                <FormField label="Discount" name="discount" hint="Optional">
                  <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus-within:border-blue-500 focus-within:bg-white">
                    <Percent className="h-4 w-4 text-slate-400" />
                    <span className="text-sm font-medium text-slate-600">₹</span>
                    <input
                      type="number"
                      step="0.01"
                      {...register("discount")}
                      className="w-full border-none bg-transparent text-sm outline-none"
                    />
                  </div>
                </FormField>
              </div>

              {/* Final Amount Display */}
              <div className="mt-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-600">Final Amount</p>
                  <p className="text-2xl font-bold text-blue-600">₹{finalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
              </div>

              {/* Payment Method Selection */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-slate-700">
                  Payment Method
                  <span className="ml-1 text-blue-600">*</span>
                </label>
                <div className="mt-2 grid gap-3 sm:grid-cols-3">
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
                hint="Any special conditions or remarks"
                error={errors.notes?.message}
              >
                <div className="flex items-start gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus-within:border-blue-500 focus-within:bg-white">
                  <FileText className="mt-0.5 h-4 w-4 text-slate-400" />
                  <textarea
                    {...register("notes")}
                    className="min-h-[88px] w-full resize-none border-none bg-transparent text-sm outline-none"
                    placeholder="E.g., Early renewal, special offer applied, etc."
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
                {isSaving ? "Updating..." : "Update Renewal"}
              </button>
            </motion.div>
          </form>
        </motion.div>
      </PageContainer>

    </div>
  );
}