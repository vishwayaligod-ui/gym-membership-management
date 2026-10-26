"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, CheckCircle2, LogOut, UserCheck, X } from "lucide-react";
import type { CheckInMember } from "../attendance/types";
import { Card } from "./v4/Card";

type QuickCheckInCardVariant = "desktop" | "mobile";

type QuickCheckInCardProps = {
  members: CheckInMember[];
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedMember: CheckInMember | null;
  onSelectMember: (member: CheckInMember | null) => void;
  onCheckIn: (member: CheckInMember) => void;
  onCheckOut: (member: CheckInMember) => void;
  isSubmitting?: boolean;
  /**
   * "desktop" (default) keeps the existing card layout untouched.
   * "mobile" renders the flat receptionist layout: large search field,
   * obvious selected-member state and a dominant Check In action.
   */
  variant?: QuickCheckInCardVariant;
};

const statusBadgeStyles: Record<string, { bg: string; text: string }> = {
  Active: { bg: "bg-emerald-900/30", text: "text-emerald-400" },
  Expiring: { bg: "bg-orange-900/30", text: "text-orange-400" },
  Expired: { bg: "bg-rose-900/30", text: "text-rose-400" },
  Pending: { bg: "bg-sky-900/30", text: "text-sky-400" },
  Inactive: { bg: "bg-slate-700/40", text: "text-slate-300" },
  Frozen: { bg: "bg-cyan-900/30", text: "text-cyan-400" },
};

/**
 * Human-readable "remaining days" hint derived from the already-returned
 * membershipExpiry string ("Sep 20, 2026"). Display-only helper — the
 * attendance API contract and business rules are untouched.
 */
function formatRemainingDays(membershipExpiry: string): string {
  if (!membershipExpiry || membershipExpiry === "—") {
    return "";
  }

  const expiryDate = new Date(membershipExpiry);
  if (Number.isNaN(expiryDate.getTime())) {
    return `Expires ${membershipExpiry}`;
  }

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfExpiry = new Date(
    expiryDate.getFullYear(),
    expiryDate.getMonth(),
    expiryDate.getDate()
  );
  const days = Math.round((startOfExpiry.getTime() - startOfToday.getTime()) / 86400000);

  if (days < 0) return "Expired";
  if (days === 0) return "Expires today";
  return days === 1 ? "1 day left" : `${days} days left`;
}

export function QuickCheckInCard({
  members,
  searchQuery,
  onSearchChange,
  selectedMember,
  onSelectMember,
  onCheckIn,
  onCheckOut,
  isSubmitting = false,
  variant = "desktop",
}: QuickCheckInCardProps) {
  const isMobile = variant === "mobile";
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredResults = members;
  const updateDropdownPosition = useCallback(() => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + 4, // mt-1 equivalent (4px)
        left: rect.left,
        width: rect.width,
      });
    }
  }, []);

  useEffect(() => {
    if (!showDropdown) {
      setDropdownPos(null);
      return;
    }
    updateDropdownPosition();
    window.addEventListener("scroll", updateDropdownPosition, true);
    window.addEventListener("resize", updateDropdownPosition);
    return () => {
      window.removeEventListener("scroll", updateDropdownPosition, true);
      window.removeEventListener("resize", updateDropdownPosition);
    };
  }, [showDropdown, updateDropdownPosition]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        searchRef.current &&
        !searchRef.current.contains(e.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (member: CheckInMember) => {
    onSelectMember(member);
    setShowDropdown(false);
    onSearchChange("");
  };

  const handleClear = () => {
    onSelectMember(null);
    onSearchChange("");
  };

  /* Shared result picker — portal dropdown used by both desktop and mobile variants. */
  const renderDropdown = () =>
    typeof window !== "undefined" &&
    showDropdown &&
    filteredResults.length > 0 &&
    dropdownPos &&
    createPortal(
      <AnimatePresence>
        <motion.div
          ref={dropdownRef}
          initial={{ opacity: 0, y: -4, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -4, scale: 0.98 }}
          transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
          style={{
            position: "fixed",
            top: dropdownPos.top,
            left: dropdownPos.left,
            width: dropdownPos.width,
            zIndex: 99999,
          }}
          className={`overflow-y-auto rounded-xl border border-[#334155] bg-[#1E293B] shadow-lg ${
            isMobile ? "max-h-[320px]" : "max-h-[280px]"
          }`}
        >
          {filteredResults.map((member) => {
            const badge = statusBadgeStyles[member.membershipStatus] || statusBadgeStyles.Active;
            return (
              <button
                key={member.id}
                onClick={() => handleSelect(member)}
                className={`flex w-full items-center gap-3 px-4 text-left transition-colors hover:bg-[#273449] ${
                  isMobile ? "py-3 active:bg-[#273449]" : "py-2.5"
                }`}
                type="button"
              >
                <div
                  className={`flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-500 font-bold text-white shadow-sm ${
                    isMobile ? "h-10 w-10 text-[12px]" : "h-9 w-9 text-[11px]"
                  }`}
                >
                  {member.avatar}
                </div>
                <div className="min-w-0 flex-1">
                  <p
                    className={`truncate font-semibold text-[#F8FAFC] ${
                      isMobile ? "text-[14px]" : "text-[13px]"
                    }`}
                  >
                    {member.name}
                  </p>
                  <p className="truncate text-[11px] text-[#64748B]">
                    {member.membershipId} &middot; {member.plan}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${badge.bg} ${badge.text}`}
                >
                  {member.membershipStatus}
                </span>
              </button>
            );
          })}
        </motion.div>
      </AnimatePresence>,
      document.body
    );

  /* Shared three-state action button (Completed / Check Out / Check In). */
  const renderActionButtons = () => {
    if (!selectedMember) {
      return null;
    }

    if (selectedMember.todayCheckedIn && selectedMember.todayCheckOutTime) {
      return (
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          disabled
          className={
            isMobile
              ? "flex h-12 w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-[#334155] px-5 text-[15px] font-semibold text-[#64748B]"
              : "flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-[#334155] px-5 py-3 text-[13px] font-semibold text-[#64748B]"
          }
          type="button"
        >
          <CheckCircle2 className="h-4 w-4" />
          Completed
        </motion.button>
      );
    }

    if (selectedMember.todayCheckedIn) {
      return (
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          disabled={isSubmitting}
          onClick={() => onCheckOut(selectedMember)}
          className={`${
            isMobile
              ? "flex h-12 w-full items-center justify-center gap-2 rounded-xl px-5 text-[15px] font-semibold text-white"
              : "flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-[13px] font-semibold text-white"
          } bg-gradient-to-r from-amber-500 to-orange-600 shadow-lg shadow-amber-600/20 transition-all hover:shadow-[0_0_25px_-5px_rgba(245,158,11,0.3)] disabled:cursor-not-allowed disabled:opacity-70`}
          type="button"
        >
          <LogOut className="h-4 w-4" />
          {isSubmitting ? "Processing..." : "Check Out"}
        </motion.button>
      );
    }

    return (
      <motion.button
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        disabled={isSubmitting}
        onClick={() => onCheckIn(selectedMember)}
        className={`${
          isMobile
            ? "flex h-12 w-full items-center justify-center gap-2 rounded-xl px-5 text-[15px] font-semibold text-white"
            : "flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-[13px] font-semibold text-white"
        } bg-gradient-to-r from-blue-600 to-indigo-700 shadow-lg shadow-blue-600/20 transition-all hover:shadow-[0_0_25px_-5px_rgba(59,130,246,0.3)] disabled:cursor-not-allowed disabled:opacity-70`}
        type="button"
      >
        <CheckCircle2 className="h-4 w-4" />
        {isSubmitting ? "Processing..." : "Check In"}
      </motion.button>
    );
  };

  /* MOBILE — flat receptionist layout: search → selected member → dominant action. */
  if (isMobile) {
    const remainingDays = selectedMember
      ? formatRemainingDays(selectedMember.membershipExpiry)
      : null;

    return (
      <div>
        {/* Search field — first interactive element, thumb-sized (h-12, 16px text) */}
        <div ref={searchRef} className="relative">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#64748B]" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search member..."
              // iOS Safari materializes default autocapitalize / autocorrect / spellcheck
              // attributes onto <input> DOM nodes during HTML parsing. Declare them
              // explicitly so the server HTML and the hydrated client render always match
              // (same pattern as the Header search input).
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              suppressHydrationWarning
              aria-label="Search member"
              value={searchQuery}
              disabled={isSubmitting}
              onChange={(e) => {
                onSearchChange(e.target.value);
                if (e.target.value.trim()) setShowDropdown(true);
              }}
              onFocus={() => {
                if (filteredResults.length > 0) setShowDropdown(true);
              }}
              className="h-12 w-full rounded-xl border-[1.5px] border-[#334155] bg-[#0F172A] pl-11 pr-10 text-[16px] text-[#F8FAFC] outline-none placeholder:text-[#64748B] transition-all focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]/30"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-[#64748B] transition-colors active:text-[#94A3B8]"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Result picker */}
          {renderDropdown()}
        </div>

        {/* Selected member — obvious state + dominant action */}
        <AnimatePresence>
          {selectedMember && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="mt-3 rounded-2xl border border-[#334155] bg-[#1E293B] p-4 shadow-lg"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-500 text-[15px] font-bold text-white shadow-lg shadow-blue-900/20">
                  {selectedMember.avatar}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-[16px] font-bold text-[#F8FAFC]">
                    {selectedMember.name}
                  </h3>
                  <p className="mt-0.5 truncate text-[12px] text-[#64748B]">
                    {selectedMember.plan}
                    {remainingDays ? ` • ${remainingDays}` : ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleClear}
                  aria-label="Clear selection"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#64748B] transition-colors active:bg-[#334155] active:text-[#94A3B8]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                    statusBadgeStyles[selectedMember.membershipStatus]?.bg || "bg-emerald-900/30"
                  } ${
                    statusBadgeStyles[selectedMember.membershipStatus]?.text || "text-emerald-400"
                  }`}
                >
                  {selectedMember.membershipStatus}
                </span>
                <span className="min-w-0 text-[12px] font-medium text-[#94A3B8]">
                  {selectedMember.todayCheckedIn
                    ? selectedMember.todayCheckOutTime
                      ? `In ${selectedMember.todayCheckInTime} · Out ${selectedMember.todayCheckOutTime}`
                      : `In gym since ${selectedMember.todayCheckInTime}`
                    : "No visit yet today"}
                </span>
              </div>

              <div className="mt-4">{renderActionButtons()}</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <Card padding="md" shadow="lg" className="!border-[#334155] !bg-[#1E293B]">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-md shadow-blue-900/20">
            <UserCheck className="h-5 w-5 text-white" />
          </div>
          <span className="text-[15px] font-semibold text-[#F8FAFC] tracking-tight">Quick Check-In</span>
        </div>
        {selectedMember && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleClear}
            className="flex h-6 w-6 items-center justify-center rounded-full text-[#64748B] hover:bg-[#334155] hover:text-[#94A3B8] transition-colors"
            type="button"
            title="Clear selection"
          >
            <X className="h-3.5 w-3.5" />
          </motion.button>
        )}
      </div>

      {/* Search Input */}
      <div ref={searchRef} className="relative">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#64748B]" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search member by name, phone or membership ID..."
            // iOS Safari materializes default autocapitalize / autocorrect / spellcheck
            // attributes onto <input> DOM nodes during HTML parsing. Declare them
            // explicitly so the server HTML and the hydrated client render always match
            // (same pattern as the Header search input).
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            suppressHydrationWarning
            value={searchQuery}
            disabled={isSubmitting}
            onChange={(e) => {
              onSearchChange(e.target.value);
              if (e.target.value.trim()) setShowDropdown(true);
            }}
            onFocus={() => {
              if (filteredResults.length > 0) setShowDropdown(true);
            }}
            className="w-full rounded-xl border-[1.5px] border-[#334155] bg-[#0F172A] py-[14px] pl-12 pr-4 text-[15px] text-[#F8FAFC] outline-none placeholder:text-[#64748B] transition-all focus:border-[#3B82F6] focus:bg-[#0F172A] shadow-[0_2px_8px_rgba(15,23,42,0.04)] focus:shadow-[0_4px_16px_rgba(59,130,246,0.12)]"
          />
        </div>

        {/* Autocomplete Dropdown — rendered via Portal to document.body to avoid clipping */}
        {renderDropdown()}
      </div>

      {/* Expanded Member Card */}
      <AnimatePresence>
        {selectedMember && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="mt-5 pt-4 border-t border-[#334155]">
              {/* Large Avatar + Name */}
              <div className="flex flex-col items-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-500 text-lg font-bold text-white shadow-lg shadow-blue-900/20">
                  {selectedMember.avatar}
                </div>
                <h3 className="mt-3 text-[17px] font-bold text-[#F8FAFC]">
                  {selectedMember.name}
                </h3>
                <p className="text-[12px] text-[#64748B]">
                  {selectedMember.membershipId} &middot; {selectedMember.plan}
                </p>
              </div>

              {/* Details Grid */}
              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-[#0F172A]/50 p-3">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.08em] text-[#64748B]">
                    Membership
                  </p>
                  <p className="mt-0.5 text-[12px] font-medium text-[#94A3B8]">
                    {selectedMember.plan}
                  </p>
                </div>
                <div className="rounded-xl bg-[#0F172A]/50 p-3">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.08em] text-[#64748B]">
                    Expiry
                  </p>
                  <p className="mt-0.5 text-[12px] font-medium text-[#94A3B8]">
                    {selectedMember.membershipExpiry}
                  </p>
                </div>
                <div className="rounded-xl bg-[#0F172A]/50 p-3">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.08em] text-[#64748B]">
                    Status
                  </p>
                  <span
                    className={`mt-0.5 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      statusBadgeStyles[selectedMember.membershipStatus]?.bg || "bg-emerald-900/30"
                    } ${
                      statusBadgeStyles[selectedMember.membershipStatus]?.text || "text-emerald-400"
                    }`}
                  >
                    {selectedMember.membershipStatus}
                  </span>
                </div>
                <div className="rounded-xl bg-[#0F172A]/50 p-3">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.08em] text-[#64748B]">
                    Last Visit
                  </p>
                  <p className="mt-0.5 text-[12px] font-medium text-[#94A3B8]">
                    {selectedMember.lastVisit}
                  </p>
                </div>
              </div>

              {/* Today's Attendance Status */}
              <div className="mt-3 rounded-xl bg-[#0F172A]/50 p-3">
                <p className="text-[9px] font-semibold uppercase tracking-[0.08em] text-[#64748B]">
                  Today&apos;s Attendance
                </p>
                <p className="mt-0.5 text-[12px] font-medium text-[#94A3B8]">
                  {selectedMember.todayCheckedIn
                    ? selectedMember.todayCheckOutTime
                      ? `Checked in at ${selectedMember.todayCheckInTime} · Checked out at ${selectedMember.todayCheckOutTime}`
                      : `Checked in at ${selectedMember.todayCheckInTime} (not yet checked out)`
                    : "Not yet checked in"}
                </p>
              </div>

              {/* Check In / Check Out Button */}
              <div className="mt-4">{renderActionButtons()}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}