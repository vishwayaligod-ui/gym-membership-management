"use client";

import { type TrainerStatus, trainerStatusColors } from "./types";

type TrainerStatusBadgeProps = {
  status: TrainerStatus;
};

export function TrainerStatusBadge({ status }: TrainerStatusBadgeProps) {
  const colors = trainerStatusColors[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full ${colors.bg} px-[10px] py-1 text-[11px] font-bold ${colors.text} whitespace-nowrap`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${colors.dot}`} />
      {status}
    </span>
  );
}