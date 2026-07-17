"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarDays, CreditCard, FileText, HeartPulse, MapPin, Phone, UserRound, Wallet } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { AppHeader } from "../../components/AppHeader";
import { BottomNavigation } from "../../components/BottomNavigation";
import { FormField } from "../../components/FormField";
import { PageContainer } from "../../components/PageContainer";

const schema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  mobileNumber: z.string().min(10, "Mobile number should be at least 10 digits"),
  emailAddress: z.string().email("Enter a valid email address"),
  gender: z.string().min(1, "Select a gender"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  address: z.string().min(5, "Address is required"),
  emergencyContact: z.string().min(10, "Emergency contact is required"),
  membershipPlan: z.string().min(1, "Select a plan"),
  joiningDate: z.string().min(1, "Joining date is required"),
  expiryDate: z.string().min(1, "Expiry date is required"),
  membershipFee: z.string().min(1, "Membership fee is required"),
  paymentMethod: z.string().min(1, "Select a payment method"),
  notes: z.string().optional(),
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
  membershipPlan: "Platinum",
  joiningDate: "",
  expiryDate: "",
  membershipFee: "",
  paymentMethod: "Cash",
  notes: "",
};

export default function AddMemberPage() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const onSubmit = (values: FormValues) => {
    console.log(values);
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,_#f5f8ff_0%,_#eef5ff_100%)] text-slate-900">
      <AppHeader title="Add Member" />

      <PageContainer>
        <div className="space-y-4">
          <div>
            <p className="text-2xl font-semibold tracking-tight text-slate-950">Add Member</p>
            <p className="mt-1 text-sm text-slate-500">Register a new gym member</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <section className="rounded-[1.6rem] border border-slate-200 bg-white p-4 shadow-[0_10px_35px_rgba(15,23,42,0.06)] sm:p-5">
              <div className="mb-4 flex items-center gap-2">
                <div className="rounded-2xl bg-blue-600/10 p-2 text-blue-600">
                  <UserRound className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-base font-semibold text-slate-900">Personal Information</p>
                  <p className="text-sm text-slate-500">Basic profile and contact details</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField label="Full Name" name="fullName" required error={errors.fullName?.message}>
                  <input
                    id="fullName"
                    {...register("fullName")}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
                    placeholder="Asha Gupta"
                  />
                </FormField>

                <FormField label="Mobile Number" name="mobileNumber" required error={errors.mobileNumber?.message}>
                  <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus-within:border-blue-500 focus-within:bg-white">
                    <Phone className="h-4 w-4 text-slate-400" />
                    <input
                      id="mobileNumber"
                      {...register("mobileNumber")}
                      className="w-full border-none bg-transparent text-sm outline-none"
                      placeholder="+91 98765 43210"
                    />
                  </div>
                </FormField>

                <FormField label="Email Address" name="emailAddress" required error={errors.emailAddress?.message}>
                  <input
                    id="emailAddress"
                    type="email"
                    {...register("emailAddress")}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
                    placeholder="asha@example.com"
                  />
                </FormField>

                <FormField label="Gender" name="gender" required error={errors.gender?.message}>
                  <select
                    id="gender"
                    {...register("gender")}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
                  >
                    <option value="">Select gender</option>
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Non-binary">Non-binary</option>
                  </select>
                </FormField>

                <FormField label="Date of Birth" name="dateOfBirth" required error={errors.dateOfBirth?.message}>
                  <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus-within:border-blue-500 focus-within:bg-white">
                    <CalendarDays className="h-4 w-4 text-slate-400" />
                    <input
                      id="dateOfBirth"
                      type="date"
                      {...register("dateOfBirth")}
                      className="w-full border-none bg-transparent text-sm outline-none"
                    />
                  </div>
                </FormField>

                <FormField label="Emergency Contact" name="emergencyContact" required error={errors.emergencyContact?.message}>
                  <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus-within:border-blue-500 focus-within:bg-white">
                    <HeartPulse className="h-4 w-4 text-slate-400" />
                    <input
                      id="emergencyContact"
                      {...register("emergencyContact")}
                      className="w-full border-none bg-transparent text-sm outline-none"
                      placeholder="+91 98765 12345"
                    />
                  </div>
                </FormField>

                <div className="md:col-span-2">
                  <FormField label="Address" name="address" required error={errors.address?.message}>
                    <div className="flex items-start gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus-within:border-blue-500 focus-within:bg-white">
                      <MapPin className="mt-0.5 h-4 w-4 text-slate-400" />
                      <textarea
                        id="address"
                        {...register("address")}
                        className="min-h-[88px] w-full resize-none border-none bg-transparent text-sm outline-none"
                        placeholder="House / Flat, locality, city"
                      />
                    </div>
                  </FormField>
                </div>
              </div>
            </section>

            <section className="rounded-[1.6rem] border border-slate-200 bg-white p-4 shadow-[0_10px_35px_rgba(15,23,42,0.06)] sm:p-5">
              <div className="mb-4 flex items-center gap-2">
                <div className="rounded-2xl bg-blue-600/10 p-2 text-blue-600">
                  <CreditCard className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-base font-semibold text-slate-900">Membership Details</p>
                  <p className="text-sm text-slate-500">Plan, billing and notes</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField label="Membership Plan" name="membershipPlan" required error={errors.membershipPlan?.message}>
                  <select
                    id="membershipPlan"
                    {...register("membershipPlan")}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
                  >
                    <option value="Platinum">Platinum</option>
                    <option value="Premium">Premium</option>
                    <option value="Classic">Classic</option>
                  </select>
                </FormField>

                <FormField label="Joining Date" name="joiningDate" required error={errors.joiningDate?.message}>
                  <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus-within:border-blue-500 focus-within:bg-white">
                    <CalendarDays className="h-4 w-4 text-slate-400" />
                    <input
                      id="joiningDate"
                      type="date"
                      {...register("joiningDate")}
                      className="w-full border-none bg-transparent text-sm outline-none"
                    />
                  </div>
                </FormField>

                <FormField label="Expiry Date" name="expiryDate" required error={errors.expiryDate?.message}>
                  <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus-within:border-blue-500 focus-within:bg-white">
                    <CalendarDays className="h-4 w-4 text-slate-400" />
                    <input
                      id="expiryDate"
                      type="date"
                      {...register("expiryDate")}
                      className="w-full border-none bg-transparent text-sm outline-none"
                    />
                  </div>
                </FormField>

                <FormField label="Membership Fee" name="membershipFee" required error={errors.membershipFee?.message}>
                  <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus-within:border-blue-500 focus-within:bg-white">
                    <Wallet className="h-4 w-4 text-slate-400" />
                    <input
                      id="membershipFee"
                      type="number"
                      {...register("membershipFee")}
                      className="w-full border-none bg-transparent text-sm outline-none"
                      placeholder="5000"
                    />
                  </div>
                </FormField>

                <FormField label="Payment Method" name="paymentMethod" required error={errors.paymentMethod?.message}>
                  <select
                    id="paymentMethod"
                    {...register("paymentMethod")}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
                  >
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="Card">Card</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </FormField>

                <div className="md:col-span-2">
                  <FormField label="Notes" name="notes" hint="Optional details for the account" error={errors.notes?.message}>
                    <div className="flex items-start gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus-within:border-blue-500 focus-within:bg-white">
                      <FileText className="mt-0.5 h-4 w-4 text-slate-400" />
                      <textarea
                        id="notes"
                        {...register("notes")}
                        className="min-h-[90px] w-full resize-none border-none bg-transparent text-sm outline-none"
                        placeholder="Training preferences, package notes, and follow-up reminders"
                      />
                    </div>
                  </FormField>
                </div>
              </div>
            </section>

            <div className="flex flex-col-reverse gap-3 rounded-[1.6rem] border border-slate-200 bg-white p-4 shadow-[0_10px_35px_rgba(15,23,42,0.06)] sm:flex-row sm:justify-end">
              <button type="button" className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-blue-200 hover:text-blue-600">
                Cancel
              </button>
              <button type="submit" className="rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700">
                Save Member
              </button>
            </div>
          </form>
        </div>
      </PageContainer>

      <BottomNavigation />
    </div>
  );
}
