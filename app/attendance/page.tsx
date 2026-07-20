"use client";

import { Activity, AlertCircle, CalendarDays, Clock, LogOut, MessageCircle, Phone, ScanLine, Search, Users, CheckCircle2, LogIn } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useMemo } from "react";
import { AppHeader } from "../components/AppHeader";
import { ActivityTimeline } from "../components/ActivityTimeline";
import { AttendanceSummaryCard } from "../components/AttendanceSummaryCard";
import { BottomNavigation } from "../components/BottomNavigation";
import { PageContainer } from "../components/PageContainer";
import { mockActivity, mockAttendance } from "./mockAttendance";
import { mockMembers } from "../members/mockMembers";

export default function AttendancePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMember, setSelectedMember] = useState<typeof mockMembers[0] | null>(null);
  const [checkedInStatus, setCheckedInStatus] = useState<Record<number, boolean>>({});

  // Search functionality
  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return mockMembers.filter(member =>
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.phone.includes(searchQuery)
    );
  }, [searchQuery]);

  const handleCheckIn = (memberId: number) => {
    setCheckedInStatus(prev => ({
      ...prev,
      [memberId]: !prev[memberId]
    }));
  };

  const handleSelectMember = (member: typeof mockMembers[0]) => {
    setSelectedMember(member);
    setSearchQuery("");
  };

  const isCheckedIn = selectedMember ? checkedInStatus[selectedMember.id] : false;

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,_#f5f8ff_0%,_#eef5ff_100%)] text-slate-900">
      <AppHeader title="Attendance" />

      <PageContainer>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-6 py-4"
        >
          {/* Header */}
          <div>
            <p className="text-2xl font-semibold tracking-tight text-slate-950">Check-In & Check-Out</p>
            <p className="mt-1 text-sm text-slate-500">Manage member attendance efficiently</p>
          </div>

          {/* 1. Search Member Section */}
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 }}
            className="rounded-[1.6rem] border border-slate-200 bg-white p-5 shadow-[0_10px_35px_rgba(15,23,42,0.06)]"
          >
            <label className="relative flex items-center gap-3 rounded-2xl border-2 border-slate-200 bg-slate-50 px-4 py-3 text-slate-500 transition focus-within:border-blue-500 focus-within:bg-white">
              <Search className="h-5 w-5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search member by name or phone..."
                className="w-full border-none bg-transparent text-sm outline-none placeholder:text-slate-400"
              />
            </label>

            {/* Search Results Dropdown */}
            {searchQuery.trim() && filteredMembers.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 space-y-2"
              >
                {filteredMembers.map((member) => (
                  <button
                    key={member.id}
                    onClick={() => handleSelectMember(member)}
                    className="w-full flex items-center justify-between rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-50 to-white p-3 text-left transition hover:border-blue-300 hover:bg-blue-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-500 text-sm font-semibold text-white">
                        {member.avatar}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{member.name}</p>
                        <p className="text-xs text-slate-500">{member.plan} · {member.phone}</p>
                      </div>
                    </div>
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold ring-1 ${
                      member.status === "Active"
                        ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                        : member.status === "Expiring"
                        ? "bg-amber-50 text-amber-700 ring-amber-200"
                        : "bg-rose-50 text-rose-700 ring-rose-200"
                    }`}>
                      {member.status}
                    </span>
                  </button>
                ))}
              </motion.div>
            )}
          </motion.section>

          {/* 2. Member Preview Card */}
          {selectedMember && (
            <motion.section
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="overflow-hidden rounded-[1.6rem] border border-slate-200 bg-gradient-to-br from-blue-50 to-white shadow-[0_10px_35px_rgba(15,23,42,0.06)]"
            >
              <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-500 text-lg font-bold text-white shadow-lg shadow-blue-600/20">
                    {selectedMember.avatar}
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-slate-900">{selectedMember.name}</p>
                    <p className="text-sm text-slate-600">{selectedMember.plan} · {selectedMember.phone}</p>
                    <p className="mt-1 text-xs text-slate-500">Expires: {selectedMember.expiresOn}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedMember(null)}
                  className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  Change
                </button>
              </div>
            </motion.section>
          )}

          {/* 3. One-Tap Check-In Button */}
          {selectedMember && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.15 }}
              className="grid gap-3 sm:grid-cols-2"
            >
              <button
                onClick={() => handleCheckIn(selectedMember.id)}
                className={`rounded-2xl px-6 py-4 text-base font-semibold shadow-lg transition ${
                  !isCheckedIn
                    ? "bg-emerald-600 text-white shadow-emerald-600/20 hover:bg-emerald-700"
                    : "border border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <LogIn className="h-5 w-5" />
                  {!isCheckedIn ? "Check In" : "Checked In"}
                </div>
              </button>
              <button
                onClick={() => handleCheckIn(selectedMember.id)}
                className={`rounded-2xl px-6 py-4 text-base font-semibold shadow-lg transition ${
                  isCheckedIn
                    ? "bg-amber-600 text-white shadow-amber-600/20 hover:bg-amber-700"
                    : "border border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <LogOut className="h-5 w-5" />
                  Check Out
                </div>
              </button>
            </motion.div>
          )}

          {/* 4. Today's Attendance Stats */}
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <h3 className="mb-4 text-base font-semibold text-slate-900">Today's Stats</h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <AttendanceSummaryCard label="Members Present" value="84" tone="bg-emerald-100 text-emerald-600" icon={Activity} />
              <AttendanceSummaryCard label="Checked In" value="41" tone="bg-blue-100 text-blue-600" icon={LogIn} />
              <AttendanceSummaryCard label="Checked Out" value="32" tone="bg-orange-100 text-orange-600" icon={LogOut} />
              <AttendanceSummaryCard label="Pending" value="11" tone="bg-amber-100 text-amber-600" icon={Clock} />
            </div>
          </motion.section>

          {/* 5. Recent Check-ins */}
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.25 }}
            className="rounded-[1.6rem] border border-slate-200 bg-white p-5 shadow-[0_10px_35px_rgba(15,23,42,0.06)]"
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-900">Recent Activity</h3>
                <p className="mt-0.5 text-sm text-slate-500">Today's latest check-ins & check-outs</p>
              </div>
            </div>

            <div className="space-y-2">
              {mockActivity.map((item, index) => (
                <motion.div
                  key={`${item.time}-${item.name}`}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-50 to-white p-3"
                >
                  <div className="rounded-full bg-blue-100 p-2 text-blue-600">
                    {item.action.includes("Checked Out") ? <LogOut className="h-4 w-4" /> : <LogIn className="h-4 w-4" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">{item.name}</p>
                    <p className="text-xs text-slate-500">{item.action}</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">{item.time}</span>
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* 6. Quick Actions */}
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <h3 className="mb-4 text-base font-semibold text-slate-900">Quick Actions</h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <button className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-blue-300 hover:bg-blue-50">
                <Phone className="h-4 w-4" />
                Call Member
              </button>
              <button className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-blue-300 hover:bg-blue-50">
                <MessageCircle className="h-4 w-4" />
                Send Message
              </button>
              <button className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-blue-300 hover:bg-blue-50">
                <CalendarDays className="h-4 w-4" />
                View Schedule
              </button>
            </div>
          </motion.section>

          {/* Attendance Records */}
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.35 }}
          >
            <h3 className="mb-4 text-base font-semibold text-slate-900">Attendance Records</h3>
            <div className="space-y-2">
              {mockAttendance.map((member, index) => (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition hover:border-blue-200 hover:shadow-md"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-500 text-xs font-semibold text-white">
                      {member.avatar}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">{member.name}</p>
                      <p className="text-xs text-slate-500">{member.plan}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-xs font-medium text-slate-900">{member.checkInTime}</p>
                      {member.checkOutTime && <p className="text-xs text-slate-500">{member.checkOutTime}</p>}
                    </div>
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${
                      member.status === "Present"
                        ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                        : member.status === "Checked Out"
                        ? "bg-slate-50 text-slate-700 ring-slate-200"
                        : "bg-amber-50 text-amber-700 ring-amber-200"
                    }`}>
                      {member.status}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>
        </motion.div>
      </PageContainer>

      <BottomNavigation />
    </div>
  );
}
