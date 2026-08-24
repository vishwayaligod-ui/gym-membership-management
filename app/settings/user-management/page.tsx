"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle2,
  KeyRound,
  Loader2,
  Plus,
  RefreshCcw,
  Search,
  Shield,
  UserCog,
  UserPlus,
  Users,
  Trash2,
  X,
} from "lucide-react";
import { Toaster, toast } from "sonner";
import { type UserRole } from "@prisma/client";
import { FormField } from "@/app/components/FormField";
import { UserTable } from "@/components/settings/UserTable";
import {
  type UserManagementUser,
  type UsersPageResponse,
  userRoleLabels,
  userRoleOptions,
} from "./types";

type UserMode = "create" | "edit" | "reset";
type FieldErrors = Record<string, string>;

type UserFormState = {
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  password: string;
  confirmPassword: string;
  isActive: boolean;
};

const defaultCreateForm: UserFormState = {
  fullName: "",
  email: "",
  phone: "",
  role: "RECEPTIONIST",
  password: "",
  confirmPassword: "",
  isActive: true,
};

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function getInitials(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "US";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

function formatDate(value: string) {
  return new Date(value).toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function validateCreateForm(form: UserFormState): FieldErrors {
  const errors: FieldErrors = {};
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!form.fullName.trim()) errors.fullName = "Full name is required";
  if (!emailPattern.test(form.email.trim())) errors.email = "Enter a valid email address";
  if (form.password.length < 8) errors.password = "Password must be at least 8 characters";
  if (form.confirmPassword.length < 8) errors.confirmPassword = "Confirm the password";
  if (form.password !== form.confirmPassword) errors.confirmPassword = "Passwords do not match";

  return errors;
}

function validateEditForm(form: UserFormState) {
  const errors: FieldErrors = {};
  if (!form.fullName.trim()) errors.fullName = "Full name is required";
  return errors;
}

function validateResetForm(form: UserFormState) {
  const errors: FieldErrors = {};
  if (form.password.length < 8) errors.password = "Password must be at least 8 characters";
  if (form.confirmPassword.length < 8) errors.confirmPassword = "Confirm the password";
  if (form.password !== form.confirmPassword) errors.confirmPassword = "Passwords do not match";
  return errors;
}

function ModalShell({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string;
  subtitle: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/70 px-3 py-3 sm:items-center sm:px-4">
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.98 }}
        className="w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 p-4 shadow-[0_24px_64px_rgba(2,6,23,0.45)] sm:p-5"
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-modal-title"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 id="user-modal-title" className="text-lg font-semibold text-slate-100">
              {title}
            </h3>
            <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-700 bg-slate-800 text-slate-300 transition hover:border-slate-600 hover:text-white"
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-5">{children}</div>
      </motion.div>
    </div>
  );
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<UserManagementUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "All">("All");
  const [statusFilter, setStatusFilter] = useState<"All" | "Active" | "Inactive">("All");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [ownerCount, setOwnerCount] = useState(0);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [resettingUserId, setResettingUserId] = useState<string | null>(null);
  const [mode, setMode] = useState<UserMode | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserManagementUser | null>(null);
  const [form, setForm] = useState<UserFormState>(defaultCreateForm);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [deleteCandidate, setDeleteCandidate] = useState<UserManagementUser | null>(null);

  const fetchUsers = useCallback(async (showRefreshingState = false) => {
    try {
      if (showRefreshingState) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await fetch("/api/settings/users", { cache: "no-store" });
      const payload = (await response.json().catch(() => null)) as UsersPageResponse & { error?: string } | null;

      if (!response.ok) {
        throw new Error(payload?.error || "Failed to load users");
      }

      setUsers(payload?.users ?? []);
      setCurrentUserId(payload?.currentUserId ?? null);
      setOwnerCount(payload?.ownerCount ?? 0);
      setFieldErrors({});
    } catch (error) {
      console.error("Failed to load users:", error);
      toast.error(error instanceof Error ? error.message : "Failed to load users");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return users.filter((user) => {
      const matchesQuery =
        !query ||
        [user.fullName, user.email, user.phone ?? "", userRoleLabels[user.role]]
          .join(" ")
          .toLowerCase()
          .includes(query);

      const matchesRole = roleFilter === "All" || user.role === roleFilter;
      const matchesStatus =
        statusFilter === "All" || (statusFilter === "Active" ? user.isActive : !user.isActive);

      return matchesQuery && matchesRole && matchesStatus;
    });
  }, [roleFilter, searchQuery, statusFilter, users]);

  const summary = useMemo(() => {
    const activeCount = users.filter((user) => user.isActive).length;
    const inactiveCount = users.length - activeCount;

    return {
      total: users.length,
      active: activeCount,
      inactive: inactiveCount,
      owner: ownerCount,
    };
  }, [ownerCount, users]);

  const closeDialog = () => {
    setMode(null);
    setSelectedUser(null);
    setForm(defaultCreateForm);
    setFieldErrors({});
  };

  const openCreateDialog = () => {
    setSelectedUser(null);
    setMode("create");
    setForm(defaultCreateForm);
    setFieldErrors({});
  };

  const openEditDialog = (user: UserManagementUser) => {
    setSelectedUser(user);
    setMode("edit");
    setForm({
      fullName: user.fullName,
      email: user.email,
      phone: user.phone ?? "",
      role: user.role,
      password: "",
      confirmPassword: "",
      isActive: user.isActive,
    });
    setFieldErrors({});
  };

  const openResetDialog = (user: UserManagementUser) => {
    setSelectedUser(user);
    setMode("reset");
    setForm({ ...defaultCreateForm, email: user.email, fullName: user.fullName, role: user.role });
    setFieldErrors({});
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!mode) return;

    if (mode === "create") {
      const errors = validateCreateForm(form);
      setFieldErrors(errors);
      if (Object.keys(errors).length > 0) {
        toast.error("Please fix the highlighted fields");
        return;
      }

      try {
        setBusyUserId("create");
        const response = await fetch("/api/settings/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fullName: form.fullName,
            email: form.email,
            phone: form.phone,
            role: form.role,
            isActive: form.isActive,
            password: form.password,
            confirmPassword: form.confirmPassword,
          }),
        });

        const payload = (await response.json().catch(() => null)) as { error?: string; fieldErrors?: FieldErrors } | null;
        if (!response.ok) {
          setFieldErrors(payload?.fieldErrors ?? {});
          throw new Error(payload?.error || "Failed to create user");
        }

        toast.success("User created successfully");
        closeDialog();
        await fetchUsers();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to create user");
      } finally {
        setBusyUserId(null);
      }

      return;
    }

    if (!selectedUser) return;

    if (mode === "edit") {
      const errors = validateEditForm(form);
      setFieldErrors(errors);
      if (Object.keys(errors).length > 0) {
        toast.error("Please fix the highlighted fields");
        return;
      }

      try {
        setBusyUserId(selectedUser.id);
        const response = await fetch(`/api/settings/users/${selectedUser.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fullName: form.fullName,
            phone: form.phone,
            role: form.role,
            isActive: form.isActive,
          }),
        });

        const payload = (await response.json().catch(() => null)) as { error?: string; fieldErrors?: FieldErrors } | null;
        if (!response.ok) {
          setFieldErrors(payload?.fieldErrors ?? {});
          throw new Error(payload?.error || "Failed to update user");
        }

        toast.success("User updated successfully");
        closeDialog();
        await fetchUsers();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to update user");
      } finally {
        setBusyUserId(null);
      }

      return;
    }

    if (mode === "reset") {
      const errors = validateResetForm(form);
      setFieldErrors(errors);
      if (Object.keys(errors).length > 0) {
        toast.error("Please fix the highlighted fields");
        return;
      }

      try {
        setResettingUserId(selectedUser.id);
        const response = await fetch(`/api/settings/users/${selectedUser.id}/reset-password`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            password: form.password,
            confirmPassword: form.confirmPassword,
          }),
        });

        const payload = (await response.json().catch(() => null)) as { error?: string; fieldErrors?: FieldErrors } | null;
        if (!response.ok) {
          setFieldErrors(payload?.fieldErrors ?? {});
          throw new Error(payload?.error || "Failed to reset password");
        }

        toast.success("Password reset successfully");
        closeDialog();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to reset password");
      } finally {
        setResettingUserId(null);
      }
    }
  };

  const handleToggleStatus = async (user: UserManagementUser) => {
    if (user.id === currentUserId && user.isActive) {
      toast.error("You cannot deactivate your own account");
      return;
    }

    try {
      setBusyUserId(user.id);
      const response = await fetch(`/api/settings/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !user.isActive }),
      });

      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        throw new Error(payload?.error || "Failed to update user status");
      }

      toast.success(user.isActive ? "User deactivated successfully" : "User activated successfully");
      await fetchUsers(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update user status");
    } finally {
      setBusyUserId(null);
    }
  };

  const handleDelete = async (user: UserManagementUser) => {
    setDeleteCandidate(user);
  };

  const confirmDelete = async () => {
    if (!deleteCandidate) return;

    try {
      setDeletingUserId(deleteCandidate.id);
      const response = await fetch(`/api/settings/users/${deleteCandidate.id}`, {
        method: "DELETE",
      });

      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        throw new Error(payload?.error || "Failed to delete user");
      }

      toast.success("User deleted successfully");
      setDeleteCandidate(null);
      await fetchUsers(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete user");
    } finally {
      setDeletingUserId(null);
    }
  };

  const resetFilters = () => {
    setSearchQuery("");
    setRoleFilter("All");
    setStatusFilter("All");
  };

  const activeModalLabel =
    mode === "create"
      ? "Create User"
      : mode === "edit"
        ? `Edit ${selectedUser?.fullName ?? "User"}`
        : mode === "reset"
          ? `Reset Password${selectedUser ? ` for ${selectedUser.fullName}` : ""}`
          : "";

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.12),_transparent_38%),linear-gradient(180deg,_#020617_0%,_#020617_100%)] text-slate-100">
      <Toaster position="top-right" richColors closeButton />

      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 pb-10 pt-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="rounded-2xl border border-slate-800 bg-slate-900 p-4 sm:p-5"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-900/40 bg-blue-900/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-300">
                <Shield className="h-3.5 w-3.5" />
                Settings / User Management
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-100">User Management</h1>
              <p className="mt-1 text-sm text-slate-500">
                Manage staff users, activation, password resets, and access roles from one place.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/settings"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-300 transition hover:border-slate-600 hover:text-slate-100"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to Settings
              </Link>
              <button
                type="button"
                onClick={() => fetchUsers(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-300 transition hover:border-slate-600 hover:text-slate-100"
              >
                <RefreshCcw className={cn("h-3.5 w-3.5", refreshing ? "animate-spin" : "")} />
                Refresh
              </button>
              <button
                type="button"
                onClick={openCreateDialog}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-700/20 transition hover:from-blue-500 hover:to-blue-400"
              >
                <UserPlus className="h-3.5 w-3.5" />
                Add User
              </button>
            </div>
          </div>
        </motion.div>

        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { label: "Total Users", value: summary.total, icon: Users, tone: "from-blue-600/20 to-blue-900/20" },
            { label: "Active", value: summary.active, icon: CheckCircle2, tone: "from-emerald-600/20 to-emerald-900/20" },
            { label: "OWNER Accounts", value: summary.owner, icon: Shield, tone: "from-amber-600/20 to-amber-900/20" },
            { label: "Inactive", value: summary.inactive, icon: UserCog, tone: "from-slate-700/40 to-slate-800/40" },
          ].map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: 0.03 * index }}
                className={`rounded-2xl border border-slate-800 bg-gradient-to-br ${item.tone} p-4`}
              >
                <div className="flex items-center gap-2 text-slate-400">
                  <Icon className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-semibold uppercase tracking-[0.08em]">{item.label}</span>
                </div>
                <p className="mt-2 text-[24px] font-semibold tabular-nums text-slate-100">{loading ? "..." : item.value}</p>
              </motion.div>
            );
          })}
        </div>

        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.05 }}
          className="mt-4 rounded-2xl border border-slate-800 bg-slate-900 p-4 sm:p-5"
        >
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_180px_140px] md:items-end">
            <FormField label="Search" name="user-search">
              <div className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2.5 focus-within:border-blue-500/60">
                <Search className="h-4 w-4 shrink-0 text-slate-500" />
                <input
                  id="user-search"
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search by name, email, phone, or role"
                  className="w-full border-none bg-transparent text-sm text-slate-200 outline-none placeholder:text-slate-500"
                />
              </div>
            </FormField>

            <FormField label="Role" name="role-filter">
              <select
                id="role-filter"
                value={roleFilter}
                onChange={(event) => setRoleFilter(event.target.value as UserRole | "All")}
                className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-blue-500/60"
              >
                <option value="All">All Roles</option>
                {userRoleOptions.map((option) => (
                  <option key={option.value} value={option.value} className="bg-slate-950 text-slate-100">
                    {option.label}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Status" name="status-filter">
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as "All" | "Active" | "Inactive")}
                className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-blue-500/60"
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </FormField>

            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex h-fit items-center justify-center rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-slate-600"
            >
              Clear Filters
            </button>
          </div>
        </motion.section>

        <div className="mt-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-800 bg-slate-900 py-20">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
              <p className="mt-4 text-sm text-slate-500">Loading users...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-900/20 text-blue-300">
                <UserPlus className="h-6 w-6" />
              </div>
              <h2 className="mt-4 text-lg font-semibold text-slate-100">No users found</h2>
              <p className="mt-2 text-sm text-slate-500">
                {users.length === 0
                  ? "Create the first staff account to start managing access."
                  : "Adjust the search or filters to see more users."}
              </p>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                {users.length > 0 ? (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-600"
                  >
                    Reset Filters
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={openCreateDialog}
                  className="rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-700/20 transition hover:from-blue-500 hover:to-blue-400"
                >
                  Add User
                </button>
              </div>
            </div>
          ) : (
            <UserTable
              users={filteredUsers}
              currentUserId={currentUserId}
              ownerCount={ownerCount}
              onEdit={openEditDialog}
              onToggleStatus={handleToggleStatus}
              onResetPassword={openResetDialog}
              onDelete={handleDelete}
              busyUserId={busyUserId}
              deletingUserId={deletingUserId}
              resettingUserId={resettingUserId}
            />
          )}
        </div>
      </div>

      {mode ? (
        <ModalShell
          title={activeModalLabel}
          subtitle={
            mode === "create"
              ? "Create a new staff account with a hashed password."
              : mode === "edit"
                ? "Update the user profile and access role. Email stays locked."
                : "Set a new password for this user."
          }
          onClose={closeDialog}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode !== "reset" ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Full Name" name="user-full-name" required error={fieldErrors.fullName}>
                  <input
                    id="user-full-name"
                    type="text"
                    value={form.fullName}
                    onChange={(event) => setForm((prev) => ({ ...prev, fullName: event.target.value }))}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-blue-500/60"
                  />
                </FormField>

                <FormField label="Email" name="user-email" required error={fieldErrors.email}>
                  <input
                    id="user-email"
                    type="email"
                    value={form.email}
                    onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                    disabled={mode === "edit"}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-blue-500/60 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </FormField>

                <FormField label="Phone" name="user-phone" error={fieldErrors.phone}>
                  <input
                    id="user-phone"
                    type="tel"
                    value={form.phone}
                    onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-blue-500/60"
                  />
                </FormField>

                <FormField label="Role" name="user-role" required error={fieldErrors.role}>
                  <select
                    id="user-role"
                    value={form.role}
                    onChange={(event) => setForm((prev) => ({ ...prev, role: event.target.value as UserRole }))}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-blue-500/60"
                  >
                    {userRoleOptions.map((option) => (
                      <option key={option.value} value={option.value} className="bg-slate-950 text-slate-100">
                        {option.label}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Status" name="user-status" error={fieldErrors.isActive}>
                  <select
                    id="user-status"
                    value={form.isActive ? "active" : "inactive"}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        isActive: event.target.value === "active",
                      }))
                    }
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-blue-500/60"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </FormField>

                <div className="sm:col-span-2 grid gap-4 sm:grid-cols-2">
                  <FormField label="Password" name="user-password" required error={fieldErrors.password}>
                    <input
                      id="user-password"
                      type="password"
                      value={form.password}
                      onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                      autoComplete="new-password"
                      className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-blue-500/60"
                    />
                  </FormField>

                  <FormField label="Confirm Password" name="user-confirm-password" required error={fieldErrors.confirmPassword}>
                    <input
                      id="user-confirm-password"
                      type="password"
                      value={form.confirmPassword}
                      onChange={(event) => setForm((prev) => ({ ...prev, confirmPassword: event.target.value }))}
                      autoComplete="new-password"
                      className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-blue-500/60"
                    />
                  </FormField>
                </div>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Password" name="reset-password" required error={fieldErrors.password}>
                  <input
                    id="reset-password"
                    type="password"
                    value={form.password}
                    onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                    autoComplete="new-password"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-blue-500/60"
                  />
                </FormField>

                <FormField label="Confirm Password" name="reset-confirm-password" required error={fieldErrors.confirmPassword}>
                  <input
                    id="reset-confirm-password"
                    type="password"
                    value={form.confirmPassword}
                    onChange={(event) => setForm((prev) => ({ ...prev, confirmPassword: event.target.value }))}
                    autoComplete="new-password"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-blue-500/60"
                  />
                </FormField>
              </div>
            )}

            <div className="flex flex-col-reverse gap-2.5 pt-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeDialog}
                className="inline-flex items-center justify-center rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-slate-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busyUserId === "create" || (selectedUser ? busyUserId === selectedUser.id || resettingUserId === selectedUser.id || deletingUserId === selectedUser.id : false)}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-700/20 transition hover:from-blue-500 hover:to-blue-400 disabled:opacity-70"
              >
                {busyUserId === "create" || (selectedUser && (busyUserId === selectedUser.id || resettingUserId === selectedUser.id)) ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : mode === "reset" ? (
                  <KeyRound className="h-4 w-4" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                {mode === "create" ? "Create User" : mode === "edit" ? "Save Changes" : "Reset Password"}
              </button>
            </div>
          </form>
        </ModalShell>
      ) : null}

      {deleteCandidate ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/70 px-3 py-3 sm:items-center sm:px-4">
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-[0_24px_64px_rgba(2,6,23,0.45)]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-user-title"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-950/40 text-red-300">
                <Trash2 className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <h3 id="delete-user-title" className="text-lg font-semibold text-slate-100">
                  Delete {deleteCandidate.fullName}?
                </h3>
                <p className="mt-1 text-sm text-slate-400">
                  This will permanently remove the account. You cannot delete your own account, and the last OWNER cannot be removed.
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setDeleteCandidate(null)}
                className="inline-flex items-center justify-center rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-slate-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deletingUserId === deleteCandidate.id}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-900/50 bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-500 disabled:opacity-70"
              >
                {deletingUserId === deleteCandidate.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Delete User
              </button>
            </div>
          </motion.div>
        </div>
      ) : null}
    </div>
  );
}
