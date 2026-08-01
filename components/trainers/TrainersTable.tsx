"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, Pencil, Trash2, ChevronDown, Star } from "lucide-react";
import { motion } from "framer-motion";
import { type Trainer } from "@/app/trainers/types";
import { TrainerStatusBadge } from "@/app/trainers/TrainerStatusBadge";

type TrainersTableProps = {
  trainers: Trainer[];
  onDelete: (trainer: Trainer) => void;
};

export function TrainersTable({ trainers, onDelete }: TrainersTableProps) {
  const router = useRouter();
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  if (trainers.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-xl border border-slate-700/60 bg-slate-800/40">
      {/* Table Header */}
      <div className="hidden md:grid md:grid-cols-[56px_200px_140px_120px_120px_120px_100px_80px] gap-3 border-b border-slate-700/60 px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500">
        <div />
        <div>Trainer</div>
        <div>Specialization</div>
        <div>Experience</div>
        <div>Members</div>
        <div>Rating</div>
        <div>Status</div>
        <div />
      </div>

      {/* Table Rows */}
      <div className="divide-y divide-slate-700/40">
        {trainers.map((trainer, idx) => (
          <motion.div
            key={trainer.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.03 }}
            onMouseEnter={() => setHoveredRow(trainer.id)}
            onMouseLeave={() => setHoveredRow(null)}
            onClick={() => router.push(`/trainers/${trainer.id}`)}
            className={`grid grid-cols-1 md:grid-cols-[56px_200px_140px_120px_120px_120px_100px_80px] gap-3 px-5 py-4 transition-all duration-200 cursor-pointer ${
              hoveredRow === trainer.id ? "bg-slate-700/40 shadow-[0_2px_8px_rgba(0,0,0,0.15)]" : "bg-transparent"
            }`}
          >
            {/* Avatar */}
            <div className="hidden md:flex items-center">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 text-[11px] font-bold text-white shadow-sm shadow-emerald-900/30">
                {trainer.avatar}
              </div>
            </div>

            {/* Mobile Row */}
            <div className="flex items-center gap-3 md:hidden">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 text-[11px] font-bold text-white shadow-sm shadow-emerald-900/30">
                {trainer.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-slate-200 truncate">{trainer.name}</p>
                  <TrainerStatusBadge status={trainer.status} />
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">{trainer.specialization}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[10px] text-slate-500 whitespace-nowrap">{trainer.experience} yrs exp</span>
                  <span className="flex items-center gap-0.5 text-[10px] text-amber-400">
                    <Star className="h-3 w-3 fill-amber-400" />
                    {trainer.rating}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    router.push(`/trainers/${trainer.id}/edit`);
                  }}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700 bg-slate-900/70 text-slate-300 transition hover:border-slate-600 hover:text-white"
                  aria-label={`Edit ${trainer.name}`}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onDelete(trainer);
                  }}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-900/40 bg-red-950/20 text-red-300 transition hover:border-red-700/60 hover:text-red-200"
                  aria-label={`Delete ${trainer.name}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Desktop: Trainer column — Name + Email */}
            <div className="hidden md:flex items-center min-w-0">
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-slate-200 truncate">{trainer.name}</p>
                <p className="text-[11px] text-slate-500 truncate">{trainer.email}</p>
              </div>
            </div>

            {/* Desktop: Specialization */}
            <div className="hidden md:flex items-center">
              <span className="rounded-md border border-slate-600/50 bg-slate-700/30 px-2.5 py-1 text-[11px] font-semibold text-slate-300 whitespace-nowrap">
                {trainer.specialization}
              </span>
            </div>

            {/* Desktop: Experience */}
            <div className="hidden md:flex items-center">
              <span className="text-[12px] text-slate-400 whitespace-nowrap">{trainer.experience} years</span>
            </div>

            {/* Desktop: Assigned Members */}
            <div className="hidden md:flex items-center">
              <span className="text-[12px] text-slate-400 whitespace-nowrap">{trainer.assignedMembers} members</span>
            </div>

            {/* Desktop: Rating */}
            <div className="hidden md:flex items-center gap-1">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              <span className="text-[12px] font-semibold text-slate-300">{trainer.rating}</span>
            </div>

            {/* Desktop: Status */}
            <div className="hidden md:flex items-center">
              <TrainerStatusBadge status={trainer.status} />
            </div>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center justify-end gap-1">
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  router.push(`/trainers/${trainer.id}`);
                }}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700/80 bg-slate-900/70 text-slate-300 transition hover:border-slate-600 hover:text-white"
                aria-label={`View ${trainer.name}`}
              >
                <Eye className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  router.push(`/trainers/${trainer.id}/edit`);
                }}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700/80 bg-slate-900/70 text-slate-300 transition hover:border-slate-600 hover:text-white"
                aria-label={`Edit ${trainer.name}`}
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onDelete(trainer);
                }}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-900/50 bg-red-950/20 text-red-300 transition hover:border-red-700/60 hover:text-red-200"
                aria-label={`Delete ${trainer.name}`}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
              <ChevronDown className={`h-3.5 w-3.5 text-slate-600 transition-transform duration-200 ${
                hoveredRow === trainer.id ? "rotate-[-90deg]" : ""
              }`} />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}