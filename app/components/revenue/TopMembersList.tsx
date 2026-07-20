"use client";

import { motion } from "framer-motion";
import { Crown } from "lucide-react";
import type { TopMember } from "../../revenue/mockRevenue";

type TopMembersListProps = {
  data: TopMember[];
};

export function TopMembersList({ data }: TopMembersListProps) {
  return (
    <section className="rounded-[1.6rem] border border-slate-200 bg-white p-4 shadow-[0_10px_35px_rgba(15,23,42,0.06)] sm:p-5">
      <div>
        <p className="text-sm font-semibold text-slate-900">Top Revenue Members</p>
        <p className="text-sm text-slate-500">Highest paying members this month</p>
      </div>

      <div className="mt-4 space-y-2">
        {data.map((member, i) => (
          <motion.div
            key={member.name}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2, delay: i * 0.04, ease: "easeOut" }}
            className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/70 px-3 py-2.5"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-500 text-xs font-semibold text-white">
                {member.avatar}
                {i === 0 && (
                  <span className="absolute -top-1.5 -right-1.5">
                    <Crown className="h-3.5 w-3.5 text-amber-400 drop-shadow-sm" />
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">{member.name}</p>
                <p className="text-xs text-slate-500">{member.plan}</p>
              </div>
            </div>
            <p className="shrink-0 text-sm font-bold text-slate-900">
              ₹{member.amount.toLocaleString("en-US")}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}