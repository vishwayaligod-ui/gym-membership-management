"use client";

import { motion } from "framer-motion";
import {
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  Loader2,
  Mail,
  Star,
  Trash2,
  UserRound,
  Users,
  Pencil,
  Briefcase,
} from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { Toaster, toast } from "sonner";
import { useRouter } from "next/navigation";
import type { Trainer } from "@/app/trainers/types";
import { TrainerStatusBadge } from "@/app/trainers/TrainerStatusBadge";

export default function TrainerDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [trainer, setTrainer] = useState<Trainer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchTrainer = React.useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/trainers/${id}`, { cache: "no-store" });
      if (!response.ok) {
        if (response.status === 404) {
          setError("Trainer not found");
          setTrainer(null);
          return;
        }
        throw new Error("Failed to fetch trainer");
      }

      const data = (await response.json()) as Trainer;
      setTrainer(data);
    } catch (fetchError) {
      console.error("Failed to fetch trainer:", fetchError);
      setError("Failed to load trainer data");
      setTrainer(null);
      toast.error("Failed to load trainer data");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTrainer();
  }, [fetchTrainer]);

  const handleDelete = async () => {
    if (!trainer) return;

    try {
      setIsDeleting(true);
      const response = await fetch(`/api/trainers/${trainer.id}`, {
        method: "DELETE",
      });

      const payload = (await response.json().catch(() => null)) as
        | { error?: string; message?: string }
        | null;

      if (!response.ok) {
        throw new Error(payload?.error || "Failed to delete trainer");
      }

      toast.success(payload?.message || "Trainer deleted successfully");
      router.push("/trainers");
      router.refresh();
    } catch (deleteError) {
      const message = deleteError instanceof Error ? deleteError.message : "Failed to delete trainer";
      toast.error(message);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const joinedOn = useMemo(() => {
    if (!trainer?.joiningDate) return "N/A";
    return new Date(trainer.joiningDate).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }, [trainer?.joiningDate]);

  if (isLoading) {
    return (
      <div className="space-y-5">
        <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-2xl border border-slate-800 bg-slate-900 px-4 py-8 shadow-[0_12px_36px_rgba(2,6,23,0.28)]">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
          <p className="mt-3 text-sm font-medium text-slate-300">Loading trainer data...</p>
        </div>
      </div>
    );
  }

  if (error || !trainer) {
    return (
      <>
        <Toaster position="top-right" richColors closeButton />
        <div className="space-y-5">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex min-h-[40vh] flex-col items-center justify-center rounded-2xl border border-slate-800 bg-slate-900 px-4 py-8 text-center shadow-[0_12px_36px_rgba(2,6,23,0.28)]"
          >
            <p className="text-sm text-slate-400">{error || "Trainer not found"}</p>
            <button
              onClick={() => router.back()}
              className="mt-4 inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-100 transition hover:border-slate-600 hover:bg-slate-700"
            >
              <ArrowLeft className="h-4 w-4" />
              Go Back
            </button>
          </motion.div>
        </div>
      </>
    );
  }

  const initials = trainer.avatar || trainer.name.slice(0, 2).toUpperCase();

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
                    <h1 className="text-xl font-semibold tracking-tight text-slate-100 sm:text-2xl">Trainer Details</h1>
                    <span className="rounded-full border border-slate-800 bg-slate-950 px-2.5 py-1 text-[11px] font-medium text-slate-400">
                      #{trainer.id.slice(0, 8).toUpperCase()}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500 sm:text-sm">View complete trainer information.</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                <TrainerStatusBadge status={trainer.status} />
                <button
                  onClick={() => router.push(`/trainers/${trainer.id}/edit`)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:border-slate-600 hover:bg-slate-800"
                >
                  <Pencil className="h-3.5 w-3.5 text-slate-400" />
                  Edit
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-red-900/50 bg-red-950/30 px-3 py-1.5 text-xs font-semibold text-red-300 transition hover:border-red-700/60 hover:bg-red-900/30"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </button>
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
                  <h2 className="truncate text-lg font-semibold tracking-tight text-slate-100 sm:text-xl">{trainer.name}</h2>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-300">
                      <BadgeCheck className="h-3.5 w-3.5" />
                      {trainer.specialization}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-800 bg-slate-950 px-3 py-1 text-xs font-medium text-slate-300">
                      <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
                      Joined {joinedOn}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-800 bg-slate-950 px-3 py-1 text-xs font-medium text-slate-300">
                      <Users className="h-3.5 w-3.5 text-slate-400" />
                      {trainer.assignedMembers} Members
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-1.5">
                  <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-slate-500">Experience</p>
                  <p className="mt-0.5 text-sm font-semibold text-slate-100">{trainer.experience} Years</p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-1.5">
                  <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-slate-500">Rating</p>
                  <p className="mt-0.5 flex items-center gap-1 text-sm font-semibold text-slate-100">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    {trainer.rating}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="rounded-2xl border border-slate-800 bg-slate-900 p-3.5 shadow-[0_12px_36px_rgba(2,6,23,0.28)]"
            >
              <div className="mb-3.5 flex items-center gap-2">
                <UserRound className="h-4 w-4 text-blue-400" />
                <h3 className="text-sm font-semibold text-slate-100">Trainer Information</h3>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-2.5">
                  <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-500">Name</p>
                  <p className="mt-1 text-sm font-semibold text-slate-100">{trainer.name}</p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-2.5">
                  <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-500">Trainer ID</p>
                  <p className="mt-1 text-sm font-semibold text-slate-100">#{trainer.id.slice(0, 8).toUpperCase()}</p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-2.5">
                  <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-500">Phone</p>
                  <p className="mt-1 text-sm font-semibold text-slate-100">{trainer.phone}</p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-2.5">
                  <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-500">Email</p>
                  <p className="mt-1 truncate text-sm font-semibold text-slate-100">{trainer.email}</p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-2.5 sm:col-span-2">
                  <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-500">Emergency Contact</p>
                  <p className="mt-1 text-sm font-semibold text-slate-100">{trainer.emergencyContact || "N/A"}</p>
                </div>
              </div>
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: "easeOut", delay: 0.03 }}
              className="rounded-2xl border border-slate-800 bg-slate-900 p-3.5 shadow-[0_12px_36px_rgba(2,6,23,0.28)]"
            >
              <div className="mb-3.5 flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-blue-400" />
                <h3 className="text-sm font-semibold text-slate-100">Professional Information</h3>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-2.5">
                  <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-500">Specialization</p>
                  <p className="mt-1 text-sm font-semibold text-slate-100">{trainer.specialization}</p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-2.5">
                  <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-500">Status</p>
                  <p className="mt-1 text-sm font-semibold text-slate-100">{trainer.status}</p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-2.5">
                  <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-500">Experience</p>
                  <p className="mt-1 text-sm font-semibold text-slate-100">{trainer.experience} Years</p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-2.5">
                  <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-500">Joining Date</p>
                  <p className="mt-1 text-sm font-semibold text-slate-100">{joinedOn}</p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-2.5 sm:col-span-2">
                  <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-500">Certifications</p>
                  <p className="mt-1 text-sm font-semibold text-slate-100">{trainer.certifications || "N/A"}</p>
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
                <Users className="h-4 w-4 text-blue-400" />
                <h3 className="text-sm font-semibold text-slate-100">Assigned Members</h3>
              </div>
              {trainer.assignedMemberNames.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {trainer.assignedMemberNames.map((name) => (
                    <span
                      key={name}
                      className="inline-flex items-center rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-xs font-medium text-slate-300"
                    >
                      {name}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-sm text-slate-400">
                  No assigned members yet.
                </div>
              )}
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: "easeOut", delay: 0.09 }}
              className="rounded-2xl border border-slate-800 bg-slate-900 p-3.5 shadow-[0_12px_36px_rgba(2,6,23,0.28)]"
            >
              <div className="mb-3.5 flex items-center gap-2">
                <Mail className="h-4 w-4 text-blue-400" />
                <h3 className="text-sm font-semibold text-slate-100">Notes</h3>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-sm text-slate-300">
                {trainer.notes || "No notes available."}
              </div>
            </motion.section>
          </div>
        </motion.div>
      </motion.div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 px-4">
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-[0_24px_64px_rgba(2,6,23,0.45)]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-trainer-title"
          >
            <h3 id="delete-trainer-title" className="text-lg font-semibold text-slate-100">
              Delete Trainer?
            </h3>
            <p className="mt-2 text-sm text-slate-400">This action cannot be undone.</p>

            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="inline-flex items-center rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-600 hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="inline-flex items-center rounded-xl border border-red-800/70 bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-500 disabled:opacity-70"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}
