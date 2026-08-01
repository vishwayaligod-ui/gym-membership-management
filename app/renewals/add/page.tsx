"use client";

import { motion } from "framer-motion";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarDays, Search, DollarSign, FileText, Percent, ArrowLeft, CheckCircle2, AlertCircle, Tag, CreditCard, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useState, useMemo, useEffect } from "react";
import { z } from "zod";
import { Toaster, toast } from "sonner";
import { AppHeader } from "@/app/components/AppHeader";

import { FormField } from "@/app/components/FormField";
import { PageContainer } from "@/app/components/PageContainer";

interface MemberOption {
  id: string;
  name: string;
  plan: string;
  phone: string;
  expiresOn: string;
  avatar: string;
  membershipId: string;
  planId: string;
}

interface MembershipPlanOption {
  id: string;
  name: string;
  durationInDays: number;
  price: number;
  description: string | null;
}

const schema = z.object({
  memberId: z.string().min(1, "Select a member"),
  newPlan: z.string().min(1, "Select a new plan"),
  duration: z.string().min(1, "Select a duration"),
  startDate: z.string().min(1, "Start date is required"),
  renewalAmount: z.string().min(1, "Renewal amount is required").refine(
    (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
    "Amount must be a valid number greater than 0"
  ),
  discount: z.string().optional().or(z.literal("")),
  paymentMethod: z.string().min(1, "Select a payment method"),
  notes: z.string().optional().or(z.literal("")),
});

type FormValues = z.infer<typeof schema>;

const defaultValues: FormValues = {
  memberId: "",
  newPlan: "",
  duration: "",
  startDate: new Date().toISOString().split("T")[0],
  renewalAmount: "",
  discount: "",
  paymentMethod: "Cash",
  notes: "",
};

const durationMonths: Record<string, number> = {
  "1 Month": 1,
  "3 Months": 3,
  "6 Months": 6,
  "12 Months": 12,
};

const paymentMethods = [
  { value: "Cash", label: "Cash", icon: "💵" },
  { value: "UPI", label: "UPI", icon: "📱" },
  { value: "Card", label: "Card", icon: "💳" },
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

function calculateDaysExtended(oldDate: string, newDate: string): number {
  const old = new Date(oldDate);
  const newD = new Date(newDate);
  const diffTime = Math.abs(newD.getTime() - old.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

export default function RenewMembershipPage() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);
  const [members, setMembers] = useState<MemberOption[]>([]);
  const [plans, setPlans] = useState<MembershipPlanOption[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(true);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);

  useEffect(() => {
    async function fetchMembers() {
      try {
        const response = await fetch("/api/renewals");
        if (!response.ok) throw new Error("Failed to fetch");
        const data = await response.json();
        const memberOptions: MemberOption[] = data.renewals.map((r: any) => ({
          id: r.id,
          name: r.name,
          plan: r.plan,
          phone: r.phone,
          expiresOn: r.expiryDate,
          avatar: r.avatar,
          membershipId: r.membershipId,
          planId: r.planId,
        }));
        setMembers(memberOptions);
      } catch (error) {
        console.error("Failed to fetch members:", error);
        toast.error("Failed to load members. Please refresh the page.");
      } finally {
        setIsLoadingMembers(false);
      }
    }

    async function fetchPlans() {
      try {
        const response = await fetch("/api/membership-plans");
        if (!response.ok) throw new Error("Failed to fetch plans");
        const data = await response.json();
        setPlans(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to fetch plans:", error);
        toast.error("Failed to load membership plans. Please refresh the page.");
      } finally {
        setIsLoadingPlans(false);
      }
    }

    void fetchMembers();
    void fetchPlans();
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const memberId = watch("memberId");
  const newPlan = watch("newPlan");
  const duration = watch("duration");
  const discountStr = watch("discount");
  const renewalAmountStr = watch("renewalAmount");
  const startDate = watch("startDate");

  const selectedMember = useMemo(
    () => members.find((member) => member.id === memberId) || null,
    [memberId, members]
  );

  const selectedPlan = useMemo(
    () => plans.find((plan) => plan.id === newPlan) || null,
    [newPlan, plans]
  );

  const filteredMembers = useMemo(
    () =>
      members.filter((member) => {
        const query = searchQuery.toLowerCase();
        return (
          member.name.toLowerCase().includes(query) ||
          member.phone.includes(query)
        );
      }),
    [searchQuery, members]
  );

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

  const finalAmount = useMemo(() => {
    if (!renewalAmountStr) return 0;
    const amount = parseFloat(renewalAmountStr);
    const discount = discountStr ? parseFloat(discountStr) : 0;
    return Math.max(0, amount - discount);
  }, [renewalAmountStr, discountStr]);

  const daysExtended = useMemo(() => {
    if (!selectedMember || !endDate) return 0;
    return calculateDaysExtended(selectedMember.expiresOn, endDate);
  }, [selectedMember, endDate]);

  const handleMemberSelect = (member: MemberOption) => {
    setValue("memberId", member.id, { shouldValidate: true });
    setSearchQuery(member.name);
    setShowMemberDropdown(false);
  };

  const onSubmit = async (values: FormValues) => {
    if (!selectedMember) {
      toast.error("Please select a member before renewing the membership.");
      return;
    }

    if (!selectedPlan) {
      toast.error("Please select a valid membership plan before saving.");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/renewals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          membershipId: selectedMember.membershipId,
          planId: selectedPlan.id,
          startDate: values.startDate,
          endDate,
          amount: Number.parseFloat(values.renewalAmount),
          discount: values.discount ? Number.parseFloat(values.discount) : 0,
          finalAmount,
          paymentMethod: values.paymentMethod,
          notes: values.notes?.trim() || "",
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || "Failed to renew membership");
      }

      toast.success("Membership renewed successfully!", {
        description: `${selectedMember.name} renewed for ${duration}. Invoice generated.`,
      });

      router.push("/renewals");
    } catch (error) {
      toast.error("Failed to renew membership", {
        description: error instanceof Error ? error.message : "Please try again",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Toaster position="top-right" richColors closeButton />
      <AppHeader title="Renew Membership" />

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
              <p className="text-2xl font-semibold tracking-tight text-slate-100">Renew Membership</p>
              <p className="mt-1 text-sm text-slate-500">Extend the member’s subscription with a new plan and payment.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <input type="hidden" {...register("memberId")} />

            <motion.section
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="rounded-[1.6rem] border border-slate-700/60 bg-slate-900/70 p-4 shadow-[0_10px_35px_rgba(2,6,23,0.4)] sm:p-5"
            >
              <div className="mb-4 flex items-center gap-2">
                <div className="rounded-2xl bg-blue-600/10 p-2 text-blue-400">
                  <Search className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-base font-semibold text-slate-100">Select Member</p>
                  <p className="text-sm text-slate-500">Find the member to renew</p>
                </div>
              </div>

              <div className="relative">
                <div className="flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-950/70 px-3 py-2.5">
                  <Search className="h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder={isLoadingMembers ? "Loading members..." : "Search by name or phone..."}
                    value={searchQuery}
                    onChange={(event) => {
                      setSearchQuery(event.target.value);
                      setShowMemberDropdown(true);
                    }}
                    onFocus={() => setShowMemberDropdown(true)}
                    className="w-full border-none bg-transparent text-sm text-slate-200 outline-none placeholder:text-slate-500"
                    disabled={isLoadingMembers}
                  />
                </div>

                {showMemberDropdown && filteredMembers.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute top-full left-0 right-0 z-10 mt-2 max-h-64 overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 shadow-lg"
                  >
                    {filteredMembers.map((member) => (
                      <button
                        key={member.id}
                        type="button"
                        onClick={() => handleMemberSelect(member)}
                        className="w-full border-b border-slate-800 px-4 py-3 text-left hover:bg-slate-800 last:border-b-0"
                      >
                        <p className="font-medium text-slate-100">{member.name}</p>
                        <p className="text-sm text-slate-500">{member.plan} · {member.phone}</p>
                      </button>
                    ))}
                  </motion.div>
                )}
              </div>

              {errors.memberId && (
                <p className="mt-2 text-sm text-rose-400">{errors.memberId.message}</p>
              )}
            </motion.section>

            {selectedMember && (
              <motion.section
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.15 }}
                className="rounded-[1.6rem] border border-slate-700/60 bg-slate-900/70 p-4 shadow-[0_10px_35px_rgba(2,6,23,0.4)] sm:p-5"
              >
                <div className="mb-4 flex items-center gap-2">
                  <div className="rounded-2xl bg-emerald-600/10 p-2 text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-base font-semibold text-slate-100">Member Summary</p>
                    <p className="text-sm text-slate-500">Current membership details</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Member</p>
                        <p className="mt-1.5 text-base font-semibold text-slate-100">{selectedMember.name}</p>
                      </div>
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-500 text-xs font-semibold text-white">
                        {selectedMember.avatar}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Current Plan</p>
                      <p className="mt-1.5 text-sm font-medium text-slate-100">{selectedMember.plan}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Current Expiry</p>
                      <p className="mt-1.5 text-sm font-medium text-slate-100">{selectedMember.expiresOn}</p>
                    </div>
                  </div>

                  {endDate && (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl border border-blue-900/40 bg-blue-950/30 p-4">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-blue-400">New Expiry</p>
                        <p className="mt-1.5 text-sm font-medium text-blue-200">{endDate}</p>
                      </div>
                      <div className="rounded-2xl border border-emerald-900/40 bg-emerald-950/30 p-4">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-400">Days Extended</p>
                        <p className="mt-1.5 text-sm font-medium text-emerald-200">{daysExtended} days</p>
                      </div>
                    </div>
                  )}
                </div>
              </motion.section>
            )}

            <motion.section
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="rounded-[1.6rem] border border-slate-700/60 bg-slate-900/70 p-4 shadow-[0_10px_35px_rgba(2,6,23,0.4)] sm:p-5"
            >
              <div className="mb-4 flex items-center gap-2">
                <div className="rounded-2xl bg-blue-600/10 p-2 text-blue-400">
                  <Tag className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-base font-semibold text-slate-100">Renewal Details</p>
                  <p className="text-sm text-slate-500">Plan and duration</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField label="New Plan" name="newPlan" required error={errors.newPlan?.message}>
                  <select
                    id="newPlan"
                    {...register("newPlan")}
                    className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:border-blue-500 focus:bg-slate-900"
                    disabled={isLoadingPlans}
                  >
                    <option value="">{isLoadingPlans ? "Loading plans..." : "Select a plan"}</option>
                    {plans.map((plan) => (
                      <option key={plan.id} value={plan.id}>
                        {plan.name} - ₹{plan.price.toLocaleString("en-IN")}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Duration" name="duration" required error={errors.duration?.message}>
                  <select
                    id="duration"
                    {...register("duration")}
                    className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:border-blue-500 focus:bg-slate-900"
                  >
                    <option value="">Select duration</option>
                    <option value="1 Month">1 Month</option>
                    <option value="3 Months">3 Months</option>
                    <option value="6 Months">6 Months</option>
                    <option value="12 Months">12 Months</option>
                  </select>
                </FormField>
              </div>

              <div className="grid gap-4 pt-4 md:grid-cols-2">
                <FormField label="Start Date" name="startDate" required error={errors.startDate?.message}>
                  <div className="flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-950/70 px-3 py-2.5 focus-within:border-blue-500 focus-within:bg-slate-900">
                    <CalendarDays className="h-4 w-4 text-slate-500" />
                    <input
                      id="startDate"
                      type="date"
                      {...register("startDate")}
                      className="w-full border-none bg-transparent text-sm text-slate-100 outline-none"
                    />
                  </div>
                </FormField>

                <FormField label="End Date" name="endDate" hint="Auto-calculated from duration">
                  <input
                    id="endDate"
                    type="text"
                    readOnly
                    value={endDate}
                    className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-3 py-2.5 text-sm text-slate-400 outline-none"
                  />
                </FormField>
              </div>
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.25 }}
              className="rounded-[1.6rem] border border-slate-700/60 bg-slate-900/70 p-4 shadow-[0_10px_35px_rgba(2,6,23,0.4)] sm:p-5"
            >
              <div className="mb-4 flex items-center gap-2">
                <div className="rounded-2xl bg-blue-600/10 p-2 text-blue-400">
                  <DollarSign className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-base font-semibold text-slate-100">Payment Information</p>
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
                  <div className="flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-950/70 px-3 py-2.5 focus-within:border-blue-500 focus-within:bg-slate-900">
                    <DollarSign className="h-4 w-4 text-slate-500" />
                    <span className="text-sm font-medium text-slate-400">₹</span>
                    <input
                      id="renewalAmount"
                      type="number"
                      step="0.01"
                      {...register("renewalAmount")}
                      className="w-full border-none bg-transparent text-sm text-slate-100 outline-none"
                      placeholder="0.00"
                    />
                  </div>
                </FormField>

                <FormField label="Discount" name="discount" hint="Optional">
                  <div className="flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-950/70 px-3 py-2.5 focus-within:border-blue-500 focus-within:bg-slate-900">
                    <Percent className="h-4 w-4 text-slate-500" />
                    <span className="text-sm font-medium text-slate-400">₹</span>
                    <input
                      id="discount"
                      type="number"
                      step="0.01"
                      {...register("discount")}
                      className="w-full border-none bg-transparent text-sm text-slate-100 outline-none"
                      placeholder="0.00"
                    />
                  </div>
                </FormField>
              </div>

              <div className="mt-4 rounded-2xl border border-blue-900/40 bg-blue-950/30 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-300">Final Amount</p>
                  <p className="text-2xl font-bold text-blue-300">₹{finalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
              </div>

              <div className="mt-4">
                <FormField label="Payment Method" name="paymentMethod" required error={errors.paymentMethod?.message}>
                  <select
                    id="paymentMethod"
                    {...register("paymentMethod")}
                    className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:border-blue-500 focus:bg-slate-900"
                  >
                    <option value="">Select payment method</option>
                    {paymentMethods.map((method) => (
                      <option key={method.value} value={method.value}>
                        {method.icon} {method.label}
                      </option>
                    ))}
                  </select>
                </FormField>
              </div>
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
              className="rounded-[1.6rem] border border-slate-700/60 bg-slate-900/70 p-4 shadow-[0_10px_35px_rgba(2,6,23,0.4)] sm:p-5"
            >
              <div className="mb-4 flex items-center gap-2">
                <div className="rounded-2xl bg-blue-600/10 p-2 text-blue-400">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-base font-semibold text-slate-100">Additional Notes</p>
                  <p className="text-sm text-slate-500">Optional details</p>
                </div>
              </div>

              <FormField
                label="Notes"
                name="notes"
                hint="Any special conditions or remarks"
                error={errors.notes?.message}
              >
                <div className="flex items-start gap-2 rounded-2xl border border-slate-700 bg-slate-950/70 px-3 py-2.5 focus-within:border-blue-500 focus-within:bg-slate-900">
                  <FileText className="mt-0.5 h-4 w-4 text-slate-500" />
                  <textarea
                    id="notes"
                    {...register("notes")}
                    className="min-h-[88px] w-full resize-none border-none bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500"
                    placeholder="E.g., Early renewal, corporate bulk, etc."
                  />
                </div>
              </FormField>
            </motion.section>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.35 }}
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
                disabled={isSaving || !selectedMember || !selectedPlan}
                className="rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:opacity-50"
              >
                {isSaving ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                  </span>
                ) : (
                  "Renew Membership"
                )}
              </button>
            </motion.div>
          </form>
        </motion.div>
      </PageContainer>

      
    </div>
  );
}