"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  CalendarCheck,
  Check,
  Search,
  Timer,
  UserCheck,
  LogOut,
  ArrowRight,
} from "lucide-react";
import type { AttendanceRecord, CheckInMember, RecentActivityItem } from "./types";
import { Card } from "../components/v4/Card";
import { FadeUp } from "../components/v4/MotionDiv";
import { QuickCheckInCard } from "../components/QuickCheckInCard";
import { Toast } from "../components/Toast";
import { useMountedDateString } from "../components/useMountedDateString";

type AttendanceResponse = {
  records: AttendanceRecord[];
  summary: {
    totalMembers: number;
    checkedIn: number;
    checkedOut: number;
    activeNow: number;
    peakHour: string;
    avgDuration: string;
  };
};

type AttendanceMembersResponse = {
  members: CheckInMember[];
};

export default function AttendancePage() {
  // Dates are formatted only after mount to avoid hydration mismatches:
  // iOS Safari's locale output differs from the Node.js server render.
  const todayFullDate = useMountedDateString(() =>
    new Date().toLocaleDateString("en-US", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  );
  const todayShortDate = useMountedDateString(() =>
    new Date().toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
    })
  );
  // Compact mobile header date ("Monday, September 7") — also formatted after
  // mount to avoid hydration mismatches (see useMountedDateString).
  const todayMobileDate = useMountedDateString(() =>
    new Date().toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    })
  );
  const [checkInSearch, setCheckInSearch] = useState("");
  const [selectedMember, setSelectedMember] = useState<CheckInMember | null>(null);
  const [checkInMembers, setCheckInMembers] = useState<CheckInMember[]>([]);
  const latestSearchRef = useRef("");
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [summary, setSummary] = useState({
    totalMembers: 0,
    present: 0,
    late: 0,
    absent: 0,
    checkedIn: 0,
    checkedOut: 0,
    peakHour: "—",
    avgDuration: "—",
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivityItem[]>([]);
  const [toastMessage, setToastMessage] = useState("");
  const [toastVisible, setToastVisible] = useState(false);
  const [toastKey, setToastKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    setToastVisible(true);
    setToastKey((k) => k + 1);
  }, []);

  const hideToast = useCallback(() => {
    setToastVisible(false);
  }, []);

  const loadAttendance = useCallback(async (date?: string) => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (checkInSearch.trim()) params.set("search", checkInSearch.trim());
      if (date) params.set("date", date);

      const response = await fetch(`/api/attendance?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to load attendance");
      }

      const data: AttendanceResponse = await response.json();
      setRecords(data.records || []);
      setSummary((prev) => ({ ...prev, ...data.summary }));
      setRecentActivity([]);
    } catch (error) {
      console.error("Failed to load attendance", error);
      showToast("Unable to load attendance data");
    } finally {
      setIsLoading(false);
    }
  }, [checkInSearch, showToast]);

  const loadMembers = useCallback(async (searchTerm = checkInSearch) => {
    latestSearchRef.current = searchTerm;
    try {
      const params = new URLSearchParams();
      if (searchTerm.trim()) {
        params.set("search", searchTerm.trim());
      }

      const response = await fetch(`/api/attendance/members?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to load members");
      }

      const data: AttendanceMembersResponse = await response.json();
      if (latestSearchRef.current === searchTerm) {
        setCheckInMembers(data.members || []);
      }
    } catch (error) {
      console.error("Failed to load check-in members", error);
      if (latestSearchRef.current === searchTerm) {
        setCheckInMembers([]);
      }
    }
  }, [checkInSearch]);

  const handleCheckIn = useCallback(
    async (member: CheckInMember) => {
      try {
        setIsSubmitting(true);
        const response = await fetch("/api/attendance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ memberId: member.id }),
        });

        const data: { error?: string } = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to check in");
        }

        showToast(`${member.name} checked in successfully`);
        setCheckInSearch("");
        setSelectedMember(null);
        await Promise.all([loadAttendance(), loadMembers("")]);
      } catch (error) {
        console.error("Check-in failed", error);
        showToast(error instanceof Error ? error.message : "Check-in failed");
      } finally {
        setIsSubmitting(false);
      }
    },
    [loadAttendance, loadMembers, showToast]
  );

  const handleCheckOut = useCallback(
    async (member: CheckInMember) => {
      try {
        setIsSubmitting(true);
        const matchingRecord = records.find((record) => record.memberId === member.id);
        if (!matchingRecord) {
          throw new Error("Attendance record not found");
        }

        const response = await fetch(`/api/attendance/${matchingRecord.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });

        const data: { error?: string } = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to check out");
        }

        showToast(`${member.name} checked out successfully`);
        await Promise.all([loadAttendance(), loadMembers(checkInSearch)]);
      } catch (error) {
        console.error("Check-out failed", error);
        showToast(error instanceof Error ? error.message : "Check-out failed");
      } finally {
        setIsSubmitting(false);
      }
    },
    [checkInSearch, loadAttendance, loadMembers, records, showToast]
  );

  useEffect(() => {
    void loadAttendance();
  }, [loadAttendance]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadMembers(checkInSearch);
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [checkInSearch, loadMembers]);

  useEffect(() => {
    if (!selectedMember) {
      return;
    }

    const updatedMember = checkInMembers.find((member) => member.id === selectedMember.id);
    if (updatedMember) {
      setSelectedMember(updatedMember);
    }
  }, [checkInMembers, selectedMember]);

  const checkedInCount = records.length;
  const checkedOutCount = records.filter((r) => r.checkOut !== "—").length;
  const activeNowCount = checkedInCount - checkedOutCount;
  // Members currently inside the gym — derived from today's records (no extra API call).
  const activeRecords = records.filter((r) => r.checkIn !== "—" && r.checkOut === "—");

  return (
    <div className="text-[#F8FAFC]">
      {/* ═══════════════════════════════════════════
          MOBILE (below md) — Receptionist operational layout
          SEARCH MEMBER → SELECT MEMBER → CHECK IN / CHECK OUT
          ═══════════════════════════════════════════ */}
      <div className="space-y-5 md:hidden">
        {/* Compact page header — no giant hero on mobile */}
        <FadeUp>
          <header>
            <h1 className="text-[22px] font-bold tracking-tight text-[#F8FAFC]">
              Attendance
            </h1>
            <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#64748B]">
              Today
            </p>
            <p className="text-[13px] font-medium text-[#94A3B8]">{todayMobileDate}</p>
          </header>
        </FadeUp>

        {/* QUICK CHECK-IN — search → select → check in (first action on screen) */}
        <FadeUp delay={0.05}>
          <section aria-label="Quick check-in">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#64748B]">
              Quick Check-In
            </p>
            <QuickCheckInCard
              variant="mobile"
              members={checkInMembers}
              searchQuery={checkInSearch}
              onSearchChange={setCheckInSearch}
              selectedMember={selectedMember}
              onSelectMember={setSelectedMember}
              onCheckIn={handleCheckIn}
              onCheckOut={handleCheckOut}
              isSubmitting={isSubmitting}
            />
          </section>
        </FadeUp>

        {/* TODAY — compact counts, not oversized dashboard cards */}
        <FadeUp delay={0.1}>
          <section aria-label="Today's summary">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#64748B]">
              Today
            </p>
            <div className="grid grid-cols-3 divide-x divide-[#334155]/60 rounded-2xl border border-[#334155] bg-[#1E293B] py-3">
              <div className="px-2 text-center">
                <p className="text-[18px] font-bold tabular-nums leading-tight text-[#F8FAFC]">
                  {checkedInCount}
                </p>
                <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#64748B]">
                  Checked In
                </p>
              </div>
              <div className="px-2 text-center">
                <p className="text-[18px] font-bold tabular-nums leading-tight text-[#F8FAFC]">
                  {checkedOutCount}
                </p>
                <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#64748B]">
                  Checked Out
                </p>
              </div>
              <div className="px-2 text-center">
                <p className="text-[18px] font-bold tabular-nums leading-tight text-[#3B82F6]">
                  {activeNowCount}
                </p>
                <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#64748B]">
                  Active Now
                </p>
              </div>
            </div>
          </section>
        </FadeUp>

        {/* CURRENTLY IN GYM — ✓ Checked In state per active member (display only, no checkout) */}
        <FadeUp delay={0.15}>
          <section aria-label="Currently in gym">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#64748B]">
              Currently In Gym
            </p>
            <div className="overflow-hidden rounded-2xl border border-[#334155] bg-[#1E293B]">
              {isLoading ? (
                <p className="px-4 py-8 text-center text-[13px] text-[#64748B]">Loading...</p>
              ) : activeRecords.length === 0 ? (
                <p className="px-4 py-8 text-center text-[13px] text-[#64748B]">
                  No members checked in
                </p>
              ) : (
                <div className="divide-y divide-[#334155]/50">
                  {activeRecords.map((record) => (
                    <div key={record.id} className="flex items-center gap-3 px-3.5 py-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-500 text-[12px] font-bold text-white shadow-sm">
                        {record.avatar}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[14px] font-semibold text-[#F8FAFC]">
                          {record.name}
                        </p>
                        <p className="tabular-nums text-[12px] text-[#64748B]">
                          Checked in {record.checkIn}
                        </p>
                      </div>
                      <span
                        aria-label="Checked in"
                        className="flex h-10 shrink-0 items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 px-4 text-[13px] font-semibold text-white shadow-lg shadow-amber-600/20"
                      >
                        <Check className="h-3.5 w-3.5" />
                        Checked In
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </FadeUp>
      </div>

      {/* ═══════════════════════════════════════════
          DESKTOP / TABLET (md+) — existing layout preserved
          ═══════════════════════════════════════════ */}
      <div className="hidden md:block">
      {/* ═══════════════════════════════════════════
          HERO SECTION — Operational Header
          ═══════════════════════════════════════════ */}
      <section className="pb-6">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-start justify-between"
          >
            <div>
                {/* Breadcrumb */}
                <nav className="mb-3 flex items-center gap-1.5 text-[12px]">
                  <Link
                    href="/dashboard"
                    className="text-[#64748B] transition-colors duration-200 hover:text-[#3B82F6]"
                  >
                    Dashboard
                  </Link>
                  <span className="text-[#475569] select-none">›</span>
                  <span className="text-[#94A3B8] font-medium">Attendance</span>
                </nav>
                <div className="flex items-center gap-3 mb-1">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-md shadow-blue-900/20">
                    <CalendarCheck className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#3B82F6]">
                    Focus Fitness
                  </span>
                </div>
                <h1 className="text-[28px] font-bold tracking-tight text-[#F8FAFC]">
                  Attendance Management
                </h1>
                <p className="mt-1 text-[14px] text-[#64748B]">
                  {todayFullDate}
                </p>
              </div>
          </motion.div>
        </section>

        {/* ═══════════════════════════════════════════
            QUICK CHECK-IN + KPI CARDS
            ═══════════════════════════════════════════ */}
        <div className="pb-8">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
            {/* Quick Check-In Card */}
            <div className="lg:col-span-2">
              <FadeUp delay={0.05}>
                <QuickCheckInCard
                  members={checkInMembers}
                  searchQuery={checkInSearch}
                  onSearchChange={setCheckInSearch}
                  selectedMember={selectedMember}
                  onSelectMember={setSelectedMember}
                  onCheckIn={handleCheckIn}
                  onCheckOut={handleCheckOut}
                  isSubmitting={isSubmitting}
                />
              </FadeUp>
            </div>

            {/* KPI Cards */}
            <div className="lg:col-span-3">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <FadeUp delay={0.1}>
                  <Card padding="md" shadow="md" className="!border-[#334155] !bg-[#1E293B]">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#3B82F6]/10 ring-1 ring-[#3B82F6]/20">
                        <UserCheck className="h-5 w-5 text-[#3B82F6]" />
                      </div>
                      <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#64748B]">
                        Checked In
                      </span>
                    </div>
                    <p className="mt-3 text-[28px] font-bold tabular-nums text-[#F8FAFC] tracking-tight">
                      {checkedInCount}
                    </p>
                    <p className="mt-0.5 text-[11px] text-[#64748B]">
                      Today&apos;s check-ins
                    </p>
                  </Card>
                </FadeUp>

                <FadeUp delay={0.15}>
                  <Card padding="md" shadow="md" className="!border-[#334155] !bg-[#1E293B]">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-900/30 ring-1 ring-indigo-900/40">
                        <LogOut className="h-5 w-5 text-indigo-400" />
                      </div>
                      <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#64748B]">
                        Checked Out
                      </span>
                    </div>
                    <p className="mt-3 text-[28px] font-bold tabular-nums text-[#F8FAFC] tracking-tight">
                      {checkedOutCount}
                    </p>
                    <p className="mt-0.5 text-[11px] text-[#64748B]">
                      Today&apos;s check-outs
                    </p>
                  </Card>
                </FadeUp>

                <FadeUp delay={0.2}>
                  <Card padding="md" shadow="md" className="!border-[#334155] !bg-[#1E293B]">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-900/30 ring-1 ring-emerald-900/40">
                        <CalendarCheck className="h-5 w-5 text-emerald-400" />
                      </div>
                      <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#64748B]">
                        Active Now
                      </span>
                    </div>
                    <p className="mt-3 text-[28px] font-bold tabular-nums text-[#F8FAFC] tracking-tight">
                      {checkedInCount - checkedOutCount}
                    </p>
                    <p className="mt-0.5 text-[11px] text-[#64748B]">
                      Currently in studio
                    </p>
                  </Card>
                </FadeUp>

                <FadeUp delay={0.25}>
                  <Card padding="md" shadow="md" className="!border-[#334155] !bg-[#1E293B]">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#3B82F6]/10 ring-1 ring-[#3B82F6]/20">
                        <Timer className="h-5 w-5 text-[#3B82F6]" />
                      </div>
                      <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#64748B]">
                        Avg Duration
                      </span>
                    </div>
                    <p className="mt-3 text-[28px] font-bold tabular-nums text-[#F8FAFC] tracking-tight">
                      {summary.avgDuration}
                    </p>
                    <p className="mt-0.5 text-[11px] text-[#64748B]">Peak: {summary.peakHour}</p>
                  </Card>
                </FadeUp>
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════
            MAIN CONTENT + SIDEBAR
            ═══════════════════════════════════════════ */}
        <div className="flex gap-0">
          {/* Today's Check-Ins Table */}
          <div className="flex-1 min-w-0">
            {/* Section heading */}
            <div className="pt-2 pb-3">
              <h2 className="text-[15px] font-semibold text-[#F8FAFC]">Today&apos;s Check-Ins</h2>
            </div>

            {/* Table Header */}
            <div className="flex items-center gap-3 border-b border-[#334155] bg-[#0F172A]/50 py-3">
              <span className="w-[52px] shrink-0" />
              <span className="w-40 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#64748B]">
                Member
              </span>
              <span className="w-20 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#64748B]">
                Check In
              </span>
              <span className="w-20 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#64748B]">
                Check Out
              </span>
              <span className="w-20 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#64748B]">
                Duration
              </span>
            </div>

            {/* Rows */}
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#1E293B] ring-1 ring-[#334155]">
                  <Search className="h-7 w-7 text-[#64748B]" />
                </div>
                <p className="mt-5 text-[15px] font-medium text-[#94A3B8]">Loading attendance...</p>
                <p className="mt-1 text-[12px] text-[#64748B]">Fetching today&apos;s live records</p>
              </div>
            ) : records.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#1E293B] ring-1 ring-[#334155]">
                  <Search className="h-7 w-7 text-[#64748B]" />
                </div>
                <p className="mt-5 text-[15px] font-medium text-[#94A3B8]">No check-ins yet today</p>
                <p className="mt-1 text-[12px] text-[#64748B]">
                  Search and check in a member above to get started
                </p>
              </div>
            ) : (
              <div>
                {records.map((record, i) => {
                  return (
                    <div key={record.id}>
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25, delay: i * 0.03, ease: [0.16, 1, 0.3, 1] }}
                        className="flex items-center gap-3 py-[14px] transition-all hover:bg-[#273449]"
                      >
                        {/* Avatar */}
                        <div className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-500 text-[14px] font-bold text-white shadow-sm">
                          {record.avatar}
                        </div>

                        {/* Member */}
                        <div className="w-40">
                          <p className="text-[14px] font-semibold text-[#F8FAFC] truncate">
                            {record.name}
                          </p>
                          <p className="text-[12px] text-[#64748B] truncate">
                            {record.plan} &middot; {record.phone}
                          </p>
                        </div>

                        {/* Check In */}
                        <div className="w-20">
                          <span className="text-[14px] font-medium text-[#F8FAFC] tabular-nums tracking-tight">
                            {record.checkIn}
                          </span>
                        </div>

                        {/* Check Out */}
                        <div className="w-20">
                          <span className="text-[14px] font-medium text-[#F8FAFC] tabular-nums tracking-tight">
                            {record.checkOut}
                          </span>
                        </div>

                        {/* Duration */}
                        <div className="w-20">
                          <span className="text-[14px] font-medium text-[#F8FAFC] tabular-nums tracking-tight">
                            {record.duration}
                          </span>
                        </div>
                      </motion.div>
                      {i < records.length - 1 && (
                        <div className="border-t border-[#334155]/60" />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ═══════════════════════════════════════════
              TODAY'S SUMMARY SIDEBAR
              ═══════════════════════════════════════════ */}
          <div className="hidden xl:block w-[300px] shrink-0 border-l border-[#334155] px-6 py-6">
            <FadeUp delay={0.2}>
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-md shadow-blue-900/20">
                  <CalendarCheck className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-[#F8FAFC]">Today&apos;s Summary</p>
                  <p className="text-[11px] text-[#64748B]">
                    {todayShortDate}
                  </p>
                </div>
              </div>

              {/* Summary Stats */}
              <div className="space-y-3">
                <Card padding="sm" shadow="sm" className="!border-[#334155] !bg-[#1E293B]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#3B82F6]/10">
                        <UserCheck className="h-3 w-3 text-[#3B82F6]" />
                      </div>
                      <span className="text-[11px] font-medium text-[#64748B]">Checked In</span>
                    </div>
                    <span className="text-[15px] font-bold text-[#3B82F6] tabular-nums">
                      {summary.checkedIn}
                    </span>
                  </div>
                </Card>

                <Card padding="sm" shadow="sm" className="!border-[#334155] !bg-[#1E293B]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-900/30">
                        <LogOut className="h-3 w-3 text-indigo-400" />
                      </div>
                      <span className="text-[11px] font-medium text-[#64748B]">Checked Out</span>
                    </div>
                    <span className="text-[15px] font-bold text-indigo-400 tabular-nums">
                      {summary.checkedOut}
                    </span>
                  </div>
                </Card>
              </div>

              {/* Quick Insights */}
              <div className="mt-6">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#64748B]">
                  Quick Insights
                </p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between rounded-xl bg-[#0F172A]/50 px-4 py-2.5">
                    <span className="text-[12px] text-[#64748B]">Checked In</span>
                    <span className="text-[13px] font-semibold text-[#F8FAFC] tabular-nums">
                      {summary.checkedIn}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-[#0F172A]/50 px-4 py-2.5">
                    <span className="text-[12px] text-[#64748B]">Checked Out</span>
                    <span className="text-[13px] font-semibold text-[#F8FAFC] tabular-nums">
                      {summary.checkedOut}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-[#0F172A]/50 px-4 py-2.5">
                    <span className="text-[12px] text-[#64748B]">Active Now</span>
                    <span className="text-[13px] font-semibold text-[#F8FAFC] tabular-nums">
                      {summary.checkedIn - summary.checkedOut}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-[#0F172A]/50 px-4 py-2.5">
                    <span className="text-[12px] text-[#64748B]">Peak Hour</span>
                    <span className="text-[13px] font-semibold text-[#F8FAFC] tabular-nums">
                      {summary.peakHour}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-[#0F172A]/50 px-4 py-2.5">
                    <span className="text-[12px] text-[#64748B]">Avg Duration</span>
                    <span className="text-[13px] font-semibold text-[#F8FAFC] tabular-nums">
                      {summary.avgDuration}
                    </span>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="mt-6">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#64748B]">
                  Recent Activity
                </p>
                <div className="space-y-2">
                  {recentActivity.length === 0 ? (
                    <p className="text-[12px] text-[#64748B] text-center py-4">No recent activity</p>
                  ) : (
                    recentActivity.slice(0, 6).map((activity) => (
                      <div key={activity.id} className="flex items-center gap-3 rounded-xl bg-[#0F172A]/50 px-4 py-2.5">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-500 text-[9px] font-bold text-white">
                          {activity.memberAvatar}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[12px] font-medium text-[#94A3B8] truncate">
                            {activity.memberName}
                          </p>
                          <p className="text-[10px] text-[#64748B]">
                            {activity.action === "checked_in" ? "Checked in" : "Checked out"} at {activity.time}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* View Full Report */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-[#334155] bg-[#1E293B] px-4 py-3 text-[12px] font-medium text-[#64748B] transition-all hover:border-[#3B82F6]/50 hover:text-[#3B82F6] shadow-sm"
                type="button"
              >
                View Full Report
                <ArrowRight className="h-3.5 w-3.5" />
              </motion.button>
            </FadeUp>
          </div>
        </div>
      </div>
      {/* Toast */}
      <Toast
        key={toastKey}
        message={toastMessage}
        visible={toastVisible}
        onClose={hideToast}
      />
    </div>
  );
}