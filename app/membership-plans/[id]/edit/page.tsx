"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Save, X, Loader2 } from "lucide-react";
import { Toaster, toast } from "sonner";
import { FadeUp } from "@/app/components/v4/MotionDiv";

export default function EditMembershipPlanPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    durationInDays: "",
    price: "",
    joiningFee: "",
    freezeDays: "0",
    description: "",
    isActive: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch plan data on mount
  useEffect(() => {
    async function fetchPlan() {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/membership-plans/${id}`);
        if (!response.ok) {
          if (response.status === 404) {
            toast.error("Plan not found");
            router.push("/membership-plans");
            return;
          }
          throw new Error("Failed to fetch plan");
        }
        const data = await response.json();
        setFormData({
          name: data.name || "",
          durationInDays: String(data.durationInDays || ""),
          price: String(Number(data.price) || ""),
          joiningFee: String(Number(data.joiningFee) || ""),
          freezeDays: String(data.freezeDays || "0"),
          description: data.description || "",
          isActive: data.isActive,
        });
      } catch (error) {
        console.error("Failed to load plan:", error);
        toast.error("Failed to load plan details");
        router.push("/membership-plans");
      } finally {
        setIsLoading(false);
      }
    }
    fetchPlan();
  }, [id, router]);

  const updateField = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Plan name is required";
    }

    const duration = Number(formData.durationInDays);
    if (!formData.durationInDays || !Number.isInteger(duration) || duration <= 0) {
      newErrors.durationInDays = "Duration must be a positive number";
    }

    const price = Number(formData.price);
    if (!formData.price || isNaN(price) || price < 0) {
      newErrors.price = "Membership fee must be >= 0";
    }

    const joiningFee = Number(formData.joiningFee) || 0;
    if (joiningFee < 0) {
      newErrors.joiningFee = "Joining fee must be >= 0";
    }

    const freezeDays = Number(formData.freezeDays) || 0;
    if (freezeDays < 0) {
      newErrors.freezeDays = "Freeze days must be >= 0";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/membership-plans/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          durationInDays: Number(formData.durationInDays),
          price: Number(formData.price),
          joiningFee: Number(formData.joiningFee) || 0,
          freezeDays: Number(formData.freezeDays) || 0,
          description: formData.description.trim() || null,
          isActive: formData.isActive,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to update plan");
        return;
      }

      toast.success(`Plan "${data.name}" updated successfully!`);
      router.push("/membership-plans");
    } catch (error) {
      console.error("Failed to update plan:", error);
      toast.error("Failed to update plan. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-slate-700/60 bg-slate-800/40 px-6 py-20 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-700/40">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-500 border-t-transparent" />
        </div>
        <p className="mt-4 text-base font-semibold text-slate-300">Loading Plan</p>
        <p className="mt-1.5 text-sm text-slate-500 max-w-sm">
          Fetching plan details...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Toaster position="top-right" richColors closeButton />

      {/* Back Button */}
      <motion.button
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        onClick={() => router.push("/membership-plans")}
        className="inline-flex items-center gap-2 text-[13px] font-semibold text-slate-400 transition-colors hover:text-slate-200"
        type="button"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Plans
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
            Edit Membership Plan
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Update plan details, pricing, and features.
          </p>
        </div>
      </motion.div>

      {/* Form */}
      <FadeUp delay={0.1}>
        <form onSubmit={handleSubmit}>
          <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-6 sm:p-8">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {/* Plan Name */}
              <div className="space-y-1.5">
                <label className="text-[12px] font-semibold uppercase tracking-[0.06em] text-slate-400">
                  Plan Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  placeholder="e.g. Platinum Monthly"
                  className={`w-full rounded-lg border bg-slate-900/50 px-4 py-3 text-[13px] text-slate-200 outline-none placeholder:text-slate-500 transition-all focus:bg-slate-900/80 focus:ring-1 ${
                    errors.name
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500/30"
                      : "border-slate-700 focus:border-emerald-500 focus:ring-emerald-500/30"
                  }`}
                />
                {errors.name && (
                  <p className="text-[11px] text-red-400">{errors.name}</p>
                )}
              </div>

              {/* Duration */}
              <div className="space-y-1.5">
                <label className="text-[12px] font-semibold uppercase tracking-[0.06em] text-slate-400">
                  Duration (Days) <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={formData.durationInDays}
                  onChange={(e) => updateField("durationInDays", e.target.value)}
                  placeholder="e.g. 30"
                  className={`w-full rounded-lg border bg-slate-900/50 px-4 py-3 text-[13px] text-slate-200 outline-none placeholder:text-slate-500 transition-all focus:bg-slate-900/80 focus:ring-1 ${
                    errors.durationInDays
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500/30"
                      : "border-slate-700 focus:border-emerald-500 focus:ring-emerald-500/30"
                  }`}
                />
                {errors.durationInDays && (
                  <p className="text-[11px] text-red-400">{errors.durationInDays}</p>
                )}
              </div>

              {/* Membership Fee */}
              <div className="space-y-1.5">
                <label className="text-[12px] font-semibold uppercase tracking-[0.06em] text-slate-400">
                  Membership Fee (₹) <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => updateField("price", e.target.value)}
                  placeholder="e.g. 5000"
                  className={`w-full rounded-lg border bg-slate-900/50 px-4 py-3 text-[13px] text-slate-200 outline-none placeholder:text-slate-500 transition-all focus:bg-slate-900/80 focus:ring-1 ${
                    errors.price
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500/30"
                      : "border-slate-700 focus:border-emerald-500 focus:ring-emerald-500/30"
                  }`}
                />
                {errors.price && (
                  <p className="text-[11px] text-red-400">{errors.price}</p>
                )}
              </div>

              {/* Joining Fee */}
              <div className="space-y-1.5">
                <label className="text-[12px] font-semibold uppercase tracking-[0.06em] text-slate-400">
                  Joining Fee (₹)
                </label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={formData.joiningFee}
                  onChange={(e) => updateField("joiningFee", e.target.value)}
                  placeholder="e.g. 500"
                  className={`w-full rounded-lg border bg-slate-900/50 px-4 py-3 text-[13px] text-slate-200 outline-none placeholder:text-slate-500 transition-all focus:bg-slate-900/80 focus:ring-1 ${
                    errors.joiningFee
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500/30"
                      : "border-slate-700 focus:border-emerald-500 focus:ring-emerald-500/30"
                  }`}
                />
                {errors.joiningFee && (
                  <p className="text-[11px] text-red-400">{errors.joiningFee}</p>
                )}
              </div>

              {/* Freeze Days */}
              <div className="space-y-1.5">
                <label className="text-[12px] font-semibold uppercase tracking-[0.06em] text-slate-400">
                  Freeze Days
                </label>
                <input
                  type="number"
                  min={0}
                  value={formData.freezeDays}
                  onChange={(e) => updateField("freezeDays", e.target.value)}
                  placeholder="e.g. 7"
                  className={`w-full rounded-lg border bg-slate-900/50 px-4 py-3 text-[13px] text-slate-200 outline-none placeholder:text-slate-500 transition-all focus:bg-slate-900/80 focus:ring-1 ${
                    errors.freezeDays
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500/30"
                      : "border-slate-700 focus:border-emerald-500 focus:ring-emerald-500/30"
                  }`}
                />
                {errors.freezeDays && (
                  <p className="text-[11px] text-red-400">{errors.freezeDays}</p>
                )}
              </div>

              {/* Status */}
              <div className="space-y-1.5">
                <label className="text-[12px] font-semibold uppercase tracking-[0.06em] text-slate-400">
                  Status
                </label>
                <select
                  value={formData.isActive ? "active" : "inactive"}
                  onChange={(e) => updateField("isActive", e.target.value === "active")}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/50 px-4 py-3 text-[13px] text-slate-200 outline-none transition-all focus:border-emerald-500 focus:bg-slate-900/80 focus:ring-1 focus:ring-emerald-500/30"
                >
                  <option value="active" className="bg-slate-800 text-slate-200">Active</option>
                  <option value="inactive" className="bg-slate-800 text-slate-200">Inactive</option>
                </select>
              </div>

              {/* Description */}
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-[12px] font-semibold uppercase tracking-[0.06em] text-slate-400">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  placeholder="Describe what this plan includes, benefits, and any special features..."
                  rows={3}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/50 px-4 py-3 text-[13px] text-slate-200 outline-none placeholder:text-slate-500 transition-all focus:border-emerald-500 focus:bg-slate-900/80 focus:ring-1 focus:ring-emerald-500/30 resize-none"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 flex items-center justify-end gap-3 border-t border-slate-700/40 pt-6">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => router.push("/membership-plans")}
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
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 px-5 py-2.5 text-[13px] font-semibold text-white shadow-lg shadow-emerald-600/25 transition-all hover:from-emerald-500 hover:to-emerald-400 hover:shadow-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Update Plan
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </form>
      </FadeUp>
    </div>
  );
}