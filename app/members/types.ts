export type MemberStatus = "Active" | "Expiring" | "Expired" | "Pending";

export type Member = {
  id: string;
  name: string;
  username: string;
  plan: string;
  phone: string;
  email: string;
  gender: "Male" | "Female";
  joinedOn: string;
  expiresOn: string;
  status: MemberStatus;
  avatar: string;
  streak: number;
  lifetimeRevenue: number;
  visits: number;
  mtd: number;
  discount: number;
  amountPaid: number;
  balanceDue: number;
};

export type MembersKPIs = {
  totalMembers: number;
  activeMembers: number;
  expiringSoon: number;
  newThisMonth: number;
};

export type MembersResponse = {
  members: Member[];
  kpis: MembersKPIs;
};

export const planColors: Record<string, string> = {
  Platinum: "bg-gradient-to-r from-blue-600/20 to-blue-500/20 text-blue-400 border-blue-500/30",
  Premium: "bg-gradient-to-r from-purple-600/20 to-purple-500/20 text-purple-400 border-purple-500/30",
  Classic: "bg-gradient-to-r from-emerald-600/20 to-emerald-500/20 text-emerald-400 border-emerald-500/30",
  Basic: "bg-gradient-to-r from-slate-600/20 to-slate-500/20 text-slate-400 border-slate-500/30",
};

export const statusColors: Record<MemberStatus, { bg: string; text: string; dot: string }> = {
  Active: { bg: "bg-emerald-900/30", text: "text-emerald-400", dot: "bg-emerald-400" },
  Expiring: { bg: "bg-amber-900/30", text: "text-amber-400", dot: "bg-amber-400" },
  Expired: { bg: "bg-red-900/30", text: "text-red-400", dot: "bg-red-400" },
  Pending: { bg: "bg-slate-700/40", text: "text-slate-400", dot: "bg-slate-400" },
};