"use client";

import { useState } from "react";
import { ChevronDown, IndianRupee, Snowflake, Users, CalendarDays } from "lucide-react";
import { motion } from "framer-motion";
import { type MembershipPlan } from "@/app/membership-plans/types";
import { PlanStatusBadge } from "@/app/membership-plans/PlanStatusBadge";

type PlansTableProps = {
  plans: MembershipPlan[];
  onEdit: (plan: MembershipPlan) => void;
  onDuplicate: (plan: MembershipPlan) => void;
  onToggleStatus: (plan: MembershipPlan) => void;
  onDelete: (plan: MembershipPlan) => void;
};

export function PlansTable({ plans, onEdit, onDuplicate, onToggleStatus, onDelete }: PlansTableProps) {
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  if (plans.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-xl border border-slate-700/60 bg-slate-800/40">
      {/* Table Header */}
      <div className="hidden md:grid md:grid-cols-[180px_120px_120px_130px_110px_120px_100px_80px] gap-3 border-b border-slate-700/60 px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500">
        <div>Plan Name</div>
        <div>Duration</div>
        <div>Joining Fee</div>
        <div>Membership Fee</div>
        <div>Freeze Days</div>
        <div>Members Using</div>
        <div>Status</div>
        <div />
      </div>

      {/* Table Rows */}
      <div className="divide-y divide-slate-700/40">
        {plans.map((plan, idx) => (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.03 }}
            onMouseEnter={() => setHoveredRow(plan.id)}
            onMouseLeave={() => setHoveredRow(null)}
            className={`grid grid-cols-1 md:grid-cols-[180px_120px_120px_130px_110px_120px_100px_80px] gap-3 px-5 py-4 transition-all duration-200 ${
              hoveredRow === plan.id ? "bg-slate-700/40 shadow-[0_2px_8px_rgba(0,0,0,0.15)]" : "bg-transparent"
            }`}
          >
            {/* Mobile Row */}
            <div className="flex items-center gap-3 md:hidden">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-slate-200 truncate">{plan.name}</p>
                  <PlanStatusBadge status={plan.status} />
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">{plan.duration}</p>
                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                  <span className="flex items-center gap-1 text-[10px] text-slate-500">
                    <IndianRupee className="h-3 w-3" />
                    ₹{plan.membershipFee.toLocaleString("en-IN")}
                  </span>
                  <span className="flex items-center gap-1 text-[10px] text-slate-500">
                    <Users className="h-3 w-3" />
                    {plan.membersUsing}
                  </span>
                  <span className="flex items-center gap-1 text-[10px] text-slate-500">
                    <Snowflake className="h-3 w-3" />
                    {plan.freezeDays}d
                  </span>
                </div>
              </div>
            </div>

            {/* Desktop: Plan Name */}
            <div className="hidden md:flex items-center min-w-0">
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-slate-200 truncate">{plan.name}</p>
                <p className="text-[11px] text-slate-500 truncate">{plan.description}</p>
              </div>
            </div>

            {/* Desktop: Duration */}
            <div className="hidden md:flex items-center">
              <div className="flex items-center gap-1.5 text-slate-300">
                <CalendarDays className="h-3.5 w-3.5 text-slate-500" />
                <span className="text-[12px] whitespace-nowrap">{plan.duration}</span>
              </div>
            </div>

            {/* Desktop: Joining Fee */}
            <div className="hidden md:flex items-center">
              <span className="text-[12px] text-slate-400 whitespace-nowrap">
                {plan.joiningFee > 0 ? `₹${plan.joiningFee.toLocaleString("en-IN")}` : "—"}
              </span>
            </div>

            {/* Desktop: Membership Fee */}
            <div className="hidden md:flex items-center">
              <div className="flex items-center gap-1 text-slate-300">
                <IndianRupee className="h-3.5 w-3.5 text-slate-500" />
                <span className="text-[12px] font-medium whitespace-nowrap">
                  ₹{plan.membershipFee.toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            {/* Desktop: Freeze Days */}
            <div className="hidden md:flex items-center">
              <div className="flex items-center gap-1.5 text-slate-300">
                <Snowflake className="h-3.5 w-3.5 text-slate-500" />
                <span className="text-[12px] whitespace-nowrap">{plan.freezeDays} days</span>
              </div>
            </div>

            {/* Desktop: Members Using */}
            <div className="hidden md:flex items-center">
              <div className="flex items-center gap-1.5 text-slate-300">
                <Users className="h-3.5 w-3.5 text-slate-500" />
                <span className="text-[12px] whitespace-nowrap">{plan.membersUsing}</span>
              </div>
            </div>

            {/* Desktop: Status */}
            <div className="hidden md:flex items-center">
              <PlanStatusBadge status={plan.status} />
            </div>

            {/* Actions */}
            <div className="hidden md:flex items-center justify-end relative">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenMenuId(openMenuId === plan.id ? null : plan.id);
                }}
                className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-all ${
                  hoveredRow === plan.id || openMenuId === plan.id
                    ? "border-slate-600 bg-slate-700/50 text-slate-200 opacity-100"
                    : "border-slate-700 bg-slate-800/50 text-slate-400 opacity-0 group-hover:opacity-100"
                }`}
                type="button"
              >
                <ChevronDown className="h-4 w-4" />
              </motion.button>

              {openMenuId === plan.id && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -4 }}
                  transition={{ duration: 0.12 }}
                  className="absolute right-0 top-full z-50 mt-1 w-44 overflow-hidden rounded-xl border border-slate-700 bg-slate-800 shadow-xl shadow-black/30"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => {
                      setOpenMenuId(null);
                      onEdit(plan);
                    }}
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-[13px] font-medium text-slate-300 transition-colors hover:bg-slate-700/50 hover:text-slate-100"
                    type="button"
                  >
                    <svg className="h-3.5 w-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      setOpenMenuId(null);
                      onDuplicate(plan);
                    }}
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-[13px] font-medium text-slate-300 transition-colors hover:bg-slate-700/50 hover:text-slate-100"
                    type="button"
                  >
                    <svg className="h-3.5 w-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Duplicate
                  </button>
                  <button
                    onClick={() => {
                      setOpenMenuId(null);
                      onToggleStatus(plan);
                    }}
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-[13px] font-medium text-slate-300 transition-colors hover:bg-slate-700/50 hover:text-slate-100"
                    type="button"
                  >
                    <svg className="h-3.5 w-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    {plan.status === "Active" ? "Deactivate" : "Activate"}
                  </button>
                  <div className="border-t border-slate-700/60" />
                  <button
                    onClick={() => {
                      setOpenMenuId(null);
                      onDelete(plan);
                    }}
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-[13px] font-medium text-red-400 transition-colors hover:bg-red-950/30"
                    type="button"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete
                  </button>
                </motion.div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}