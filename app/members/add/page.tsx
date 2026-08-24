"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarDays, CreditCard, FileText, HeartPulse, MapPin, Phone, UserRound, Wallet, ArrowLeft, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { Toaster, toast } from "sonner";
import { z } from "zod";
import { AppHeader } from "../../components/AppHeader";
import { FormField } from "../../components/FormField";
import { PageContainer } from "../../components/PageContainer";

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
  fullName: z
    .string()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name is too long")
    .regex(/^[a-zA-Z\s'-]+$/, "Full name can only contain letters, spaces, hyphens, and apostrophes"),
  mobileNumber: z
    .string()
    .min(10, "Mobile number should be at least 10 digits")
    .max(15, "Mobile number is too long")
    .regex(/^\+?[\d\s-]+$/, "Enter a valid mobile number"),
  emailAddress: z
    .string()
    .email("Enter a valid email address")
    .optional()
    .or(z.literal("")),
  gender: z.string().min(1, "Select a gender"),
  dateOfBirth: z
    .string()
    .optional()
    .or(z.literal("")),
  address: z
    .string()
    .max(500, "Address is too long")
    .optional()
    .or(z.literal("")),
  emergencyContact: z
    .string()
    .min(10, "Emergency contact should be at least 10 digits")
    .max(15, "Emergency contact is too long")
    .regex(/^\+?[\d\s-]+$/, "Enter a valid contact number")
    .optional()
    .or(z.literal("")),
  membershipPlanId: z.string().min(1, "Select a plan"),
  joiningDate: z.string().min(1, "Joining date is required"),
  expiryDate: z.string().min(1, "Expiry date is required"),
  membershipFee: z
    .string()
    .min(1, "Membership fee is required")
    .regex(/^\d+(\.\d{1,2})?$/, "Enter a valid fee amount"),
  paymentMethod: z.string().min(1, "Select a payment method"),
  photo: z.string().optional().or(z.literal("")),
  notes: z
    .string()
    .max(1000, "Notes must be under 1000 characters")
    .optional()
    .or(z.literal("")),
  discount: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine((val) => {
      if (!val) return true;
      return /^\d+(\.\d{1,2})?$/.test(val);
    }, "Enter a valid discount amount"),
  amountPaid: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine((val) => {
      if (!val) return true;
      return /^\d+(\.\d{1,2})?$/.test(val);
    }, "Enter a valid amount"),
}).superRefine((data, ctx) => {
  const fee = parseFloat(data.membershipFee || "0") || 0;
  const discount = parseFloat(data.discount || "0") || 0;
  const finalFee = fee - discount;

  if (discount < 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["discount"],
      message: "Discount cannot be negative",
    });
  }

  if (discount > fee) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["discount"],
      message: "Discount cannot exceed membership fee",
    });
  }

  const amountPaid = parseFloat(data.amountPaid || "0") || 0;

  if (amountPaid < 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["amountPaid"],
      message: "Amount paid cannot be negative",
    });
  }

  if (amountPaid > finalFee) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["amountPaid"],
      message: "Amount paid cannot exceed final fee",
    });
  }
});

type FormValues = z.infer<typeof schema>;

const defaultValues: FormValues = {
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
  membershipFee: "",
  paymentMethod: "Cash",
  photo: "",
  notes: "",
  discount: "",
  amountPaid: "",
};

function calculateExpiryDate(joiningDate: string, durationInDays: number): string {
  if (!joiningDate) return "";
  const date = new Date(joiningDate);
  date.setDate(date.getDate() + durationInDays);
  return date.toISOString().split("T")[0];
}

export default function AddMemberPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, dirtyFields },
    reset,
    watch,
    setValue,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const selectedPlanId = watch("membershipPlanId");
  const joiningDate = watch("joiningDate");
  const membershipFee = watch("membershipFee");
  const discount = watch("discount");
  const amountPaid = watch("amountPaid");

  // Compute final fee and balance due
  const feeValue = parseFloat(membershipFee || "0") || 0;
  const discountValue = parseFloat(discount || "0") || 0;
  const finalFee = Math.max(0, feeValue - discountValue);
  const paidValue = parseFloat(amountPaid || "0") || 0;
  const balanceDue = Math.max(0, finalFee - paidValue);

  // Track form dirty state
  useEffect(() => {
    setIsDirty(Object.keys(dirtyFields).length > 0);
  }, [dirtyFields]);

  // Unsaved changes warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  // Fetch membership plans on mount
  useEffect(() => {
    async function fetchPlans() {
      try {
        setIsLoadingPlans(true);
        const response = await fetch("/api/membership-plans");
        if (!response.ok) throw new Error("Failed to fetch plans");
        const data = await response.json();
        setPlans(data);
      } catch (error) {
        console.error("Failed to load membership plans:", error);
        toast.error("Failed to load membership plans. Please refresh the page.");
      } finally {
        setIsLoadingPlans(false);
      }
    }
    fetchPlans();
  }, []);

  // Auto-calculate expiry date and fee when plan or joining date changes
  useEffect(() => {
    if (!selectedPlanId || !joiningDate) return;

    const plan = plans.find((p) => p.id === selectedPlanId);
    if (!plan) return;

    const expiry = calculateExpiryDate(joiningDate, plan.durationInDays);
    setValue("expiryDate", expiry, { shouldValidate: true });
    setValue("membershipFee", plan.price.toString(), { shouldValidate: true });
  }, [selectedPlanId, joiningDate, plans, setValue]);

  const trimValues = useCallback((values: FormValues): FormValues => {
    const trimmed: FormValues = { ...values };
    (Object.keys(trimmed) as (keyof FormValues)[]).forEach((key) => {
      const value = trimmed[key];
      if (typeof value === "string") {
        (trimmed as Record<string, string>)[key] = value.trim();
      }
    });
    return trimmed;
  }, []);

  const onSubmit = async (values: FormValues) => {
    const trimmed = trimValues(values);

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(trimmed),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to create member");
        return;
      }

      toast.success(`Member ${data.member.firstName} ${data.member.lastName ?? ""} created successfully!`);
      reset(defaultValues);
      setIsDirty(false);
      router.push("/members");
    } catch (error) {
      console.error("Failed to create member:", error);
      toast.error("Failed to create member. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedPlan = plans.find((p) => p.id === selectedPlanId);

  return (
    <div className="space-y-6">
      <Toaster position="top-right" richColors closeButton />
      <div>
          {/* Header with Back Button */}
          <div className="flex flex-col gap-3 sm:gap-4">
            <div className="flex min-w-0 items-start gap-2 sm:gap-3">
              <button
                onClick={() => {
                  if (isDirty) {
                    const confirmed = window.confirm("You have unsaved changes. Are you sure you want to leave?");
                    if (!confirmed) return;
                  }
                  router.back();
                }}
                type="button"
                className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-700 text-slate-400 transition hover:border-slate-600 hover:bg-slate-800 hover:text-slate-200 active:bg-slate-700"
                aria-label="Go back"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div className="min-w-0 flex-1">
                <p className="text-2xl font-bold tracking-tight text-slate-100">Add New Member</p>
                <p className="mt-1 text-sm text-slate-500">Register a new member with their personal, health, and membership information</p>
              </div>
            </div>
          </div>

          <form
            id="add-member-form"
            ref={formRef}
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4"
            noValidate
          >
            {/* Personal Information Section */}
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
                    placeholder="Asha Gupta"
                    autoComplete="name"
                    tabIndex={1}
                  />
                </FormField>

                <FormField label="Mobile Number" name="mobileNumber" required error={errors.mobileNumber?.message}>
                  <div className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-3 focus-within:border-emerald-500 focus-within:bg-slate-900/80 focus-within:ring-1 focus-within:ring-emerald-500/30">
                    <Phone className="h-4 w-4 flex-shrink-0 text-slate-500" />
                    <input
                      id="mobileNumber"
                      {...register("mobileNumber")}
                      className="w-full border-none bg-transparent text-sm text-slate-200 outline-none placeholder:text-slate-500"
                      placeholder="+91 98765 43210"
                      autoComplete="tel"
                      tabIndex={2}
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
                    autoComplete="email"
                    tabIndex={3}
                  />
                </FormField>

                <FormField label="Gender" name="gender" required error={errors.gender?.message}>
                  <select
                    id="gender"
                    {...register("gender")}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-3 text-sm text-slate-200 outline-none transition focus:border-emerald-500 focus:bg-slate-900/80 focus:ring-1 focus:ring-emerald-500/30"
                    tabIndex={4}
                  >
                    <option value="" className="bg-slate-800 text-slate-400">Select gender</option>
                    <option value="Female" className="bg-slate-800 text-slate-200">Female</option>
                    <option value="Male" className="bg-slate-800 text-slate-200">Male</option>
                    <option value="Non-binary" className="bg-slate-800 text-slate-200">Non-binary</option>
                  </select>
                </FormField>

                <FormField label="Date of Birth" name="dateOfBirth" error={errors.dateOfBirth?.message}>
                  <div className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-3 focus-within:border-emerald-500 focus-within:bg-slate-900/80 focus-within:ring-1 focus-within:ring-emerald-500/30">
                    <CalendarDays className="h-4 w-4 flex-shrink-0 text-slate-500" />
                    <input
                      id="dateOfBirth"
                      type="date"
                      {...register("dateOfBirth")}
                      className="w-full border-none bg-transparent text-sm text-slate-200 outline-none [color-scheme:dark]"
                      tabIndex={5}
                    />
                  </div>
                </FormField>

                <FormField label="Emergency Contact" name="emergencyContact" error={errors.emergencyContact?.message}>
                  <div className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-3 focus-within:border-emerald-500 focus-within:bg-slate-900/80 focus-within:ring-1 focus-within:ring-emerald-500/30">
                    <HeartPulse className="h-4 w-4 flex-shrink-0 text-slate-500" />
                    <input
                      id="emergencyContact"
                      {...register("emergencyContact")}
                      className="w-full border-none bg-transparent text-sm text-slate-200 outline-none placeholder:text-slate-500"
                      placeholder="+91 98765 12345"
                      autoComplete="tel"
                      tabIndex={6}
                    />
                  </div>
                </FormField>

                <div className="md:col-span-2">
                  <FormField label="Address" name="address" error={errors.address?.message}>
                    <div className="flex items-start gap-2 rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-3 focus-within:border-emerald-500 focus-within:bg-slate-900/80 focus-within:ring-1 focus-within:ring-emerald-500/30">
                      <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-500" />
                      <textarea
                        id="address"
                        {...register("address")}
                        className="min-h-[88px] w-full resize-none border-none bg-transparent text-sm text-slate-200 outline-none placeholder:text-slate-500"
                        placeholder="House / Flat, locality, city"
                        autoComplete="street-address"
                        tabIndex={7}
                      />
                    </div>
                  </FormField>
                </div>

              </div>
            </section>

            {/* Membership Details Section */}
            <section className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-3 sm:p-4 md:p-5">
              <div className="mb-4 flex items-center gap-2">
                <div className="rounded-lg bg-blue-900/30 p-2 text-blue-400">
                  <CreditCard className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-200 sm:text-base">Membership Details</p>
                  <p className="text-xs text-slate-500 sm:text-sm">Plan, billing and notes</p>
                </div>
              </div>

              <div className="grid gap-4 sm:gap-4 md:grid-cols-2">
                <FormField label="Membership Plan" name="membershipPlanId" required error={errors.membershipPlanId?.message}>
                  <select
                    id="membershipPlanId"
                    {...register("membershipPlanId")}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-3 text-sm text-slate-200 outline-none transition focus:border-emerald-500 focus:bg-slate-900/80 focus:ring-1 focus:ring-emerald-500/30"
                    disabled={isLoadingPlans}
                    tabIndex={8}
                  >
                    {isLoadingPlans ? (
                      <option value="" className="bg-slate-800 text-slate-400">Loading plans...</option>
                    ) : plans.length === 0 ? (
                      <option value="" className="bg-slate-800 text-slate-400">No plans available</option>
                    ) : (
                      <>
                        <option value="" className="bg-slate-800 text-slate-400">Select a plan</option>
                        {plans.map((plan) => (
                          <option key={plan.id} value={plan.id} className="bg-slate-800 text-slate-200">
                            {plan.name} — ₹{Number(plan.price).toLocaleString("en-IN")} ({plan.durationInDays} days)
                          </option>
                        ))}
                      </>
                    )}
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
                      tabIndex={9}
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
                      tabIndex={-1}
                    />
                  </div>
                  {selectedPlan && joiningDate ? (
                    <p className="mt-1 text-xs text-slate-500">
                      Auto-calculated: {selectedPlan.durationInDays} days from joining date
                    </p>
                  ) : null}
                </FormField>

                <FormField label="Membership Fee" name="membershipFee" required error={errors.membershipFee?.message}>
                  <div className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-3 focus-within:border-emerald-500 focus-within:bg-slate-900/80 focus-within:ring-1 focus-within:ring-emerald-500/30">
                    <Wallet className="h-4 w-4 flex-shrink-0 text-slate-500" />
                    <input
                      id="membershipFee"
                      type="text"
                      {...register("membershipFee")}
                      className="w-full border-none bg-transparent text-sm text-slate-200 outline-none"
                      placeholder="5000"
                      readOnly
                      tabIndex={-1}
                    />
                  </div>
                  {selectedPlan ? (
                    <p className="mt-1 text-xs text-slate-500">
                      Plan price: ₹{Number(selectedPlan.price).toLocaleString("en-IN")}
                      {Number(selectedPlan.joiningFee) > 0
                        ? ` + ₹${Number(selectedPlan.joiningFee).toLocaleString("en-IN")} joining fee`
                        : ""}
                    </p>
                  ) : null}
                </FormField>

                <FormField label="Discount (₹)" name="discount" hint="Optional fixed rupee discount" error={errors.discount?.message}>
                  <div className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-3 focus-within:border-emerald-500 focus-within:bg-slate-900/80 focus-within:ring-1 focus-within:ring-emerald-500/30">
                    <Wallet className="h-4 w-4 flex-shrink-0 text-slate-500" />
                    <input
                      id="discount"
                      type="text"
                      inputMode="decimal"
                      {...register("discount")}
                      className="w-full border-none bg-transparent text-sm text-slate-200 outline-none placeholder:text-slate-500"
                      placeholder="0"
                      tabIndex={11}
                    />
                  </div>
                </FormField>

                <FormField label="Final Fee (₹)" name="finalFee">
                  <div className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-3">
                    <Wallet className="h-4 w-4 flex-shrink-0 text-slate-500" />
                    <input
                      id="finalFee"
                      type="text"
                      value={finalFee > 0 ? finalFee.toLocaleString("en-IN") : ""}
                      readOnly
                      className="w-full border-none bg-transparent text-sm font-semibold text-emerald-400 outline-none"
                      placeholder="Auto-calculated"
                      tabIndex={-1}
                    />
                  </div>
                </FormField>

                <FormField label="Amount Paid (₹)" name="amountPaid" hint="Amount collected at joining" error={errors.amountPaid?.message}>
                  <div className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-3 focus-within:border-emerald-500 focus-within:bg-slate-900/80 focus-within:ring-1 focus-within:ring-emerald-500/30">
                    <Wallet className="h-4 w-4 flex-shrink-0 text-slate-500" />
                    <input
                      id="amountPaid"
                      type="text"
                      inputMode="decimal"
                      {...register("amountPaid")}
                      className="w-full border-none bg-transparent text-sm text-slate-200 outline-none placeholder:text-slate-500"
                      placeholder="0"
                      tabIndex={12}
                    />
                  </div>
                </FormField>

                <FormField label="Balance Due (₹)" name="balanceDue">
                  <div className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-3">
                    <Wallet className="h-4 w-4 flex-shrink-0 text-slate-500" />
                    <input
                      id="balanceDue"
                      type="text"
                      value={balanceDue > 0 ? balanceDue.toLocaleString("en-IN") : ""}
                      readOnly
                      className="w-full border-none bg-transparent text-sm font-semibold text-amber-400 outline-none"
                      placeholder="Auto-calculated"
                      tabIndex={-1}
                    />
                  </div>
                </FormField>

                <FormField label="Payment Method" name="paymentMethod" required error={errors.paymentMethod?.message}>
                  <select
                    id="paymentMethod"
                    {...register("paymentMethod")}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-3 text-sm text-slate-200 outline-none transition focus:border-emerald-500 focus:bg-slate-900/80 focus:ring-1 focus:ring-emerald-500/30"
                    tabIndex={10}
                  >
                    <option value="Cash" className="bg-slate-800 text-slate-200">Cash</option>
                    <option value="UPI" className="bg-slate-800 text-slate-200">UPI</option>
                    <option value="Card" className="bg-slate-800 text-slate-200">Card</option>
                    <option value="Bank Transfer" className="bg-slate-800 text-slate-200">Bank Transfer</option>
                  </select>
                </FormField>

                <div className="md:col-span-2">
                  <FormField label="Notes" name="notes" hint="Optional details for the account" error={errors.notes?.message}>
                    <div className="flex items-start gap-2 rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-3 focus-within:border-emerald-500 focus-within:bg-slate-900/80 focus-within:ring-1 focus-within:ring-emerald-500/30">
                      <FileText className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-500" />
                      <textarea
                        id="notes"
                        {...register("notes")}
                        className="min-h-[90px] w-full resize-none border-none bg-transparent text-sm text-slate-200 outline-none placeholder:text-slate-500"
                        placeholder="Training preferences, package notes, and follow-up reminders"
                        tabIndex={13}
                      />
                    </div>
                  </FormField>
                </div>
              </div>
            </section>

            {/* Save / Cancel */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
              <button
                type="button"
                onClick={() => {
                  if (isDirty) {
                    const confirmed = window.confirm("You have unsaved changes. Are you sure you want to leave?");
                    if (!confirmed) return;
                  }
                  router.back();
                }}
                className="min-h-12 flex-1 rounded-xl border border-slate-700 px-4 text-sm font-semibold text-slate-400 transition hover:border-slate-600 hover:bg-slate-800 hover:text-slate-200 active:bg-slate-700 sm:flex-none sm:px-6"
                tabIndex={15}
              >
                Cancel
              </button>
              <button
                type="submit"
                form="add-member-form"
                disabled={isSubmitting}
                className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 px-4 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 transition hover:from-emerald-500 hover:to-emerald-400 disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none sm:px-6"
                tabIndex={14}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Member"
                )}
              </button>
            </div>
          </form>
      </div>
    </div>
  );
}