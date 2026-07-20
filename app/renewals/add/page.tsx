"use client";

import { motion } from "framer-motion";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarDays, Search, DollarSign, FileText, Percent, ArrowLeft, CheckCircle2, Clock, AlertCircle, Tag } from "lucide-react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { AppHeader } from "@/app/components/AppHeader";
import { BottomNavigation } from "@/app/components/BottomNavigation";
import { FormField } from "@/app/components/FormField";
import { PageContainer } from "@/app/components/PageContainer";
import { mockMembers } from "@/app/members/mockMembers";

const schema = z.object({
  memberId: z.string().min(1, "Select a member"),
  newPlan: z.string().min(1, "Select a new plan"),
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

const planPrices: Record<string, number> = {
  Classic: 3000,
  Premium: 4500,
  Platinum: 6500,
};

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
  // Parse "Jul 12, 2026" format
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

function convertDateToInputFormat(dateStr: string): string {
  // Convert "Jul 12, 2026" to "2026-07-12"
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
  // Convert "2026-07-12" to "Jul 12, 2026"
  const months = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const [year, month, day] = inputDate.split("-");
  const monthName = months[parseInt(month)];
  return `${monthName} ${parseInt(day)}, ${year}`;
}

export default function RenewMembershipPage() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);

  const selectedMember = useMemo(
    () => mockMembers.find((m) => m.id === parseInt(selectedMemberId)),
    [selectedMemberId]
  );

  const filteredMembers = useMemo(
    () =>
      mockMembers.filter((member) => {
        const query = searchQuery.toLowerCase();
        return (
          member.name.toLowerCase().includes(query) ||
          member.phone.includes(query)
        );
      }),
    [searchQuery]
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      newPlan: "",
      duration: "",
      startDate: new Date().toISOString().split("T")[0],
      renewalAmount: "",
      discount: "",
      paymentMethod: "Cash",
      notes: "",
    },
  });

  const newPlan = watch("newPlan");
  const duration = watch("duration");
  const discountStr = watch("discount");
  const renewalAmountStr = watch("renewalAmount");
  const startDate = watch("startDate");

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

  // Calculate days extended
  const daysExtended = useMemo(() => {
    if (!selectedMember || !endDate) return 0;
    return calculateDaysExtended(selectedMember.expiresOn, endDate);
  }, [selectedMember, endDate]);

  const onSubmit = async (values: FormValues) => {
    setIsSaving(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 800));

      console.log("Renewal created:", {
        ...values,
        renewalAmount: parseFloat(values.renewalAmount),
        discount: values.discount ? parseFloat(values.discount) : 0,
        finalAmount: finalAmount,
        member: selectedMember,
        endDate: endDate,
        daysExtended: daysExtended,
      });

      toast.success("Membership renewed successfully!", {
        description: `${selectedMember?.name} renewed for ${duration}. Invoice generated.`,
      });

      router.push("/renewals");
    } catch (error) {
      toast.error("Failed to renew membership", {
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
      <AppHeader title="Renew Membership" />

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
              <p className="text-2xl font-semibold tracking-tight text-slate-950">Renew Membership</p>
              <p className="mt-1 text-sm text-slate-500">Extend member's subscription</p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Member Selection Section */}
            <motion.section
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="rounded-[1.6rem] border border-slate-200 bg-white p-4 shadow-[0_10px_35px_rgba(15,23,42,0.06)] sm:p-5"
            >
              <div className="mb-4 flex items-center gap-2">
                <div className="rounded-2xl bg-blue-600/10 p-2 text-blue-600">
                  <Search className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-base font-semibold text-slate-900">Select Member</p>
                  <p className="text-sm text-slate-500">Find the member to renew</p>
                </div>
              </div>

              {/* Member Search Dropdown */}
              <div className="relative">
                <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                  <Search className="h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by name or phone..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setShowMemberDropdown(true);
                    }}
                    onFocus={() => setShowMemberDropdown(true)}
                    className="w-full border-none bg-transparent text-sm outline-none"
                  />
                </div>

                {/* Dropdown Menu */}
                {showMemberDropdown && filteredMembers.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute top-full left-0 right-0 z-10 mt-2 max-h-64 overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-lg"
                  >
                    {filteredMembers.map((member) => (
                      <button
                        key={member.id}
                        type="button"
                        onClick={() => {
                          setSelectedMemberId(member.id.toString());
                          setSearchQuery(member.name);
                          setShowMemberDropdown(false);
                        }}
                        className="w-full border-b border-slate-100 px-4 py-3 text-left hover:bg-slate-50 last:border-b-0"
                      >
                        <p className="font-medium text-slate-900">{member.name}</p>
                        <p className="text-sm text-slate-500">{member.plan} · {member.phone}</p>
                      </button>
                    ))}
                  </motion.div>
                )}
              </div>

              {errors.memberId && (
                <p className="mt-2 text-sm text-rose-600">{errors.memberId.message}</p>
              )}
            </motion.section>

            {/* Membership Summary Section */}
            {selectedMember && (
              <motion.section
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.15 }}
                className="rounded-[1.6rem] border border-slate-200 bg-white p-4 shadow-[0_10px_35px_rgba(15,23,42,0.06)] sm:p-5"
              >
                <div className="mb-4 flex items-center gap-2">
                  <div className="rounded-2xl bg-emerald-600/10 p-2 text-emerald-600">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-base font-semibold text-slate-900">Member Summary</p>
                    <p className="text-sm text-slate-500">Current membership details</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Member</p>
                        <p className="mt-1.5 text-base font-semibold text-slate-900">{selectedMember.name}</p>
                      </div>
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-500 text-xs font-semibold text-white">
                        {selectedMember.avatar}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Current Plan</p>
                      <p className="mt-1.5 text-sm font-medium text-slate-900">{selectedMember.plan}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Current Expiry</p>
                      <p className="mt-1.5 text-sm font-medium text-slate-900">{selectedMember.expiresOn}</p>
                    </div>
                  </div>

                  {endDate && (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-blue-600">New Expiry</p>
                        <p className="mt-1.5 text-sm font-medium text-blue-900">{endDate}</p>
                      </div>
                      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-600">Days Extended</p>
                        <p className="mt-1.5 text-sm font-medium text-emerald-900">{daysExtended} days</p>
                      </div>
                    </div>
                  )}
                </div>
              </motion.section>
            )}

            {/* Renewal Details Section */}
            <motion.section
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="rounded-[1.6rem] border border-slate-200 bg-white p-4 shadow-[0_10px_35px_rgba(15,23,42,0.06)] sm:p-5"
            >
              <div className="mb-4 flex items-center gap-2">
                <div className="rounded-2xl bg-blue-600/10 p-2 text-blue-600">
                  <Tag className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-base font-semibold text-slate-900">Renewal Details</p>
                  <p className="text-sm text-slate-500">Plan and duration</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField label="New Plan" name="newPlan" required error={errors.newPlan?.message}>
                  <select
                    {...register("newPlan")}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:bg-white"
                  >
                    <option value="">Select a plan</option>
                    <option value="Classic">Classic - ₹{planPrices.Classic}/month</option>
                    <option value="Premium">Premium - ₹{planPrices.Premium}/month</option>
                    <option value="Platinum">Platinum - ₹{planPrices.Platinum}/month</option>
                  </select>
                </FormField>

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
              </div>

              <div className="grid gap-4 md:grid-cols-2 pt-4">
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

                <FormField label="End Date" name="endDate" hint="Auto-calculated from duration">
                  <input
                    type="text"
                    readOnly
                    value={endDate}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-100 px-3 py-2.5 text-sm text-slate-600 outline-none"
                  />
                </FormField>
              </div>
            </motion.section>

            {/* Payment Section */}
            <motion.section
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.25 }}
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
                      placeholder="0.00"
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
                      placeholder="0.00"
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
              transition={{ duration: 0.3, delay: 0.3 }}
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
                    placeholder="E.g., Early renewal, corporate bulk, etc."
                  />
                </div>
              </FormField>
            </motion.section>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.35 }}
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
                disabled={isSaving || !selectedMember}
                className="rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:opacity-50"
              >
                {isSaving ? "Processing..." : "Renew Membership"}
              </button>
            </motion.div>
          </form>
        </motion.div>
      </PageContainer>

      <BottomNavigation />
    </div>
  );
}
