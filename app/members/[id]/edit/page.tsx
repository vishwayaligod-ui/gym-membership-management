"use client";

import { motion } from "framer-motion";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarDays, FileText, HeartPulse, MapPin, Phone, UserRound, Wallet, CreditCard, ArrowLeft, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useState, use, useEffect } from "react";
import { z } from "zod";
import { Toaster, toast } from "sonner";
import { AppHeader } from "@/app/components/AppHeader";
import { FormField } from "@/app/components/FormField";
import { PageContainer } from "@/app/components/PageContainer";

type MembershipPlan = {
  id: string;
  name: string;
  durationInDays: number;
  price: number;
  joiningFee: number;
  description: string | null;
  freezeDays: number;
};

const schema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  mobileNumber: z.string().min(10, "Mobile number should be at least 10 digits"),
  emailAddress: z.string().email("Enter a valid email address").optional().or(z.literal("")),
  gender: z.string().min(1, "Select a gender"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  address: z.string().min(5, "Address is required"),
  emergencyContact: z.string().min(10, "Emergency contact is required"),
  membershipPlanId: z.string().min(1, "Select a plan"),
  joiningDate: z.string().min(1, "Joining date is required"),
  expiryDate: z.string().min(1, "Expiry date is required"),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function EditMemberPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [memberNotFound, setMemberNotFound] = useState(false);

  // Unwrap params as required by Next.js 16 App Router (client component)
  const { id } = use(params);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: "",
      mobileNumber: "",
      emailAddress: "",
      gender: "",
      dateOfBirth: "",
      address: "",
      emergencyContact: "",
      membershipPlanId: "",
      joiningDate: "",
      expiryDate: "",
      notes: "",
    },
  });

  const selectedPlanId = watch("membershipPlanId");
  const joiningDate = watch("joiningDate");

  // Fetch member data and plans
  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);

        // Fetch member
        const memberResponse = await fetch(`/api/members/${id}`);
        if (!memberResponse.ok) {
          setMemberNotFound(true);
          return;
        }
        const memberData = await memberResponse.json();
        const member = memberData.member;

        // Fetch plans
        const plansResponse = await fetch("/api/membership-plans");
        if (plansResponse.ok) {
          const plansData = await plansResponse.json();
          setPlans(plansData);
        }

        // Get latest membership
        const latestMembership = member.memberships?.[0];

        // Format dates
        const formatDate = (dateStr: string) => {
          if (!dateStr) return "";
          const d = new Date(dateStr);
          return d.toISOString().split("T")[0];
        };

        const formatDOB = (dateStr: string) => {
          if (!dateStr) return "";
          const d = new Date(dateStr);
          return d.toISOString().split("T")[0];
        };

        reset({
          fullName: `${member.firstName} ${member.lastName || ""}`.trim(),
          mobileNumber: member.phone,
          emailAddress: member.email || "",
          gender: member.gender === "MALE" ? "Male" : member.gender === "FEMALE" ? "Female" : "Non-binary",
          dateOfBirth: formatDOB(member.dateOfBirth),
          address: member.address || "",
          emergencyContact: member.emergencyPhone || "",
          membershipPlanId: latestMembership?.planId || "",
          joiningDate: formatDate(latestMembership?.startDate || member.joiningDate),
          expiryDate: formatDate(latestMembership?.endDate || ""),
          notes: member.notes || "",
        });
      } catch (error) {
        console.error("Failed to load member:", error);
        toast.error("Failed to load member data");
        setMemberNotFound(true);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [id, reset]);

  // Auto-calculate expiry date when plan or joining date changes
  useEffect(() => {
    if (!selectedPlanId || !joiningDate) return;

    const plan = plans.find((p) => p.id === selectedPlanId);
    if (!plan) return;

    const date = new Date(joiningDate);
    date.setDate(date.getDate() + plan.durationInDays);
    const expiry = date.toISOString().split("T")[0];
    setValue("expiryDate", expiry, { shouldValidate: true });
  }, [selectedPlanId, joiningDate, plans, setValue]);

  const onSubmit = async (values: FormValues) => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/members/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to update member");
        return;
      }

      toast.success("Member updated successfully");
      router.push(`/members/${id}`);
    } catch (error) {
      console.error("Error saving member:", error);
      toast.error("Failed to update member. Please check your connection.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Toaster position="top-right" richColors closeButton />
        <div className="flex flex-col items-center justify-center py-32">
          <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
          <p className="mt-4 text-base font-semibold text-slate-300">Loading member data...</p>
        </div>
      </div>
    );
  }

  if (memberNotFound) {
    return (
      <div className="space-y-6">
        <Toaster position="top-right" richColors closeButton />
        <div className="flex flex-col items-center justify-center py-32">
          <p className="text-base font-semibold text-slate-300">Member not found</p>
          <button
            onClick={() => router.back()}
            className="mt-4 flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Toaster position="top-right" richColors closeButton />
      <div className="flex flex-col gap-3 sm:gap-4">
        <div className="flex min-w-0 items-start gap-2 sm:gap-3">
          <button
            onClick={handleCancel}
            type="button"
            className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-700 text-slate-400 transition hover:border-slate-600 hover:bg-slate-800 hover:text-slate-200 active:bg-slate-700"
            aria-label="Go back"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-2xl font-bold tracking-tight text-slate-100">Edit Member</p>
            <p className="mt-1 text-sm text-slate-500">Update member information</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Personal Information */}
        <section className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-3 sm:p-4 md:p-5">
          <div className="mb-4 flex items-center gap-2">
            <div className="rounded-lg bg-emerald-900/30 p-2 text-emerald-400">
              <UserRound className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-200 sm:text-base">Personal Information</p>
              <p className="text-xs text-slate-500 sm:text-sm">Basic profile and contact details</p>
            </div>
          </div>

          <div className="grid gap-4 sm:gap-4 md:grid-cols-2">
            <FormField label="Full Name" name="fullName" required error={errors.fullName?.message}>
              <input
                id="fullName"
                {...register("fullName")}
                className="w-full rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-3 text-sm text-slate-200 outline-none transition placeholder:text-slate-500 focus:border-emerald-500 focus:bg-slate-900/80 focus:ring-1 focus:ring-emerald-500/30"
                placeholder="Full name"
              />
            </FormField>

            <FormField label="Mobile Number" name="mobileNumber" required error={errors.mobileNumber?.message}>
              <div className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-3 focus-within:border-emerald-500 focus-within:bg-slate-900/80 focus-within:ring-1 focus-within:ring-emerald-500/30">
                <Phone className="h-4 w-4 flex-shrink-0 text-slate-500" />
                <input
                  id="mobileNumber"
                  {...register("mobileNumber")}
                  className="w-full border-none bg-transparent text-sm text-slate-200 outline-none"
                  placeholder="+91 98765 43210"
                />
              </div>
            </FormField>

            <FormField label="Email Address" name="emailAddress" error={errors.emailAddress?.message}>
              <input
                id="emailAddress"
                type="email"
                {...register("emailAddress")}
                className="w-full rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-3 text-sm text-slate-200 outline-none transition placeholder:text-slate-500 focus:border-emerald-500 focus:bg-slate-900/80 focus:ring-1 focus:ring-emerald-500/30"
                placeholder="asha@example.com"
              />
            </FormField>

            <FormField label="Gender" name="gender" required error={errors.gender?.message}>
              <select
                id="gender"
                {...register("gender")}
                className="w-full rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-3 text-sm text-slate-200 outline-none transition focus:border-emerald-500 focus:bg-slate-900/80 focus:ring-1 focus:ring-emerald-500/30"
              >
                <option value="" className="bg-slate-800 text-slate-400">Select gender</option>
                <option value="Female" className="bg-slate-800 text-slate-200">Female</option>
                <option value="Male" className="bg-slate-800 text-slate-200">Male</option>
                <option value="Non-binary" className="bg-slate-800 text-slate-200">Non-binary</option>
              </select>
            </FormField>

            <FormField label="Date of Birth" name="dateOfBirth" required error={errors.dateOfBirth?.message}>
              <div className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-3 focus-within:border-emerald-500 focus-within:bg-slate-900/80 focus-within:ring-1 focus-within:ring-emerald-500/30">
                <CalendarDays className="h-4 w-4 flex-shrink-0 text-slate-500" />
                <input
                  id="dateOfBirth"
                  type="date"
                  {...register("dateOfBirth")}
                  className="w-full border-none bg-transparent text-sm text-slate-200 outline-none [color-scheme:dark]"
                />
              </div>
            </FormField>

            <FormField label="Emergency Contact" name="emergencyContact" required error={errors.emergencyContact?.message}>
              <div className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-3 focus-within:border-emerald-500 focus-within:bg-slate-900/80 focus-within:ring-1 focus-within:ring-emerald-500/30">
                <HeartPulse className="h-4 w-4 flex-shrink-0 text-slate-500" />
                <input
                  id="emergencyContact"
                  {...register("emergencyContact")}
                  className="w-full border-none bg-transparent text-sm text-slate-200 outline-none"
                  placeholder="+91 98765 12345"
                />
              </div>
            </FormField>

            <div className="md:col-span-2">
              <FormField label="Address" name="address" required error={errors.address?.message}>
                <div className="flex items-start gap-2 rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-3 focus-within:border-emerald-500 focus-within:bg-slate-900/80 focus-within:ring-1 focus-within:ring-emerald-500/30">
                  <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-500" />
                  <textarea
                    id="address"
                    {...register("address")}
                    className="min-h-[88px] w-full resize-none border-none bg-transparent text-sm text-slate-200 outline-none"
                    placeholder="House / Flat, locality, city"
                  />
                </div>
              </FormField>
            </div>
          </div>
        </section>

        {/* Membership Details */}
        <section className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-3 sm:p-4 md:p-5">
          <div className="mb-4 flex items-center gap-2">
            <div className="rounded-lg bg-blue-900/30 p-2 text-blue-400">
              <CreditCard className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-200 sm:text-base">Membership Details</p>
              <p className="text-xs text-slate-500 sm:text-sm">Plan, dates and notes</p>
            </div>
          </div>

          <div className="grid gap-4 sm:gap-4 md:grid-cols-2">
            <FormField label="Membership Plan" name="membershipPlanId" required error={errors.membershipPlanId?.message}>
              <select
                id="membershipPlanId"
                {...register("membershipPlanId")}
                className="w-full rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-3 text-sm text-slate-200 outline-none transition focus:border-emerald-500 focus:bg-slate-900/80 focus:ring-1 focus:ring-emerald-500/30"
              >
                <option value="" className="bg-slate-800 text-slate-400">Select a plan</option>
                {plans.map((plan) => (
                  <option key={plan.id} value={plan.id} className="bg-slate-800 text-slate-200">
                    {plan.name} — ₹{Number(plan.price).toLocaleString("en-IN")} ({plan.durationInDays} days)
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Joining Date" name="joiningDate" required error={errors.joiningDate?.message}>
              <div className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-3 focus-within:border-emerald-500 focus-within:bg-slate-900/80 focus-within:ring-1 focus-within:ring-emerald-500/30">
                <CalendarDays className="h-4 w-4 flex-shrink-0 text-slate-500" />
                <input
                  id="joiningDate"
                  type="date"
                  {...register("joiningDate")}
                  className="w-full border-none bg-transparent text-sm text-slate-200 outline-none [color-scheme:dark]"
                />
              </div>
            </FormField>

            <FormField label="Expiry Date" name="expiryDate" required error={errors.expiryDate?.message}>
              <div className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-3 focus-within:border-emerald-500 focus-within:bg-slate-900/80 focus-within:ring-1 focus-within:ring-emerald-500/30">
                <CalendarDays className="h-4 w-4 flex-shrink-0 text-slate-500" />
                <input
                  id="expiryDate"
                  type="date"
                  {...register("expiryDate")}
                  className="w-full border-none bg-transparent text-sm text-slate-200 outline-none [color-scheme:dark]"
                  readOnly
                />
              </div>
            </FormField>

            <div className="md:col-span-2">
              <FormField label="Notes" name="notes" hint="Optional details for the account" error={errors.notes?.message}>
                <div className="flex items-start gap-2 rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-3 focus-within:border-emerald-500 focus-within:bg-slate-900/80 focus-within:ring-1 focus-within:ring-emerald-500/30">
                  <FileText className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-500" />
                  <textarea
                    id="notes"
                    {...register("notes")}
                    className="min-h-[90px] w-full resize-none border-none bg-transparent text-sm text-slate-200 outline-none"
                    placeholder="Training preferences, package notes, and follow-up reminders"
                  />
                </div>
              </FormField>
            </div>
          </div>
        </section>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
          <button
            type="button"
            onClick={handleCancel}
            disabled={isSaving}
            className="min-h-12 flex-1 rounded-xl border border-slate-700 px-4 text-sm font-semibold text-slate-400 transition hover:border-slate-600 hover:bg-slate-800 hover:text-slate-200 active:bg-slate-700 sm:flex-none sm:px-6"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 px-4 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 transition hover:from-emerald-500 hover:to-emerald-400 disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none sm:px-6"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}