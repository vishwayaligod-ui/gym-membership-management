"use client";

import { motion } from "framer-motion";
import { zodResolver } from "@hookform/resolvers/zod";
import { Search, DollarSign, FileText, ArrowLeft, CalendarDays, Tag, CreditCard, Loader2, Receipt, CheckCircle2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useState, useMemo, useEffect, useRef } from "react";
import { z } from "zod";
import { Toaster, toast } from "sonner";
import { AppHeader } from "@/app/components/AppHeader";
import { BottomNavigation } from "@/app/components/BottomNavigation";
import { FormField } from "@/app/components/FormField";
import { PageContainer } from "@/app/components/PageContainer";

interface MemberOption {
  id: string;
  name: string;
  phone: string;
  avatar: string;
}

interface MembershipOption {
  id: string;
  memberId: string;
  planId: string;
  planName: string;
  planPrice: number;
  planDurationInDays: number;
  planDescription: string | null;
  startDate: string;
  endDate: string;
  amount: number;
  discount: number;
  finalAmount: number;
  status: string;
  remarks: string | null;
  lastPayment: {
    id: string;
    paymentDate: string;
    paymentStatus: string;
    amount: number;
  } | null;
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
  memberId: z.string().min(1, "Select a member"),
  membershipId: z.string().min(1, "Select a membership"),
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

const defaultValues: FormValues = {
  memberId: "",
  membershipId: "",
  amount: "",
  paymentMode: "",
  paymentStatus: "PAID",
  paymentDate: new Date().toISOString().split("T")[0],
  transactionId: "",
  remarks: "",
};

export default function AddPaymentPage() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);
  const [members, setMembers] = useState<MemberOption[]>([]);
  const [memberships, setMemberships] = useState<MembershipOption[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(true);
  const [isLoadingMemberships, setIsLoadingMemberships] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const memberDropdownRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const memberId = watch("memberId");
  const membershipId = watch("membershipId");

  const selectedMember = useMemo(
    () => members.find((m) => m.id === memberId) || null,
    [memberId, members]
  );

  const selectedMembership = useMemo(
    () => memberships.find((m) => m.id === membershipId) || null,
    [membershipId, memberships]
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

  // Fetch members on mount
  useEffect(() => {
    async function fetchMembers() {
      try {
        const response = await fetch("/api/members");
        if (!response.ok) throw new Error("Failed to fetch members");
        const data = await response.json();
        const memberOptions: MemberOption[] = (data.members || []).map((m: any) => ({
          id: m.id,
          name: m.name,
          phone: m.phone,
          avatar: m.avatar,
        }));
        setMembers(memberOptions);
      } catch (error) {
        console.error("Failed to fetch members:", error);
        toast.error("Failed to load members. Please refresh the page.");
      } finally {
        setIsLoadingMembers(false);
      }
    }

    void fetchMembers();
  }, []);

  // Fetch memberships when member changes
  useEffect(() => {
    if (!memberId) {
      setMemberships([]);
      setValue("membershipId", "", { shouldValidate: false });
      return;
    }

    async function fetchMemberships() {
      setIsLoadingMemberships(true);
      try {
        const response = await fetch(`/api/memberships?memberId=${memberId}`);
        if (!response.ok) throw new Error("Failed to fetch memberships");
        const data = await response.json();
        setMemberships(data.memberships || []);
        // Reset membership selection when member changes
        setValue("membershipId", "", { shouldValidate: false });
        setValue("amount", "", { shouldValidate: false });
      } catch (error) {
        console.error("Failed to fetch memberships:", error);
        toast.error("Failed to load memberships for this member.");
        setMemberships([]);
      } finally {
        setIsLoadingMemberships(false);
      }
    }

    void fetchMemberships();
  }, [memberId, setValue]);

  // Auto-fill amount when membership is selected
  useEffect(() => {
    if (selectedMembership) {
      setValue("amount", String(selectedMembership.finalAmount), { shouldValidate: true });
    }
  }, [selectedMembership, setValue]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (memberDropdownRef.current && !memberDropdownRef.current.contains(event.target as Node)) {
        setShowMemberDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMemberSelect = (member: MemberOption) => {
    setValue("memberId", member.id, { shouldValidate: true });
    setSearchQuery(member.name);
    setShowMemberDropdown(false);
  };

  const handleMembershipSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setValue("membershipId", value, { shouldValidate: true });
  };

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
      const response = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId: values.memberId,
          membershipId: values.membershipId,
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
        throw new Error(data?.error || "Failed to record payment");
      }

      toast.success("Payment recorded successfully!", {
        description: `₹${parseFloat(values.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })} payment recorded for ${selectedMember?.name || "member"}.`,
      });

      router.push("/payment-history");
    } catch (error) {
      toast.error("Failed to record payment", {
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Toaster position="top-right" richColors closeButton />
      <AppHeader title="Add Payment" />

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
              <p className="text-2xl font-semibold tracking-tight text-slate-100">Add Payment</p>
              <p className="mt-1 text-sm text-slate-500">Record a new payment for a member.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <input type="hidden" {...register("memberId")} />
            <input type="hidden" {...register("membershipId")} />

            {/* ═══════════════════════════════════════════
                SELECT MEMBER SECTION
                ═══════════════════════════════════════════ */}
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
                  <p className="text-sm text-slate-500">Choose the member for this payment</p>
                </div>
              </div>

              <div className="relative" ref={memberDropdownRef}>
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
                        <p className="text-sm text-slate-500">{member.phone}</p>
                      </button>
                    ))}
                  </motion.div>
                )}

                {showMemberDropdown && filteredMembers.length === 0 && !isLoadingMembers && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute top-full left-0 right-0 z-10 mt-2 rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 shadow-lg"
                  >
                    <p className="text-sm text-slate-500">No members found</p>
                  </motion.div>
                )}
              </div>

              {errors.memberId && (
                <p className="mt-2 text-sm text-rose-400">{errors.memberId.message}</p>
              )}
            </motion.section>

            {/* ═══════════════════════════════════════════
                SELECT MEMBERSHIP SECTION
                ═══════════════════════════════════════════ */}
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
                    <p className="text-sm text-slate-500">Selected member details</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Member</p>
                      <p className="mt-1.5 text-base font-semibold text-slate-100">{selectedMember.name}</p>
                      <p className="mt-0.5 text-sm text-slate-500">{selectedMember.phone}</p>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-500 text-xs font-semibold text-white">
                      {selectedMember.avatar}
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <FormField label="Membership" name="membershipId" required error={errors.membershipId?.message}>
                    <select
                      id="membershipId"
                      value={membershipId}
                      onChange={handleMembershipSelect}
                      className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:border-blue-500 focus:bg-slate-900"
                      disabled={isLoadingMemberships}
                    >
                      <option value="">
                        {isLoadingMemberships ? "Loading memberships..." : memberships.length === 0 ? "No memberships found" : "Select a membership"}
                      </option>
                      {memberships.map((ms) => (
                        <option key={ms.id} value={ms.id}>
                          {ms.planName} — {formatCurrency(ms.finalAmount)} ({formatDate(ms.startDate)} — {formatDate(ms.endDate)}) [{ms.status}]
                        </option>
                      ))}
                    </select>
                  </FormField>
                </div>

                {errors.membershipId && (
                  <p className="mt-2 text-sm text-rose-400">{errors.membershipId.message}</p>
                )}

                {/* Auto-filled Plan Details */}
                {selectedMembership && (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Plan</p>
                      <p className="mt-1.5 text-sm font-medium text-slate-100">{selectedMembership.planName}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Duration</p>
                      <p className="mt-1.5 text-sm font-medium text-slate-100">{selectedMembership.planDurationInDays} days</p>
                    </div>
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Start Date</p>
                      <p className="mt-1.5 text-sm font-medium text-slate-100">{formatDate(selectedMembership.startDate)}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">End Date</p>
                      <p className="mt-1.5 text-sm font-medium text-slate-100">{formatDate(selectedMembership.endDate)}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Plan Amount</p>
                      <p className="mt-1.5 text-sm font-medium text-slate-100">{formatCurrency(selectedMembership.amount)}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Discount</p>
                      <p className="mt-1.5 text-sm font-medium text-slate-100">{formatCurrency(selectedMembership.discount)}</p>
                    </div>
                    <div className="rounded-2xl border border-blue-900/40 bg-blue-950/30 p-4 sm:col-span-2">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-blue-400">Final Amount (Auto-filled)</p>
                      <p className="mt-1.5 text-lg font-bold text-blue-200">{formatCurrency(selectedMembership.finalAmount)}</p>
                    </div>
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
                disabled={isSaving || !selectedMember}
                className="rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:opacity-50"
              >
                {isSaving ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving Payment...
                  </span>
                ) : (
                  "Record Payment"
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