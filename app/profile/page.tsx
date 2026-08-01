"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Building2,
  CalendarDays,
  Clock,
  Key,
  Mail,
  Phone,
  Save,
  ShieldCheck,
  User,
  UserRound,
} from "lucide-react";
import { Toaster, toast } from "sonner";

import { FormField } from "../components/FormField";

// ---------------------------------------------------------------------------
// SectionCard reusable wrapper
// ---------------------------------------------------------------------------

function SectionCard({
  icon: Icon,
  title,
  subtitle,
  children,
  delay = 0,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay, ease: "easeOut" }}
      className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-3 sm:p-4 md:p-5"
    >
      <div className="mb-4 flex items-center gap-2.5">
        <div className="rounded-lg bg-emerald-900/30 p-2 text-emerald-400">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-200 sm:text-base">{title}</p>
          <p className="text-xs text-slate-500 sm:text-sm">{subtitle}</p>
        </div>
      </div>
      {children}
    </motion.section>
  );
}

// ---------------------------------------------------------------------------
// InfoRow reusable component for Account Information
// ---------------------------------------------------------------------------

function InfoRow({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-700/40 bg-slate-800/20 px-4 py-3 transition hover:border-slate-600/40 hover:bg-slate-800/30">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-700/40">
          <Icon className="h-4 w-4 text-slate-400" />
        </div>
        <div>
          <p className="text-xs font-medium text-slate-500">{label}</p>
          <p className="text-sm font-semibold text-slate-200">{value}</p>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function ProfilePage() {
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Personal Information state
  const [fullName, setFullName] = useState("Rahul Verma");
  const [email, setEmail] = useState("rahul@metricfit.com");
  const [mobileNumber, setMobileNumber] = useState("+91 98765 12345");

  // Change Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Get initials for avatar
  const initials = fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    setTimeout(() => {
      setIsUpdatingProfile(false);
      toast.success("Profile updated successfully!", {
        description: "Your personal information has been saved.",
        duration: 4000,
      });
    }, 1200);
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match", {
        description: "New password and confirm password must match.",
        duration: 3000,
      });
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password too short", {
        description: "New password must be at least 6 characters.",
        duration: 3000,
      });
      return;
    }
    setIsUpdatingPassword(true);
    setTimeout(() => {
      setIsUpdatingPassword(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Password updated successfully!", {
        description: "Your password has been changed.",
        duration: 4000,
      });
    }, 1200);
  };

  return (
    <div className="space-y-6">
      <Toaster position="top-right" richColors closeButton />

      {/* ═══════════════════════════════════════════
          PAGE HEADER
          ═══════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-100">
            Profile
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage your personal information and account security.
          </p>
        </div>
      </motion.div>

      {/* ═══════════════════════════════════════════
          CARD 1: PERSONAL INFORMATION
          ═══════════════════════════════════════════ */}
      <SectionCard
        icon={UserRound}
        title="Personal Information"
        subtitle="Your profile and contact details"
        delay={0.02}
      >
        <form onSubmit={handleUpdateProfile}>
          {/* Avatar */}
          <div className="mb-6 flex flex-col items-center gap-4 border-b border-slate-700/40 pb-5 sm:flex-row sm:items-start">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-600 to-emerald-500 text-2xl font-bold text-white shadow-lg shadow-emerald-600/20">
              {initials}
            </div>
            <div className="text-center sm:text-left">
              <p className="text-sm font-semibold text-slate-200">Profile Avatar</p>
              <p className="mt-1 text-xs text-slate-500 max-w-xs">
                Your avatar is automatically generated from your name.
              </p>
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Full Name" name="fullName" required>
              <div className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-3 focus-within:border-emerald-500 focus-within:bg-slate-900/80 focus-within:ring-1 focus-within:ring-emerald-500/30">
                <User className="h-4 w-4 shrink-0 text-slate-500" />
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full border-none bg-transparent text-sm text-slate-200 outline-none placeholder:text-slate-500"
                  placeholder="Your full name"
                  required
                />
              </div>
            </FormField>

            <FormField label="Email" name="email" required>
              <div className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-3 focus-within:border-emerald-500 focus-within:bg-slate-900/80 focus-within:ring-1 focus-within:ring-emerald-500/30">
                <Mail className="h-4 w-4 shrink-0 text-slate-500" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border-none bg-transparent text-sm text-slate-200 outline-none"
                  placeholder="email@example.com"
                  required
                />
              </div>
            </FormField>

            <FormField label="Mobile Number" name="mobileNumber" required>
              <div className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-3 focus-within:border-emerald-500 focus-within:bg-slate-900/80 focus-within:ring-1 focus-within:ring-emerald-500/30">
                <Phone className="h-4 w-4 shrink-0 text-slate-500" />
                <input
                  id="mobileNumber"
                  type="text"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  className="w-full border-none bg-transparent text-sm text-slate-200 outline-none"
                  placeholder="+91 99999 88888"
                  required
                />
              </div>
            </FormField>

            <FormField label="Role" name="role">
              <div className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-3">
                <ShieldCheck className="h-4 w-4 shrink-0 text-slate-500" />
                <input
                  id="role"
                  type="text"
                  value="Administrator"
                  readOnly
                  className="w-full border-none bg-transparent text-sm text-slate-400 outline-none cursor-default"
                />
              </div>
            </FormField>

            <FormField label="Branch" name="branch">
              <div className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-3">
                <Building2 className="h-4 w-4 shrink-0 text-slate-500" />
                <input
                  id="branch"
                  type="text"
                  value="Main Branch — Noida"
                  readOnly
                  className="w-full border-none bg-transparent text-sm text-slate-400 outline-none cursor-default"
                />
              </div>
            </FormField>
          </div>

          {/* Update Profile Button */}
          <div className="mt-5 flex justify-end border-t border-slate-700/40 pt-4">
            <button
              type="submit"
              disabled={isUpdatingProfile}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 px-5 py-2.5 text-[13px] font-semibold text-white shadow-lg shadow-emerald-600/25 transition-all hover:from-emerald-500 hover:to-emerald-400 disabled:opacity-60"
            >
              {isUpdatingProfile ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Update Profile
                </>
              )}
            </button>
          </div>
        </form>
      </SectionCard>

      {/* ═══════════════════════════════════════════
          CARD 2: CHANGE PASSWORD
          ═══════════════════════════════════════════ */}
      <SectionCard
        icon={Key}
        title="Change Password"
        subtitle="Update your account password"
        delay={0.04}
      >
        <form onSubmit={handleUpdatePassword}>
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Current Password" name="currentPassword" required>
              <div className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-3 focus-within:border-emerald-500 focus-within:bg-slate-900/80 focus-within:ring-1 focus-within:ring-emerald-500/30">
                <Key className="h-4 w-4 shrink-0 text-slate-500" />
                <input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full border-none bg-transparent text-sm text-slate-200 outline-none placeholder:text-slate-500"
                  placeholder="Enter current password"
                  required
                />
              </div>
            </FormField>

            <FormField label="New Password" name="newPassword" required>
              <div className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-3 focus-within:border-emerald-500 focus-within:bg-slate-900/80 focus-within:ring-1 focus-within:ring-emerald-500/30">
                <Key className="h-4 w-4 shrink-0 text-slate-500" />
                <input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full border-none bg-transparent text-sm text-slate-200 outline-none placeholder:text-slate-500"
                  placeholder="Enter new password"
                  required
                />
              </div>
            </FormField>

            <FormField label="Confirm Password" name="confirmPassword" required>
              <div className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-3 focus-within:border-emerald-500 focus-within:bg-slate-900/80 focus-within:ring-1 focus-within:ring-emerald-500/30">
                <Key className="h-4 w-4 shrink-0 text-slate-500" />
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full border-none bg-transparent text-sm text-slate-200 outline-none placeholder:text-slate-500"
                  placeholder="Confirm new password"
                  required
                />
              </div>
            </FormField>
          </div>

          {/* Update Password Button */}
          <div className="mt-5 flex justify-end border-t border-slate-700/40 pt-4">
            <button
              type="submit"
              disabled={isUpdatingPassword}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 px-5 py-2.5 text-[13px] font-semibold text-white shadow-lg shadow-emerald-600/25 transition-all hover:from-emerald-500 hover:to-emerald-400 disabled:opacity-60"
            >
              {isUpdatingPassword ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Update Password
                </>
              )}
            </button>
          </div>
        </form>
      </SectionCard>

      {/* ═══════════════════════════════════════════
          CARD 3: ACCOUNT INFORMATION
          ═══════════════════════════════════════════ */}
      <SectionCard
        icon={ShieldCheck}
        title="Account Information"
        subtitle="Your account details and activity"
        delay={0.06}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <InfoRow
            icon={ShieldCheck}
            label="Account Status"
            value="Active"
          />
          <InfoRow
            icon={User}
            label="Role"
            value="Administrator"
          />
          <InfoRow
            icon={CalendarDays}
            label="Created On"
            value="January 15, 2024"
          />
          <InfoRow
            icon={Clock}
            label="Last Login"
            value="July 30, 2026 — 10:42 AM"
          />
          <InfoRow
            icon={Building2}
            label="Branch"
            value="Main Branch — Noida"
          />
          <InfoRow
            icon={UserRound}
            label="Employee ID"
            value="EMP-2024-001"
          />
        </div>
      </SectionCard>
    </div>
  );
}