"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Clock3, MoreHorizontal, Phone, ShieldCheck, UserRound } from "lucide-react";
import type { AttendanceRecord } from "../attendance/types";

type AttendanceCardProps = {
  member: AttendanceRecord;
};

export function AttendanceCard({ member }: AttendanceCardProps) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      whileHover={{ y: -2, scale: 1.01 }}
      className="rounded-[1.4rem] border border-slate-200 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-500 text-sm font-semibold text-white shadow-lg shadow-blue-600/20">
            {member.avatar}
          </div>
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-slate-900">{member.name}</p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
                {member.plan}
              </span>
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                Active
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
        <div className="rounded-2xl bg-slate-50 p-3">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
            <Phone className="h-3.5 w-3.5" />
            Phone
          </div>
          <p className="mt-1 font-medium text-slate-700">+91 98765 43210</p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-3">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
            <ShieldCheck className="h-3.5 w-3.5" />
            Expires
          </div>
          <p className="mt-1 font-medium text-slate-700">Jul 12, 2026</p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Check-in</p>
          <p className="mt-1 font-medium text-slate-700">{member.checkIn}</p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Check-out</p>
          <p className="mt-1 font-medium text-slate-700">{member.checkOut}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button className="flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-600" type="button">
          <CheckCircle2 className="h-4 w-4" />
          Check In
        </button>
        <button className="flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-600" type="button">
          <Clock3 className="h-4 w-4" />
          Check Out
        </button>
        <button className="flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-600" type="button">
          <UserRound className="h-4 w-4" />
          View Profile
        </button>
        <button className="ml-auto flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-600" type="button">
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>
    </motion.article>
  );
}
