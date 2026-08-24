"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Pencil, Power, KeyRound, Trash2, ChevronDown, ShieldCheck } from "lucide-react";
import { type UserRole } from "@prisma/client";
import {
  ownerRoles,
  type UserManagementUser,
  userRoleLabels,
  userRoleStyles,
} from "@/app/settings/user-management/types";

type UserTableProps = {
  users: UserManagementUser[];
  currentUserId: string | null;
  ownerCount: number;
  onEdit: (user: UserManagementUser) => void;
  onToggleStatus: (user: UserManagementUser) => void;
  onResetPassword: (user: UserManagementUser) => void;
  onDelete: (user: UserManagementUser) => void;
  busyUserId?: string | null;
  deletingUserId?: string | null;
  resettingUserId?: string | null;
};

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function isOwnerRole(role: UserRole) {
  return ownerRoles.includes(role as (typeof ownerRoles)[number]);
}

export function UserTable({
  users,
  currentUserId,
  ownerCount,
  onEdit,
  onToggleStatus,
  onResetPassword,
  onDelete,
  busyUserId,
  deletingUserId,
  resettingUserId,
}: UserTableProps) {
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  if (users.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-800/40">
      <div className="hidden md:grid md:grid-cols-[56px_minmax(180px,1.4fr)_130px_140px_100px_120px_80px] gap-3 border-b border-slate-700/60 px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500">
        <div />
        <div>User</div>
        <div>Role</div>
        <div>Phone</div>
        <div>Status</div>
        <div>Joined</div>
        <div className="text-right">Actions</div>
      </div>

      <div className="divide-y divide-slate-700/40">
        {users.map((user, index) => {
          const roleStyle = userRoleStyles[user.role];
          const isCurrentUser = user.id === currentUserId;
          const canDelete = !isCurrentUser && !(isOwnerRole(user.role) && ownerCount <= 1);
          const canDeactivate = !(isCurrentUser && user.isActive);

          return (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.03 }}
              onMouseEnter={() => setHoveredRow(user.id)}
              onMouseLeave={() => setHoveredRow(null)}
              className={cn(
                "grid grid-cols-1 gap-3 px-5 py-4 transition-all duration-200 md:grid-cols-[56px_minmax(180px,1.4fr)_130px_140px_100px_120px_80px]",
                hoveredRow === user.id ? "bg-slate-700/40 shadow-[0_2px_8px_rgba(0,0,0,0.15)]" : "bg-transparent"
              )}
            >
              <div className="hidden md:flex items-center">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-[11px] font-bold text-white shadow-sm shadow-blue-900/30">
                  {user.avatar}
                </div>
              </div>

              <div className="flex items-center gap-3 md:hidden">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-[11px] font-bold text-white shadow-sm shadow-blue-900/30">
                  {user.avatar}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold text-slate-200">{user.fullName}</p>
                    {isCurrentUser ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-blue-900/40 bg-blue-900/20 px-2 py-0.5 text-[10px] font-semibold text-blue-300">
                        <ShieldCheck className="h-3 w-3" />
                        You
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-0.5 truncate text-[11px] text-slate-500">{user.email}</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                        roleStyle.bg,
                        roleStyle.text,
                        roleStyle.border
                      )}
                    >
                      {userRoleLabels[user.role]}
                    </span>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                        user.isActive
                          ? "border-emerald-900/40 bg-emerald-900/20 text-emerald-300"
                          : "border-slate-700 bg-slate-800/60 text-slate-400"
                      )}
                    >
                      {user.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="hidden min-w-0 md:flex md:items-center">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-[13px] font-semibold text-slate-200">{user.fullName}</p>
                    {isCurrentUser ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-blue-900/40 bg-blue-900/20 px-2 py-0.5 text-[10px] font-semibold text-blue-300">
                        <ShieldCheck className="h-3 w-3" />
                        You
                      </span>
                    ) : null}
                  </div>
                  <p className="truncate text-[11px] text-slate-500">{user.email}</p>
                </div>
              </div>

              <div className="hidden md:flex md:items-center">
                <span
                  className={cn(
                    "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap",
                    roleStyle.bg,
                    roleStyle.text,
                    roleStyle.border
                  )}
                >
                  {userRoleLabels[user.role]}
                </span>
              </div>

              <div className="hidden md:flex md:items-center">
                <span className="text-[12px] text-slate-400 whitespace-nowrap">{user.phone || "Not provided"}</span>
              </div>

              <div className="hidden md:flex md:items-center">
                <span
                  className={cn(
                    "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap",
                    user.isActive
                      ? "border-emerald-900/40 bg-emerald-900/20 text-emerald-300"
                      : "border-slate-700 bg-slate-800/60 text-slate-400"
                  )}
                >
                  {user.isActive ? "Active" : "Inactive"}
                </span>
              </div>

              <div className="hidden md:flex md:items-center">
                <span className="text-[12px] text-slate-400 whitespace-nowrap">{formatDate(user.createdAt)}</span>
              </div>

              <div className="hidden md:flex md:items-center justify-end gap-1.5">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onEdit(user);
                  }}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-all duration-200 ease-out hover:bg-blue-900/30 hover:text-blue-400"
                  title="Edit user"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    if (!canDeactivate) return;
                    onToggleStatus(user);
                  }}
                  disabled={!canDeactivate || busyUserId === user.id}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-all duration-200 ease-out hover:bg-emerald-900/30 hover:text-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
                  title={user.isActive ? "Deactivate user" : "Activate user"}
                >
                  {busyUserId === user.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Power className="h-3.5 w-3.5" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onResetPassword(user);
                  }}
                  disabled={resettingUserId === user.id}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-all duration-200 ease-out hover:bg-amber-900/30 hover:text-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
                  title="Reset password"
                >
                  {resettingUserId === user.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <KeyRound className="h-3.5 w-3.5" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    if (!canDelete) return;
                    onDelete(user);
                  }}
                  disabled={!canDelete || deletingUserId === user.id}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-all duration-200 ease-out hover:bg-red-900/30 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-50"
                  title={
                    isCurrentUser
                      ? "You cannot delete your own account"
                      : isOwnerRole(user.role) && ownerCount <= 1
                        ? "Cannot delete the last OWNER account"
                        : "Delete user"
                  }
                >
                  {deletingUserId === user.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                </button>
                <ChevronDown className={cn("h-3.5 w-3.5 text-slate-600 transition-transform duration-200", hoveredRow === user.id ? "rotate-[-90deg]" : "")} />
              </div>

              <div className="flex items-center gap-2 md:hidden">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onEdit(user);
                  }}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-[11px] font-semibold text-slate-200 transition hover:border-slate-600"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    if (!canDeactivate) return;
                    onToggleStatus(user);
                  }}
                  disabled={!canDeactivate || busyUserId === user.id}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-emerald-900/40 bg-emerald-950/20 px-3 py-2 text-[11px] font-semibold text-emerald-300 transition hover:bg-emerald-950/30 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {busyUserId === user.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Power className="h-3.5 w-3.5" />
                  )}
                  {user.isActive ? "Deactivate" : "Activate"}
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
