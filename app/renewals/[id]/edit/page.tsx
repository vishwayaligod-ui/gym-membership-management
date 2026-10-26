"use client";

import { motion } from "framer-motion";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CalendarDays,
  ArrowLeft,
  DollarSign,
  AlertCircle,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useState, useMemo, use, useEffect } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { AppHeader } from "@/app/components/AppHeader";
import { FormField } from "@/app/components/FormField";
import { PageContainer } from "@/app/components/PageContainer";

interface MembershipPlanOption {
  id: string;
  name: string;
  durationInDays: number;
  price: number;
  description: string | null;
}

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

  const monthNames = [
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

  const month = monthNames[date.getMonth()];
  const day = date.getDate();
  const year = date.getFullYear();

  return `${month} ${day}, ${year}`;
}

function getDurationLabel(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return "3 Months";
  }

  const diffDays = Math.round(
    (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays <= 45) return "1 Month";
  if (diffDays <= 120) return "3 Months";
  if (diffDays <= 240) return "6 Months";
  return "12 Months";
}

function getPlanForDuration(
  plans: MembershipPlanOption[],
  duration: string
): MembershipPlanOption | null {
  const targetMonths = durationMonths[duration] || 0;
  if (!targetMonths) return null;

  const targetDays = targetMonths === 12 ? 365 : targetMonths * 30;

  return (
    plans.find((plan) => plan.durationInDays === targetDays) ||
    plans.find(
      (plan) =>
        Math.abs(plan.durationInDays - targetDays) <= 5
    ) ||
    null
  );
}

export default function EditRenewalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();

  const [isSaving, setIsSaving] = useState(false);
  const [renewal, setRenewal] = useState<EditRenewalData | null>(null);
  const [plans, setPlans] = useState<MembershipPlanOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);

  const { id } = use(params);

  useEffect(() => {
    async function fetchRenewal() {
      try {
        const response = await fetch(`/api/renewals/${id}`);

        if (!response.ok) {
          throw new Error("Not found");
        }

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

  useEffect(() => {
    async function fetchPlans() {
      try {
        const response = await fetch("/api/membership-plans");

        if (!response.ok) {
          throw new Error("Failed to fetch membership plans");
        }

        const data = await response.json();
        setPlans(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to fetch membership plans:", error);
        toast.error("Failed to load membership plans. Please refresh the page.");
      } finally {
        setIsLoadingPlans(false);
      }
    }

    void fetchPlans();
  }, []);

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
    setValue,
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

  useEffect(() => {
    if (renewal && !isLoadingPlans) {
      const initialDuration = getDurationLabel(
        renewal.startDate,
        renewal.endDate
      );
      const initialPlan = getPlanForDuration(plans, initialDuration);

      reset({
        memberName: renewal.name,
        membershipPlan: renewal.plan,
        duration: initialDuration,
        startDate: new Date().toISOString().split("T")[0],
        renewalAmount: (initialPlan?.price ?? renewal.amount).toString(),
        discount: renewal.discount.toString(),
        paymentMethod: defaultPaymentMethod,
        notes: `Renewal of ${renewal.plan} membership for ${renewal.name}`,
      });
    }
  }, [
    renewal,
    plans,
    isLoadingPlans,
    reset,
    defaultPaymentMethod,
  ]);

  const duration = watch("duration");
  const startDate = watch("startDate");
  const renewalAmountStr = watch("renewalAmount");
  const discountStr = watch("discount");
  const paymentMethod = watch("paymentMethod");

  const selectedDurationPlan = useMemo(
    () => getPlanForDuration(plans, duration),
    [plans, duration]
  );

  useEffect(() => {
    if (!renewal || !duration || !selectedDurationPlan) return;

    setValue(
      "renewalAmount",
      selectedDurationPlan.price.toString(),
      { shouldValidate: true, shouldDirty: true }
    );
  }, [
    renewal,
    duration,
    selectedDurationPlan,
    setValue,
  ]);

  const endDate = useMemo(() => {
    if (!startDate || !duration) return "";

    const durationMonthsValue = durationMonths[duration] || 0;
    const startDateObj = new Date(startDate);

    const monthNames = [
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

    const month = monthNames[startDateObj.getMonth()];
    const day = startDateObj.getDate();
    const year = startDateObj.getFullYear();

    const currentFormatDate = `${month} ${day}, ${year}`;

    return addMonthsToDate(currentFormatDate, durationMonthsValue);
  }, [startDate, duration]);

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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          planId: selectedDurationPlan?.id ?? renewal?.planId,
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

        throw new Error(
          errorData.error || "Failed to update renewal"
        );
      }

      toast.success("Renewal updated successfully!", {
        description: `${renewal?.name}'s renewal updated for ${duration}.`,
      });

      router.push("/renewals");
    } catch (error) {
      toast.error("Failed to update renewal", {
        description:
          error instanceof Error
            ? error.message
            : "Please try again",
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
      <div className="min-h-screen bg-slate-950 text-slate-100">
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
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <AppHeader title="Edit Renewal" />

        <PageContainer>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-32"
          >
            <AlertCircle className="h-12 w-12 text-slate-500" />

            <p className="mt-4 text-lg font-semibold text-slate-100">
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <AppHeader title="Edit Renewal" />

      <PageContainer>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-3 py-3"
        >
          {/* Compact Page Header */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => router.back()}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/60 text-slate-400 transition hover:border-blue-500/40 hover:text-blue-400"
              aria-label="Go back"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>

            <p className="text-lg font-semibold tracking-tight text-white">
              Edit Renewal
            </p>
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-3"
          >
            {/* Hidden read-only member fields – keep validation intact */}
            <input type="hidden" {...register("memberName")} />
            <input type="hidden" {...register("membershipPlan")} />

            {/* Renewal Details */}
            <section>
              <p className="flex items-center gap-1.5 text-base font-semibold text-slate-300">
                <CalendarDays className="h-4 w-4 text-blue-400" />
                Renewal Details
              </p>

              {/* Mobile: Duration + Start Date pair into two columns; desktop (md+) keeps the
                  exact previous 2-column grid and gaps (md:gap-3 / md:grid-cols-2). */}
              <div className="mt-2 grid grid-cols-2 gap-2.5 md:gap-3 md:grid-cols-2">
                <FormField
                  label="Duration"
                  name="duration"
                  required
                  error={errors.duration?.message}
                >
                  <select
                    id="duration"
                    {...register("duration")}
                    className="h-11 w-full rounded-xl border border-slate-800 bg-slate-950/70 px-3 text-sm text-slate-100 outline-none focus:border-blue-500 focus:bg-slate-950"
                  >
                    <option value="">Select duration</option>
                    <option value="1 Month">1 Month</option>
                    <option value="3 Months">3 Months</option>
                    <option value="6 Months">6 Months</option>
                    <option value="12 Months">12 Months</option>
                  </select>
                </FormField>

                <FormField
                  label="Start Date"
                  name="startDate"
                  required
                  error={errors.startDate?.message}
                >
                  <div className="flex h-11 items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/70 px-3 focus-within:border-blue-500 focus-within:bg-slate-950">
                    <CalendarDays className="h-4 w-4 shrink-0 text-slate-500" />

                    <input
                      id="startDate"
                      type="date"
                      {...register("startDate")}
                      className="min-w-0 flex-1 border-none bg-transparent text-sm text-slate-100 outline-none"
                    />
                  </div>
                </FormField>

              {/* Mobile: End Date stays full width (auto-calculated); desktop (md+) keeps its
                  single grid column */}
              <div className="col-span-2 md:col-span-1">
                <FormField
                  label="End Date"
                  name="endDate"
                  hint="Auto-calculated from duration"
                >
                  <div className="flex min-h-11 w-full items-center gap-2 rounded-xl border border-blue-500/50 bg-blue-500/10 px-3">
                    <CalendarDays className="h-4 w-4 shrink-0 text-blue-400" />

                    <span className="text-sm font-semibold text-blue-400">
                      {endDate}
                    </span>
                  </div>
                </FormField>
              </div>
              </div>
            </section>

            {/* Payment */}
            <section>
              <p className="flex items-center gap-1.5 text-base font-semibold text-slate-300">
                <DollarSign className="h-4 w-4 text-blue-400" />
                Payment
              </p>

              {/* Mobile: Renewal Amount + Discount pair into two columns; desktop (md+) keeps
                  the exact previous 2-column grid and gaps (md:gap-3 / md:grid-cols-2). */}
              <div className="mt-2 grid grid-cols-2 gap-2.5 md:gap-3 md:grid-cols-2">
                <FormField
                  label="Renewal Amount"
                  name="renewalAmount"
                  required
                  error={errors.renewalAmount?.message}
                >
                  <div className="flex h-11 items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/70 px-3 focus-within:border-blue-500 focus-within:bg-slate-950">
                    <span className="shrink-0 text-sm font-medium text-slate-400">
                      ₹
                    </span>

                    <input
                      id="renewalAmount"
                      type="number"
                      step="0.01"
                      inputMode="decimal"
                      {...register("renewalAmount")}
                      className="min-w-0 flex-1 border-none bg-transparent text-sm text-slate-100 outline-none"
                    />
                  </div>
                </FormField>

                <FormField
                  label="Discount"
                  name="discount"
                  hint="Optional"
                >
                  <div className="flex h-11 items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/70 px-3 focus-within:border-blue-500 focus-within:bg-slate-950">
                    <span className="shrink-0 text-sm font-medium text-slate-400">
                      ₹
                    </span>

                    <input
                      id="discount"
                      type="number"
                      step="0.01"
                      inputMode="decimal"
                      {...register("discount")}
                      className="min-w-0 flex-1 border-none bg-transparent text-sm text-slate-100 outline-none"
                    />
                  </div>
                </FormField>
              </div>

              {/* Final Amount */}
              <div className="mt-2.5 flex items-center justify-between rounded-xl border border-blue-500/70 bg-blue-600/20 px-3 py-2">
                <p className="text-sm font-medium text-slate-300">
                  Final Amount
                </p>

                <p className="text-xl font-bold tracking-tight text-blue-300">
                  ₹{finalAmount.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>

              {/* Payment Method */}
              <div className="mt-2.5">
                <label className="block text-sm font-medium text-slate-300">
                  Payment Method
                  <span className="ml-1 text-blue-400">*</span>
                </label>

                <div
                  className="mt-2 grid grid-cols-3 gap-2"
                  role="radiogroup"
                  aria-label="Payment Method"
                >
                  {paymentMethods.map((method) => {
                    const isSelected =
                      paymentMethod === method.value;

                    return (
                      <button
                        key={method.value}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        onClick={() => {
                          setValue(
                            "paymentMethod",
                            method.value,
                            {
                              shouldValidate: true,
                              shouldDirty: true,
                              shouldTouch: true,
                            }
                          );
                        }}
                        className={`flex min-h-11 w-full items-center justify-center gap-1 rounded-xl border text-sm font-medium transition active:scale-[0.97] ${
                          isSelected
                            ? "border-blue-500 bg-blue-500/15 text-blue-300"
                            : "border-slate-800 bg-slate-950/60 text-slate-200"
                        }`}
                      >
                        <span aria-hidden="true">{method.icon}</span>
                        <span>{method.label.split(" ").pop()}</span>
                      </button>
                    );
                  })}
                </div>

                {errors.paymentMethod && (
                  <p className="mt-2 text-sm text-rose-400">
                    {errors.paymentMethod.message}
                  </p>
                )}
              </div>
            </section>

            {/* Notes */}
            <FormField
              label="Notes"
              name="notes"
              hint="Optional"
              error={errors.notes?.message}
            >
              <textarea
                id="notes"
                {...register("notes")}
                rows={2}
                className="min-h-[68px] w-full resize-none rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-2.5 text-sm leading-6 text-slate-100 outline-none placeholder:text-slate-600 focus:border-blue-500 focus:bg-slate-950"
                placeholder="E.g., Early renewal, special offer applied, etc."
              />
            </FormField>

            {/* Action Buttons — Mobile: Cancel + Update Renewal in one 2-column row;
                desktop (sm+) keeps the exact previous flex-row / justify-end layout */}
            <div className="grid grid-cols-2 gap-2.5 sm:flex sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={handleCancel}
                disabled={isSaving}
                className="flex h-12 w-full items-center justify-center rounded-xl border border-slate-700 bg-slate-900/60 px-4 text-sm font-semibold text-slate-300 transition hover:border-blue-500/40 hover:text-blue-400 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className="flex h-12 w-full items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-700 disabled:opacity-50"
              >
                {isSaving ? "Updating..." : "Update Renewal"}
              </button>
            </div>
          </form>
        </motion.div>
      </PageContainer>
    </div>
  );
}