"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Save, X } from "lucide-react";
import React from "react";
import { Toaster, toast } from "sonner";
import type { Trainer, TrainerStatus } from "@/app/trainers/types";
import { FadeUp } from "@/app/components/v4/MotionDiv";

const specializations = ["Strength", "Cardio", "CrossFit", "Yoga", "Zumba"];

export default function EditTrainerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const router = useRouter();
  const [trainer, setTrainer] = useState<Trainer | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    specialization: "Strength",
    experience: 1,
    status: "Active" as TrainerStatus,
    assignedMembers: 0,
  });

  React.useEffect(() => {
    let isMounted = true;

    const fetchTrainer = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/trainers/${id}`, { cache: "no-store" });

        if (!response.ok) {
          if (response.status === 404) {
            if (isMounted) setTrainer(null);
            return;
          }
          throw new Error("Failed to fetch trainer");
        }

        const data = (await response.json()) as Trainer;
        if (!isMounted) return;

        setTrainer(data);
        setFormData({
          name: data.name,
          email: data.email,
          phone: data.phone,
          specialization: data.specialization,
          experience: data.experience,
          status: data.status,
          assignedMembers: data.assignedMembers,
        });
      } catch (error) {
        console.error("Failed to load trainer:", error);
        if (isMounted) {
          setTrainer(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchTrainer();

    return () => {
      isMounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="text-center">
          <p className="text-base font-semibold text-slate-300">Loading trainer...</p>
        </div>
      </div>
    );
  }

  if (!trainer) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="text-center">
          <p className="text-base font-semibold text-slate-300">Trainer not found</p>
          <button
            onClick={() => router.push("/trainers")}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-800 px-5 py-2.5 text-[13px] font-semibold text-slate-300 transition-all hover:bg-slate-700"
            type="button"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Trainers
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = formData.name.trim();
    const trimmedEmail = formData.email.trim().toLowerCase();
    const trimmedPhone = formData.phone.trim();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!trimmedName || !trimmedEmail || !trimmedPhone) {
      const message = "Name, email, and phone are required";
      setSubmitError(message);
      toast.error(message);
      return;
    }

    if (!emailPattern.test(trimmedEmail)) {
      const message = "Please enter a valid email address";
      setSubmitError(message);
      toast.error(message);
      return;
    }

    if (!Number.isFinite(formData.experience) || formData.experience < 0 || formData.experience > 50) {
      const message = "Experience must be between 0 and 50 years";
      setSubmitError(message);
      toast.error(message);
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError(null);

      const response = await fetch(`/api/trainers/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: trimmedName,
          email: trimmedEmail,
          phone: trimmedPhone,
          specialization: formData.specialization,
          experience: formData.experience,
          status: formData.status,
        }),
      });

      if (!response.ok) {
        const error = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(error?.error || "Failed to update trainer");
      }

      toast.success("Trainer updated successfully");
      router.push(`/trainers/${id}`);
      router.refresh();
    } catch (error) {
      console.error("Failed to update trainer:", error);
      const message = error instanceof Error ? error.message : "Failed to update trainer";
      setSubmitError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateField = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <>
      <Toaster position="top-right" richColors closeButton />
      <div className="space-y-6">
      {/* Back Button */}
      <motion.button
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        onClick={() => router.push("/trainers")}
        className="inline-flex items-center gap-2 text-[13px] font-semibold text-slate-400 transition-colors hover:text-slate-200"
        type="button"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Trainers
      </motion.button>

      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-100">
            Edit Trainer
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Update details for {trainer.name}.
          </p>
        </div>
      </motion.div>

      {/* Form */}
      <FadeUp delay={0.1}>
        <form onSubmit={handleSubmit}>
          <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-6 sm:p-8">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-[12px] font-semibold uppercase tracking-[0.06em] text-slate-400">
                  Full Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/50 px-4 py-3 text-[13px] text-slate-200 outline-none placeholder:text-slate-500 transition-all focus:border-emerald-500 focus:bg-slate-900/80 focus:ring-1 focus:ring-emerald-500/30"
                />
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-[12px] font-semibold uppercase tracking-[0.06em] text-slate-400">
                  Email <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  placeholder="e.g. trainer@gymfit.com"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/50 px-4 py-3 text-[13px] text-slate-200 outline-none placeholder:text-slate-500 transition-all focus:border-emerald-500 focus:bg-slate-900/80 focus:ring-1 focus:ring-emerald-500/30"
                />
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <label className="text-[12px] font-semibold uppercase tracking-[0.06em] text-slate-400">
                  Phone <span className="text-red-400">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  placeholder="e.g. +91 98765 43210"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/50 px-4 py-3 text-[13px] text-slate-200 outline-none placeholder:text-slate-500 transition-all focus:border-emerald-500 focus:bg-slate-900/80 focus:ring-1 focus:ring-emerald-500/30"
                />
              </div>

              {/* Specialization */}
              <div className="space-y-1.5">
                <label className="text-[12px] font-semibold uppercase tracking-[0.06em] text-slate-400">
                  Specialization <span className="text-red-400">*</span>
                </label>
                <select
                  required
                  value={formData.specialization}
                  onChange={(e) => updateField("specialization", e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/50 px-4 py-3 text-[13px] text-slate-200 outline-none transition-all focus:border-emerald-500 focus:bg-slate-900/80 focus:ring-1 focus:ring-emerald-500/30"
                >
                  {specializations.map((s) => (
                    <option key={s} value={s} className="bg-slate-800 text-slate-200">
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {/* Experience */}
              <div className="space-y-1.5">
                <label className="text-[12px] font-semibold uppercase tracking-[0.06em] text-slate-400">
                  Experience (Years) <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  max={50}
                  value={formData.experience}
                  onChange={(e) => updateField("experience", parseInt(e.target.value) || 0)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/50 px-4 py-3 text-[13px] text-slate-200 outline-none placeholder:text-slate-500 transition-all focus:border-emerald-500 focus:bg-slate-900/80 focus:ring-1 focus:ring-emerald-500/30"
                />
              </div>

              {/* Status */}
              <div className="space-y-1.5">
                <label className="text-[12px] font-semibold uppercase tracking-[0.06em] text-slate-400">
                  Status <span className="text-red-400">*</span>
                </label>
                <select
                  required
                  value={formData.status}
                  onChange={(e) => updateField("status", e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/50 px-4 py-3 text-[13px] text-slate-200 outline-none transition-all focus:border-emerald-500 focus:bg-slate-900/80 focus:ring-1 focus:ring-emerald-500/30"
                >
                  <option value="Active" className="bg-slate-800 text-slate-200">Active</option>
                  <option value="On Leave" className="bg-slate-800 text-slate-200">On Leave</option>
                  <option value="Inactive" className="bg-slate-800 text-slate-200">Inactive</option>
                </select>
              </div>

              {/* Assigned Members (Read-only) */}
              <div className="space-y-1.5">
                <label className="text-[12px] font-semibold uppercase tracking-[0.06em] text-slate-400">
                  Assigned Members
                </label>
                <input
                  type="number"
                  readOnly
                  value={formData.assignedMembers}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/30 px-4 py-3 text-[13px] text-slate-400 outline-none cursor-not-allowed"
                />
                <p className="text-[10px] text-slate-500 mt-1">Managed automatically based on member assignments.</p>
              </div>
            </div>

            {submitError && (
              <p className="mt-4 text-sm font-medium text-red-400">{submitError}</p>
            )}

            {/* Action Buttons */}
            <div className="mt-8 flex items-center justify-end gap-3 border-t border-slate-700/40 pt-6">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => router.push(`/trainers/${id}`)}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/50 px-5 py-2.5 text-[13px] font-semibold text-slate-400 transition-all hover:border-slate-600 hover:text-slate-200"
              >
                <X className="h-4 w-4" />
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ y: -2, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 px-5 py-2.5 text-[13px] font-semibold text-white shadow-lg shadow-emerald-600/25 transition-all hover:from-emerald-500 hover:to-emerald-400 hover:shadow-emerald-500/30"
              >
                <Save className="h-4 w-4" />
                {isSubmitting ? "Updating..." : "Update Trainer"}
              </motion.button>
            </div>
          </div>
        </form>
      </FadeUp>
      </div>
    </>
  );
}