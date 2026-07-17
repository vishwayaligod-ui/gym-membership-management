"use client";

import { Activity, AlertCircle, CalendarDays, Clock3, Filter, ScanLine, Search, Users, X } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { AppHeader } from "../components/AppHeader";
import { ActivityTimeline } from "../components/ActivityTimeline";
import { AttendanceCard } from "../components/AttendanceCard";
import { AttendanceSummaryCard } from "../components/AttendanceSummaryCard";
import { BottomNavigation } from "../components/BottomNavigation";
import { PageContainer } from "../components/PageContainer";
import { mockActivity, mockAttendance } from "./mockAttendance";

export default function AttendancePage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,_#f5f8ff_0%,_#eef5ff_100%)] text-slate-900">
      <AppHeader title="Attendance" />

      <PageContainer>
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-2xl font-semibold tracking-tight text-slate-950">Attendance</p>
              <p className="mt-1 text-sm text-slate-500">Track daily member check-ins and check-outs</p>
            </div>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700"
            >
              <ScanLine className="h-4 w-4" />
              Quick Check-In
            </button>
          </div>

          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <AttendanceSummaryCard label="Present Today" value="84" tone="bg-emerald-50 text-emerald-700" icon={Activity} />
            <AttendanceSummaryCard label="Checked In" value="41" tone="bg-blue-50 text-blue-700" icon={Users} />
            <AttendanceSummaryCard label="Checked Out" value="32" tone="bg-slate-50 text-slate-700" icon={Clock3} />
            <AttendanceSummaryCard label="Pending Check-outs" value="11" tone="bg-amber-50 text-amber-700" icon={AlertCircle} />
          </section>

          <section className="flex flex-col gap-3 rounded-[1.5rem] border border-slate-200 bg-white/90 p-3 shadow-[0_10px_35px_rgba(15,23,42,0.06)] sm:flex-row sm:items-center">
            <label className="flex flex-1 items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-500">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search Member"
                className="w-full border-none bg-transparent outline-none placeholder:text-slate-400"
              />
            </label>
            <button className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:border-blue-200 hover:text-blue-600" type="button">
              <Filter className="h-4 w-4" />
              Filter
            </button>
            <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-600">
              <CalendarDays className="h-4 w-4 text-slate-400" />
              <input type="date" className="border-none bg-transparent text-sm outline-none" defaultValue="2026-07-16" />
            </label>
          </section>

          <section className="space-y-3">
            {mockAttendance.length > 0 ? (
              mockAttendance.map((member) => <AttendanceCard key={member.id} member={member} />)
            ) : (
              <div className="rounded-[1.6rem] border border-slate-200 bg-white p-8 text-center shadow-[0_10px_35px_rgba(15,23,42,0.06)]">
                <p className="text-lg font-semibold text-slate-900">No attendance records today.</p>
              </div>
            )}
          </section>

          <ActivityTimeline items={mockActivity} />
        </div>
      </PageContainer>

      {isModalOpen ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 flex items-end justify-center bg-slate-950/50 px-3 py-4 sm:items-center"
          onClick={() => setIsModalOpen(false)}
        >
          <motion.div
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-xl rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-2xl sm:p-5"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-semibold text-slate-900">Quick Check-In</p>
                <p className="text-sm text-slate-500">Select a member to log attendance</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-blue-200 hover:text-blue-600" type="button">
                <X className="h-4 w-4" />
              </button>
            </div>

            <label className="mt-4 flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-500">
              <Search className="h-4 w-4 text-slate-400" />
              <input type="text" placeholder="Search Member" className="w-full border-none bg-transparent outline-none placeholder:text-slate-400" />
            </label>

            <div className="mt-4">
              <p className="text-sm font-semibold text-slate-900">Recent Members</p>
              <div className="mt-3 space-y-2">
                {mockAttendance.slice(0, 2).map((member) => (
                  <div key={member.id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/70 px-3 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-500 text-sm font-semibold text-white">
                        {member.avatar}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{member.name}</p>
                        <p className="text-sm text-slate-500">{member.plan}</p>
                      </div>
                    </div>
                    <button type="button" className="rounded-full border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:border-blue-200 hover:text-blue-600">
                      Select
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 rounded-[1.4rem] border border-slate-200 bg-gradient-to-br from-blue-50 to-white p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Riya Sharma</p>
                  <p className="text-sm text-slate-500">Platinum · Active</p>
                </div>
                <div className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                  Active
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between rounded-2xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-600">
                <span>Expires</span>
                <span className="font-semibold text-slate-900">Jul 12, 2026</span>
              </div>
            </div>

            <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button onClick={() => setIsModalOpen(false)} type="button" className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-blue-200 hover:text-blue-600">
                Cancel
              </button>
              <button type="button" className="rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700">
                Check In
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}

      <BottomNavigation />
    </div>
  );
}
