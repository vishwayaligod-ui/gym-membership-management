"use client";

import { motion } from "framer-motion";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarDays, FileText, HeartPulse, MapPin, Phone, UserRound, Wallet, CreditCard, ArrowLeft } from "lucide-react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { z } from "zod";
import { AppHeader } from "@/app/components/AppHeader";
import { BottomNavigation } from "@/app/components/BottomNavigation";
import { FormField } from "@/app/components/FormField";
import { PageContainer } from "@/app/components/PageContainer";
import { mockMembers } from "@/app/members/mockMembers";

const schema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  mobileNumber: z.string().min(10, "Mobile number should be at least 10 digits"),
  gender: z.string().min(1, "Select a gender"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  address: z.string().min(5, "Address is required"),
  emergencyContact: z.string().min(10, "Emergency contact is required"),
  membershipPlan: z.string().min(1, "Select a plan"),
  joiningDate: z.string().min(1, "Joining date is required"),
  expiryDate: z.string().min(1, "Expiry date is required"),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function EditMemberPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  // Get member from mock data
  const member = mockMembers.find(m => m.id === parseInt(params.id));

  if (!member) {
    return (
      <div>
        <AppHeader title="Edit Member" />
        <PageContainer>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-32"
          >
            <p className="text-slate-600">Member not found</p>
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

  // Mock data for editing (enhanced member data)
  const mockEditData = {
    fullName: member.name,
    mobileNumber: member.phone,
    gender: "Female", // Mock data
    dateOfBirth: "1990-05-15", // Mock data
    address: "Mumbai, Maharashtra, India", // Mock data
    emergencyContact: "+91 98765 12340",
    membershipPlan: member.plan,
    joiningDate: member.joinedOn.split(", ").reverse().join("-").replace(/(\w+) (\d+), (\d+)/, "$3-" + 
      (["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].indexOf(
        member.joinedOn.split(" ")[0]
      ) + 1).toString().padStart(2, "0") + "-" + member.joinedOn.split(", ")[1]),
    expiryDate: member.expiresOn.split(", ").reverse().join("-").replace(/(\w+) (\d+), (\d+)/, "$3-" +
      (["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].indexOf(
        member.expiresOn.split(" ")[0]
      ) + 1).toString().padStart(2, "0") + "-" + member.expiresOn.split(", ")[1]),
    notes: "Active member with regular gym attendance.",
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: mockEditData,
  });

  const onSubmit = async (values: FormValues) => {
    setIsSaving(true);
    try {
      // Simulate API call
      console.log("Saving member:", values);
      // In a real app, this would be an API call to update the member
      await new Promise(resolve => setTimeout(resolve, 800));
      router.push(`/members/${params.id}`);
    } catch (error) {
      console.error("Error saving member:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,_#f5f8ff_0%,_#eef5ff_100%)] text-slate-900">
      <AppHeader title={`Edit ${member.name}`} />

      <PageContainer>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 text-slate-600 transition hover:border-blue-200 hover:text-blue-600"
              aria-label="Go back"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <p className="text-2xl font-semibold tracking-tight text-slate-950">Edit Member</p>
              <p className="mt-1 text-sm text-slate-500">Update member information</p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Personal Information */}
            <motion.section
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="rounded-[1.6rem] border border-slate-200 bg-white p-4 shadow-[0_10px_35px_rgba(15,23,42,0.06)] sm:p-5"
            >
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
                    placeholder="Full name"
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

                <FormField label="Gender" name="gender" required error={errors.gender?.message}>
                  <select
                    id="gender"
                    {...register("gender")}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
                  >
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
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
            </motion.section>

            {/* Membership Details */}
            <motion.section
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="rounded-[1.6rem] border border-slate-200 bg-white p-4 shadow-[0_10px_35px_rgba(15,23,42,0.06)] sm:p-5"
            >
              <div className="mb-4 flex items-center gap-2">
                <div className="rounded-2xl bg-blue-600/10 p-2 text-blue-600">
                  <CreditCard className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-base font-semibold text-slate-900">Membership Details</p>
                  <p className="text-sm text-slate-500">Plan, dates and notes</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField label="Membership Plan" name="membershipPlan" required error={errors.membershipPlan?.message}>
                  <select
                    id="membershipPlan"
                    {...register("membershipPlan")}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
                  >
                    <option value="Classic">Classic</option>
                    <option value="Premium">Premium</option>
                    <option value="Platinum">Platinum</option>
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
