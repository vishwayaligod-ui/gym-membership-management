export type PlanStatus = "Active" | "Inactive";

export type MembershipPlan = {
  id: string;
  name: string;
  duration: string;
  durationInDays: number;
  joiningFee: number;
  membershipFee: number;
  freezeDays: number;
  membersUsing: number;
  status: PlanStatus;
  description: string;
};

export type ApiPlan = {
  id: string;
  name: string;
  durationInDays: number;
  price: number;
  joiningFee: number;
  freezeDays: number;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  gymId: string;
  _count?: { memberships: number };
};

export function transformPlan(api: ApiPlan): MembershipPlan {
  const days = api.durationInDays;
  let duration = `${days} Days`;
  if (days >= 365) {
    const years = Math.floor(days / 365);
    duration = years === 1 ? "12 Months" : `${years * 12} Months`;
  } else if (days >= 30) {
    const months = Math.floor(days / 30);
    duration = months === 1 ? "1 Month" : `${months} Months`;
  }

  return {
    id: api.id,
    name: api.name,
    duration,
    durationInDays: days,
    joiningFee: Number(api.joiningFee),
    membershipFee: Number(api.price),
    freezeDays: api.freezeDays,
    membersUsing: api._count?.memberships ?? 0,
    status: api.isActive ? "Active" : "Inactive",
    description: api.description ?? "",
  };
}

export const planStatusColors: Record<PlanStatus, { bg: string; text: string; dot: string }> = {
  Active: { bg: "bg-emerald-900/30", text: "text-emerald-400", dot: "bg-emerald-400" },
  Inactive: { bg: "bg-slate-700/40", text: "text-slate-400", dot: "bg-slate-400" },
};