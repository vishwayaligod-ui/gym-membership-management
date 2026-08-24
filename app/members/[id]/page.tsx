"use client";

import { motion } from "framer-motion";
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  CreditCard,
  DollarSign,
  Hash,
  IndianRupee,
  Loader2,
  Mail,
  Phone,
  Tag,
  UserRound,
  Zap,
} from "lucide-react";
import React, { useState, useEffect } from "react";
import { Toaster, toast } from "sonner";
import { useRouter } from "next/navigation";
import { getMemberStatus } from "@/app/lib/member-status";

type MemberData = {
  id: string;
  firstName: string;
  lastName: string | null;
  phone: string;
  email: string | null;
  gender: string;
  dateOfBirth: string | null;
  address: string | null;
  emergencyName: string | null;
  emergencyPhone: string | null;
  joiningDate: string;
  status: string;
  notes: string | null;
  memberships: Array<{
    id: string;
    planId: string;
    startDate: string;
    endDate: string;
    amount: number;
    discount: number;
    finalAmount: number;
    status: string;
    plan: {
      id: string;
      name: string;
      durationInDays: number;
      price: number;
      joiningFee: number;
    };
  }>;
  payments: Array<{
    id: string;
    amount: number;
    paymentMode: string;
    paymentStatus: string;
    paymentDate: string;
    remarks: string | null;
  }>;
};

export default function MemberDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [member, setMember] = useState<MemberData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMember() {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/members/${id}`);
        if (!response.ok) {
          if (response.status === 404) {
            setError("Member not found");
          } else {
            throw new Error("Failed to fetch member");
          }
          return;
        }
        const data = await response.json();
        setMember(data.member);
      } catch (error) {
        console.error("Failed to fetch member:", error);
        setError("Failed to load member data");
        toast.error("Failed to load member data");
      } finally {
        setIsLoading(false);
      }
    }
    fetchMember();
  }, [id]);

  if (isLoading) {
    return (
      <div className="space-y-5">
        <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-2xl border border-slate-800 bg-slate-900 px-4 py-8 shadow-[0_12px_36px_rgba(2,6,23,0.28)]">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
          <p className="mt-3 text-sm font-medium text-slate-300">Loading member data...</p>
        </div>
      </div>
    );
  }

  if (error || !member) {
    return (
      <div className="space-y-5">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex min-h-[40vh] flex-col items-center justify-center rounded-2xl border border-slate-800 bg-slate-900 px-4 py-8 text-center shadow-[0_12px_36px_rgba(2,6,23,0.28)]"
        >
          <p className="text-sm text-slate-400">{error || "Member not found"}</p>
          <button
            onClick={() => router.back()}
            className="mt-4 inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-100 transition hover:border-slate-600 hover:bg-slate-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </button>
        </motion.div>
      </div>
    );
  }

  const memberName = `${member.firstName} ${member.lastName || ""}`.trim();
  const initials = `${member.firstName.charAt(0)}${member.lastName?.charAt(0) || ""}`;
  const latestMembership = member.memberships?.[0];
  const recentPayment = member.payments?.[0];

  const displayStatus = getMemberStatus(
    latestMembership?.endDate || null,
    latestMembership?.status
  );

  const daysRemaining = latestMembership
    ? Math.max(
        0,
        Math.floor(
          (new Date(latestMembership.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        )
      )
    : 0;

  const totalSpent = member.payments?.reduce((sum: number, p: { amount: number }) => sum + p.amount, 0) || 0;
  const planName = latestMembership?.plan?.name || "N/A";
  const planPrice = latestMembership?.plan?.price || 0;
  const membershipDiscount = latestMembership?.discount || 0;
  const finalFee = latestMembership?.finalAmount || planPrice;
  const balanceDue = Math.max(0, finalFee - totalSpent);
  const joinedOn = new Date(member.joiningDate).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const expiresOn = latestMembership
    ? new Date(latestMembership.endDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "N/A";

  const statusPillClass =
    displayStatus === "Active"
      ? "bg-emerald-900/30 text-emerald-400 border-emerald-900/40"
      : displayStatus === "Expiring"
      ? "bg-amber-900/30 text-amber-400 border-amber-900/40"
      : "bg-rose-900/30 text-rose-400 border-rose-900/40";

  const daysPillClass =
    daysRemaining > 60
      ? "bg-emerald-900/30 text-emerald-400 border-emerald-900/40"
      : daysRemaining > 30
      ? "bg-amber-900/30 text-amber-400 border-amber-900/40"
      : "bg-rose-900/30 text-rose-400 border-rose-900/40";

  return (
    <>
      <Toaster position="top-right" richColors closeButton />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ staggerChildren: 0.06, delayChildren: 0.05 }}
        className="space-y-5"
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ staggerChildren: 0.06, delayChildren: 0.05 }}
          className="space-y-3 pt-0 pb-1"
        >
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="rounded-2xl border border-slate-800 bg-slate-900 p-4 shadow-[0_12px_36px_rgba(2,6,23,0.28)]"
          >
            <div className="flex flex-col gap-3.5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => router.back()}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-800 bg-slate-950 text-slate-300 transition hover:border-slate-700 hover:bg-slate-800 hover:text-slate-100"
                  aria-label="Go back"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-xl font-semibold tracking-tight text-slate-100 sm:text-2xl">Member Details</h1>
                    <span className="rounded-full border border-slate-800 bg-slate-950 px-2.5 py-1 text-[11px] font-medium text-slate-400">
                      #{member.id.slice(0, 8).toUpperCase()}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500 sm:text-sm">View complete member information.</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${statusPillClass}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${displayStatus === "Active" ? "bg-emerald-400" : displayStatus === "Expiring" ? "bg-amber-400" : "bg-rose-400"}`} />
                  {displayStatus}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs font-semibold text-slate-200">
                  <IndianRupee className="h-3.5 w-3.5 text-slate-400" />
                  ₹{Number(totalSpent).toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          </motion.section>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="rounded-2xl border border-slate-800 bg-slate-900 p-3.5 shadow-[0_12px_36px_rgba(2,6,23,0.28)]"
          >
            <div className="flex flex-col gap-3.5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-xl font-bold text-white ring-1 ring-slate-800">
                  {initials}
                </div>
                <div className="min-w-0">
                  <h2 className="truncate text-lg font-semibold tracking-tight text-slate-100 sm:text-xl">{memberName}</h2>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-300">
                      <Tag className="h-3.5 w-3.5" />
                      {planName}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-800 bg-slate-950 px-3 py-1 text-xs font-medium text-slate-300">
                      <Phone className="h-3.5 w-3.5 text-slate-400" />
                      {member.phone}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-800 bg-slate-950 px-3 py-1 text-xs font-medium text-slate-300">
                      <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
                      {expiresOn}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-1.5">
                  <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-slate-500">Plan Price</p>
                  <p className="mt-0.5 text-sm font-semibold text-slate-100">₹{Number(planPrice).toLocaleString("en-IN")}</p>
                </div>
                <div className={`rounded-xl border px-3 py-1.5 ${daysPillClass}`}>
                  <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-inherit opacity-80">Days Remaining</p>
                  <p className="mt-0.5 text-sm font-semibold text-inherit">{daysRemaining} Days</p>
                </div>
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 items-start">
            <div className="space-y-4">
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="rounded-2xl border border-slate-800 bg-slate-900 p-3.5 shadow-[0_12px_36px_rgba(2,6,23,0.28)]"
            >
              <div className="mb-3.5 flex items-center gap-2">
                <UserRound className="h-4 w-4 text-blue-400" />
                <h3 className="text-sm font-semibold text-slate-100">Member Information</h3>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-2.5">
                  <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-500">Name</p>
                  <p className="mt-1 text-sm font-semibold text-slate-100">{memberName}</p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-2.5">
                  <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-500">Phone</p>
                  <p className="mt-1 text-sm font-semibold text-slate-100">{member.phone}</p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-2.5">
                  <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-500">Email</p>
                  <p className="mt-1 truncate text-sm font-semibold text-slate-100">{member.email || "N/A"}</p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-2.5">
                  <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-500">Gender</p>
                  <p className="mt-1 text-sm font-semibold text-slate-100">{member.gender}</p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-2.5">
                  <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-500">Member ID</p>
                  <p className="mt-1 text-sm font-semibold text-slate-100">#{member.id.slice(0, 8).toUpperCase()}</p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-2.5">
                  <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-500">Join Date</p>
                  <p className="mt-1 text-sm font-semibold text-slate-100">{joinedOn}</p>
                </div>
              </div>
            </motion.section>


          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: "easeOut", delay: 0.06 }}
            className="rounded-2xl border border-slate-800 bg-slate-900 p-3.5 shadow-[0_12px_36px_rgba(2,6,23,0.28)]"
          >
            <div className="mb-3.5 flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-blue-400" />
              <h3 className="text-sm font-semibold text-slate-100">Recent Payment</h3>
            </div>
            {recentPayment ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-2.5">
                  <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-500">Payment Status</p>
                  <p className="mt-1 text-sm font-semibold text-slate-100">
                    {recentPayment.paymentStatus.charAt(0) + recentPayment.paymentStatus.slice(1).toLowerCase()}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-2.5">
                  <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-500">Payment Date</p>
                  <p className="mt-1 text-sm font-semibold text-slate-100">
                    {new Date(recentPayment.paymentDate).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-2.5">
                  <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-500">Payment Method</p>
                  <p className="mt-1 text-sm font-semibold text-slate-100">
                    {recentPayment.paymentMode === "CASH"
                      ? "Cash"
                      : recentPayment.paymentMode === "UPI"
                      ? "UPI"
                      : recentPayment.paymentMode === "CARD"
                      ? "Card"
                      : recentPayment.paymentMode === "BANK_TRANSFER"
                      ? "Bank Transfer"
                      : recentPayment.paymentMode}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-2.5">
                  <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-500">Lifetime Amount Paid</p>
                  <p className="mt-1 text-sm font-semibold text-slate-100">₹{Number(totalSpent).toLocaleString("en-IN")}</p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-2.5">
                  <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-500">Discount</p>
                  <p className="mt-1 text-sm font-semibold text-slate-100">
                    {membershipDiscount > 0 ? `₹${Number(membershipDiscount).toLocaleString("en-IN")}` : "₹0"}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-2.5">
                  <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-500">Balance Due</p>
                  <p className={`mt-1 text-sm font-semibold ${balanceDue > 0 ? "text-amber-400" : "text-emerald-400"}`}>
                    ₹{balanceDue.toLocaleString("en-IN")}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-2.5">
                  <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-500">Next Due Date</p>
                  <p className="mt-1 text-sm font-semibold text-slate-100">{expiresOn}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center rounded-xl border border-slate-800 bg-slate-950 p-6">
                <p className="text-sm text-slate-400">No payment records found</p>
              </div>
            )}
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: "easeOut", delay: 0.12 }}
            className="rounded-2xl border border-slate-800 bg-slate-900 p-3.5 shadow-[0_12px_36px_rgba(2,6,23,0.28)]"
          >
            <div className="mb-3.5 flex items-center gap-2">
              <Zap className="h-4 w-4 text-blue-400" />
              <h3 className="text-sm font-semibold text-slate-100">Notes</h3>
            </div>
            <p className="rounded-xl border border-slate-800 bg-slate-950 px-2.5 py-2 text-sm leading-6 text-slate-300">
              {member.notes || "No notes"}
            </p>
          </motion.section>
            </div>

            <div className="space-y-4">
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: "easeOut", delay: 0.03 }}
              className="rounded-2xl border border-slate-800 bg-slate-900 p-3.5 shadow-[0_12px_36px_rgba(2,6,23,0.28)]"
            >
              <div className="mb-3.5 flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-blue-400" />
                <h3 className="text-sm font-semibold text-slate-100">Membership Details</h3>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-2.5">
                  <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-500">Plan</p>
                  <p className="mt-1 text-sm font-semibold text-slate-100">{planName}</p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-2.5">
                  <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-500">Membership ID</p>
                  <p className="mt-1 text-sm font-semibold text-slate-100">#{latestMembership?.id.slice(0, 8).toUpperCase() || "N/A"}</p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-2.5">
                  <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-500">Plan ID</p>
                  <p className="mt-1 text-sm font-semibold text-slate-100">#{latestMembership?.planId.slice(0, 8).toUpperCase() || "N/A"}</p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-2.5">
                  <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-500">Duration</p>
                  <p className="mt-1 text-sm font-semibold text-slate-100">{latestMembership?.plan.durationInDays || 0} days</p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-2.5">
                  <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-500">Start Date</p>
                  <p className="mt-1 text-sm font-semibold text-slate-100">
                    {latestMembership?.startDate
                      ? new Date(latestMembership.startDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "N/A"}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-2.5">
                  <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-500">End Date</p>
                  <p className="mt-1 text-sm font-semibold text-slate-100">{expiresOn}</p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-2.5">
                  <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-500">Plan Price</p>
                  <p className="mt-1 text-sm font-semibold text-slate-100">₹{Number(planPrice).toLocaleString("en-IN")}</p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-2.5">
                  <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-500">Discount</p>
                  <p className="mt-1 text-sm font-semibold text-slate-100">
                    {membershipDiscount > 0 ? `₹${Number(membershipDiscount).toLocaleString("en-IN")}` : "₹0"}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-2.5">
                  <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-500">Final Fee</p>
                  <p className="mt-1 text-sm font-semibold text-emerald-400">₹{Number(finalFee).toLocaleString("en-IN")}</p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-2.5">
                  <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-500">Amount Paid</p>
                  <p className="mt-1 text-sm font-semibold text-slate-100">₹{Number(totalSpent).toLocaleString("en-IN")}</p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-2.5">
                  <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-500">Balance Due</p>
                  <p className={`mt-1 text-sm font-semibold ${balanceDue > 0 ? "text-amber-400" : "text-emerald-400"}`}>
                    ₹{balanceDue.toLocaleString("en-IN")}
                  </p>
                </div>
              </div>
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: "easeOut", delay: 0.09 }}
              className="rounded-2xl border border-slate-800 bg-slate-900 p-3.5 shadow-[0_12px_36px_rgba(2,6,23,0.28)]"
            >
              <div className="mb-3.5 flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-400" />
                <h3 className="text-sm font-semibold text-slate-100">Membership Summary</h3>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-2.5">
                  <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-500">Days Remaining</p>
                  <p className="mt-1 text-sm font-semibold text-slate-100">{daysRemaining} Days</p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-2.5">
                  <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-500">Membership Type</p>
                  <p className="mt-1 text-sm font-semibold text-slate-100">{planName}</p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-2.5">
                  <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-500">Membership Started</p>
                  <p className="mt-1 text-sm font-semibold text-slate-100">{joinedOn}</p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-2.5">
                  <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-500">Renewal Date</p>
                  <p className="mt-1 text-sm font-semibold text-slate-100">{expiresOn}</p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-2.5">
                  <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-500">Lifetime Amount Paid</p>
                  <p className="mt-1 text-sm font-semibold text-slate-100">₹{Number(totalSpent).toLocaleString("en-IN")}</p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-2.5">
                  <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-500">Trainer</p>
                  <p className="mt-1 text-sm font-semibold text-slate-100">Not assigned</p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-2.5 sm:col-span-2 lg:col-span-2">
                  <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-500">Plan Price</p>
                  <p className="mt-1 text-sm font-semibold text-slate-100">₹{Number(planPrice).toLocaleString("en-IN")}</p>
                </div>
              </div>
            </motion.section>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </>
  );
}