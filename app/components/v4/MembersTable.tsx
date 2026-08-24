"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Repeat, Trash2, ChevronDown, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { type Member, planColors } from "@/app/members/types";
import { StatusBadge } from "./StatusBadge";

function formatINR(value: number): string {
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value).toString();
  const [intPart, decPart] = abs.split(".");
  const last3 = intPart.slice(-3);
  const rest = intPart.slice(0, -3);
  const groupedInt = rest ? `${rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",")},${last3}` : last3;
  return `${sign}${groupedInt}${decPart ? `.${decPart}` : ""}`;
}

type MembersTableProps = {
  members: Member[];
  onDelete?: (memberId: string) => Promise<void>;
  isDeleting?: string | null;
};

export function MembersTable({ members, onDelete, isDeleting }: MembersTableProps) {
  const router = useRouter();
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  if (members.length === 0) return null;

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-700/60 bg-slate-800/40">
      {/* Table Header */}
      <div className="hidden md:grid md:grid-cols-[56px_120px_120px_100px_100px_110px_110px_120px_130px_70px] gap-3 border-b border-slate-700/60 px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500">
        <div />
        <div>Member</div>
        <div>Phone</div>
        <div>Plan</div>
        <div>Join Date</div>
        <div>Expiry Date</div>
        <div>Status</div>
        <div>Payment</div>
        <div>Actions</div>
        <div />
      </div>

      {/* Table Rows */}
      <div className="divide-y divide-slate-700/40">
        {members.map((member, idx) => {
          const planColor = planColors[member.plan] || "text-slate-400";

          return (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.03 }}
              onMouseEnter={() => setHoveredRow(member.id)}
              onMouseLeave={() => setHoveredRow(null)}
              onClick={() => router.push(`/members/${member.id}`)}
              className={`grid grid-cols-1 md:grid-cols-[56px_120px_120px_100px_100px_110px_110px_120px_130px_70px] gap-3 px-5 py-4 transition-all duration-200 cursor-pointer ${
                hoveredRow === member.id ? "bg-slate-700/40 shadow-[0_2px_8px_rgba(0,0,0,0.15)]" : "bg-transparent"
              }`}
            >
              {/* Avatar */}
              <div className="hidden md:flex items-center">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-[11px] font-bold text-white shadow-sm shadow-blue-900/30">
                  {member.avatar}
                </div>
              </div>

              {/* Mobile Row */}
              <div className="flex items-center gap-3 md:hidden">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-[11px] font-bold text-white shadow-sm shadow-blue-900/30">
                  {member.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-200 truncate">{member.name}</p>
                    <StatusBadge status={member.status} />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">{member.phone}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap ${planColor}`}>
                      {member.plan}
                    </span>
                    <span className="text-[10px] text-slate-500 whitespace-nowrap">{member.joinedOn} → {member.expiresOn}</span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                    <span className="text-[9px] text-blue-400/80">Discount: ₹{formatINR(member.discount)}</span>
                    <span className="text-[9px] text-emerald-400/80">Paid: ₹{formatINR(member.amountPaid)}</span>
                    <span className="text-[9px] text-amber-400/80">Due: ₹{formatINR(member.balanceDue)}</span>
                  </div>
                </div>
              </div>

              {/* Desktop: Member column — Name + Username */}
              <div className="hidden md:flex items-center min-w-0">
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-slate-200 truncate">{member.name}</p>
                  <p className="text-[11px] text-slate-500 truncate">{member.username}</p>
                </div>
              </div>

              {/* Desktop: Phone */}
              <div className="hidden md:flex items-center">
                <span className="text-[12px] text-slate-400 whitespace-nowrap">{member.phone}</span>
              </div>

              {/* Desktop: Plan badge */}
              <div className="hidden md:flex items-center">
                <span className={`rounded-md border px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap ${planColor}`}>
                  {member.plan}
                </span>
              </div>

              {/* Desktop: Join Date */}
              <div className="hidden md:flex items-center">
                <span className="text-[12px] text-slate-400 whitespace-nowrap">{member.joinedOn}</span>
              </div>

              {/* Desktop: Expiry Date */}
              <div className="hidden md:flex items-center">
                <span className="text-[12px] text-slate-400 whitespace-nowrap">{member.expiresOn}</span>
              </div>

              {/* Desktop: Status */}
              <div className="hidden md:flex items-center">
                <StatusBadge status={member.status} />
              </div>

              {/* Desktop: Payment */}
              <div className="hidden md:flex items-center">
                <div className="space-y-0.5">
                  <p className="text-[13px] text-emerald-400/80">Paid: ₹{formatINR(member.amountPaid)}</p>
                  <p className="text-[13px] text-amber-400/80">Due: ₹{formatINR(member.balanceDue)}</p>
                  <p className="text-[13px] text-blue-400/80">Discount: ₹{formatINR(member.discount)}</p>
                </div>
              </div>

              {/* Desktop: Actions */}
              <div className="hidden md:flex items-center gap-1">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/members/${member.id}/edit`);
                  }}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-all duration-200 ease-out hover:bg-blue-900/30 hover:text-blue-400"
                  title="Edit"
                  type="button"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/renewals?memberId=${member.id}`);
                  }}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-all duration-200 ease-out hover:bg-blue-900/30 hover:text-blue-400"
                  title="Renew Membership"
                  type="button"
                >
                  <Repeat className="h-3.5 w-3.5" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onDelete) onDelete(member.id);
                  }}
                  disabled={isDeleting === member.id}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-all duration-200 ease-out hover:bg-red-900/30 hover:text-red-400 disabled:opacity-50"
                  title="Delete"
                  type="button"
                >
                  {isDeleting === member.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                </motion.button>
              </div>

              {/* Chevron for mobile */}
              <div className="hidden md:flex items-center justify-end">
                <ChevronDown className={`h-3.5 w-3.5 text-slate-600 transition-transform duration-200 ${
                  hoveredRow === member.id ? "rotate-[-90deg]" : ""
                }`} />
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}