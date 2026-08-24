"use client";

import { useState } from "react";
import { IndianRupee, Snowflake, Users, CalendarDays, Pencil, Trash2 } from "lucide-react";
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

  void onDuplicate;
  void onToggleStatus;

  if (plans.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-xl border border-slate-700/60 bg-slate-800/40">
      {/* Table Header */}
      <div className="hidden md:grid md:grid-cols-[minmax(150px,1.35fr)_90px_90px_110px_90px_95px_80px_minmax(150px,1fr)] gap-2 border-b border-slate-700/60 px-4 py-3.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500 lg:grid-cols-[minmax(170px,1.35fr)_105px_105px_120px_95px_110px_90px_minmax(170px,1fr)] xl:grid-cols-[minmax(180px,1.35fr)_115px_115px_130px_100px_120px_100px_minmax(180px,1fr)]">
        <div>Plan Name</div>
        <div>Duration</div>
        <div>Joining Fee</div>
        <div>Membership Fee</div>
        <div>Freeze Days</div>
        <div>Members Using</div>
        <div>Status</div>
        <div className="text-right">Actions</div>
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
            className={`grid grid-cols-1 md:grid-cols-[minmax(150px,1.35fr)_90px_90px_110px_90px_95px_80px_minmax(150px,1fr)] gap-2 px-4 py-4 transition-all duration-200 lg:grid-cols-[minmax(170px,1.35fr)_105px_105px_120px_95px_110px_90px_minmax(170px,1fr)] xl:grid-cols-[minmax(180px,1.35fr)_115px_115px_130px_100px_120px_100px_minmax(180px,1fr)] ${
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
                <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                  <button
                    onClick={() => onEdit(plan)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-600 bg-slate-700/40 px-2.5 py-1.5 text-[11px] font-semibold text-slate-200 transition-all hover:bg-slate-700/60"
                    type="button"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(plan)}
                    disabled={plan.membersUsing > 0}
                    title={
                      plan.membersUsing > 0
                        ? "Cannot delete a plan that is assigned to members"
                        : "Delete plan"
                    }
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition-all ${
                      plan.membersUsing > 0
                        ? "cursor-not-allowed border-slate-700 bg-slate-800/60 text-slate-500"
                        : "border-red-800/50 bg-red-950/30 text-red-400 hover:bg-red-950/45"
                    }`}
                    type="button"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
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
            <div className="hidden md:flex items-center justify-end">
              <div className="flex flex-col items-stretch gap-2 lg:flex-row lg:flex-wrap lg:items-center lg:justify-end xl:flex-nowrap">
                <button
                  onClick={() => onEdit(plan)}
                  className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-slate-600 bg-slate-700/40 px-2.5 py-1.5 text-[11px] font-semibold text-slate-200 transition-all hover:bg-slate-700/60"
                  type="button"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </button>
                <button
                  onClick={() => onDelete(plan)}
                  disabled={plan.membersUsing > 0}
                  title={
                    plan.membersUsing > 0
                      ? "Cannot delete a plan that is assigned to members"
                      : "Delete plan"
                  }
                  className={`inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition-all ${
                    plan.membersUsing > 0
                      ? "cursor-not-allowed border-slate-700 bg-slate-800/60 text-slate-500"
                      : "border-red-800/50 bg-red-950/30 text-red-400 hover:bg-red-950/45"
                  }`}
                  type="button"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}