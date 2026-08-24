import type { UserRole } from "@prisma/client";

export type UserManagementUser = {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  avatar: string;
};

export type UsersPageResponse = {
  users: UserManagementUser[];
  currentUserId: string;
  ownerCount: number;
};

export type UserRoleOption = {
  value: UserRole;
  label: string;
};

export const ownerRoles = ["GYM_OWNER", "SUPER_ADMIN"] as const satisfies readonly UserRole[];

export const userRoleOptions: UserRoleOption[] = [
  { value: "GYM_OWNER", label: "Gym Owner" },
  { value: "SUPER_ADMIN", label: "Super Admin" },
  { value: "BRANCH_MANAGER", label: "Branch Manager" },
  { value: "RECEPTIONIST", label: "Receptionist" },
  { value: "TRAINER", label: "Trainer" },
];

export const userRoleLabels: Record<UserRole, string> = {
  SUPER_ADMIN: "Super Admin",
  GYM_OWNER: "Gym Owner",
  BRANCH_MANAGER: "Branch Manager",
  RECEPTIONIST: "Receptionist",
  TRAINER: "Trainer",
};

export const userRoleStyles: Record<UserRole, { bg: string; text: string; border: string }> = {
  SUPER_ADMIN: {
    bg: "bg-blue-900/25",
    text: "text-blue-300",
    border: "border-blue-900/40",
  },
  GYM_OWNER: {
    bg: "bg-amber-900/25",
    text: "text-amber-300",
    border: "border-amber-900/40",
  },
  BRANCH_MANAGER: {
    bg: "bg-violet-900/25",
    text: "text-violet-300",
    border: "border-violet-900/40",
  },
  RECEPTIONIST: {
    bg: "bg-emerald-900/25",
    text: "text-emerald-300",
    border: "border-emerald-900/40",
  },
  TRAINER: {
    bg: "bg-slate-700/40",
    text: "text-slate-300",
    border: "border-slate-600/40",
  },
};
