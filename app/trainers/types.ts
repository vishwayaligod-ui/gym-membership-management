export type TrainerStatus = "Active" | "On Leave" | "Inactive";

export type Trainer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialization: string;
  experience: number;
  assignedMembers: number;
  assignedMemberNames: string[];
  status: TrainerStatus;
  avatar: string;
  rating: number;
  joiningDate: string | null;
  certifications: string | null;
  emergencyContact: string | null;
  notes: string | null;
};

export type TrainersKPIs = {
  totalTrainers: number;
  activeTrainers: number;
  onLeaveTrainers: number;
  totalAssignedMembers: number;
};

export type TrainersResponse = {
  trainers: Trainer[];
  kpis: TrainersKPIs;
};

export const trainerStatusColors: Record<TrainerStatus, { bg: string; text: string; dot: string }> = {
  Active: { bg: "bg-emerald-900/30", text: "text-emerald-400", dot: "bg-emerald-400" },
  "On Leave": { bg: "bg-amber-900/30", text: "text-amber-400", dot: "bg-amber-400" },
  Inactive: { bg: "bg-slate-700/40", text: "text-slate-400", dot: "bg-slate-400" },
};
