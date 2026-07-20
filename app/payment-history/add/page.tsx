"use client";

import { motion } from "framer-motion";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarDays, CreditCard, FileText, User, Wallet, DollarSign, ArrowLeft } from "lucide-react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { AppHeader } from "@/app/components/AppHeader";
import { BottomNavigation } from "@/app/components/BottomNavigation";
import { FormField } from "@/app/components/FormField";
import { PageContainer } from "@/app/components/PageContainer";
import { mockMembers } from "@/app/members/mockMembers";

const schema = z.object({
  memberId: z.string().min(1, "Select a member"),
  membershipPlan: z.string().min(1, "Select a plan"),
  amount: z.string().min(1, "Amount is required").refine(
    (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
    "Amount must be a valid number greater than 0"
  ),
  paymentMethod: z.string().min(1, "Select a payment method"),
  paymentDate: z.string().min(1, "Payment date is required"),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const paymentMethods = [
  { value: "Cash", label: "💵 Cash", icon: "💵" },
  { value: "UPI", label: "📱 UPI", icon: "📱" },
  { value: "Card", label: "💳 Card", icon: "💳" },
];

export default function AddPaymentPage() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [selectedMember, setSelectedMember] = useState<typeof mockMembers[0] | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      memberId: "",
      membershipPlan: "",
      amount: "",
      paymentMethod: "Cash",
      paymentDate: new Date().toISOString().split("T")[0],
      notes: "",
    },
  });

  const memberId = watch("memberId");

  const handleMemberSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    const member = mockMembers.find((m) => m.id === parseInt(id));
    if (member) {
      setSelectedMember(member);
      setValue("membershipPlan", member.plan);
    } else {
      setSelectedMember(null);
      setValue("membershipPlan", "");
    }
  };

  const onSubmit = async (values: FormValues) => {
    setIsSaving(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 800));
      
      console.log("Payment recorded:", {
        ...values,
        amount: parseFloat(values.amount),
      });

      toast.success("Payment recorded successfully!", {
        description: `₹${parseFloat(values.amount).toLocaleString()} from ${selectedMember?.name}`,
      });

      // Navigate back to payment history
      router.push("/payment-history");
    } catch (error) {
      toast.error("Failed to record payment", {
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
      <AppHeader title="Add Payment" />

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
              <p className="text-2xl font-semibold tracking-tight text-slate-950">Record Payment</p>
              <p className="mt-1 text-sm text-slate-500">Add a new payment entry</p>
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
                  <User className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-base font-semibold text-slate-900">Member Details</p>
                  <p className="text-sm text-slate-500">Select member and verify plan</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField label="Member" name="memberId" required error={errors.memberId?.message}>
                  <select
                    id="memberId"
                    {...register("memberId")}
                    onChange={handleMemberSelect}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
                  >
                    <option value="">Select a member</option>
                    {mockMembers.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name} ({member.plan})
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField
                  label="Membership Plan"
                  name="membershipPlan"
                  required
                  error={errors.membershipPlan?.message}
                >
                  <input
                    id="membershipPlan"
                    {...register("membershipPlan")}
                    readOnly
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none"
                    placeholder="Auto-filled from member"
                  />
                </FormField>
              </div>

              {/* Member Info Preview */}
              {selectedMember && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 flex items-center gap-3 rounded-2xl border border-slate-200 bg-gradient-to-r from-blue-50 to-white p-3"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-500 text-sm font-semibold text-white">
                    {selectedMember.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{selectedMember.name}</p>
                    <p className="text-xs text-slate-600">
                      {selectedMember.plan} • {selectedMember.phone}
                    </p>
                  </div>
                </motion.div>
              )}
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
                      placeholder="0.00"
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
                      <div className="w-full rounded-2xl border-2 border-slate-200 bg-slate-50 px-4 py-3 transition has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{method.icon}</span>
                          <span className="text-sm font-medium text-slate-900">
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
              transition={{ duration: 0.3, delay: 0.2 }}
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
              transition={{ duration: 0.3, delay: 0.25 }}
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
                {isSaving ? "Recording..." : "Record Payment"}
              </button>
            </motion.div>
          </form>
        </motion.div>
      </PageContainer>

      <BottomNavigation />
    </div>
  );
}
