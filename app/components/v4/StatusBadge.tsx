"use client";

import { type MemberStatus, statusColors } from "@/app/members/types";

type StatusBadgeProps = {
  status: MemberStatus;
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const colors = statusColors[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full ${colors.bg} px-[10px] py-1 text-[11px] font-bold ${colors.text} whitespace-nowrap`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${colors.dot}`} />
      {status}
    </span>
  );
}