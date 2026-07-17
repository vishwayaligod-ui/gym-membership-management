"use client";

import {
  Activity,
  AlertCircle,
  BadgeCheck,
  CalendarClock,
  Plus,
  RefreshCcw,
  ScanLine,
  Sparkles,
  Users,
} from "lucide-react";
import { useMemo } from "react";
import { AppHeader } from "../components/AppHeader";
import { BottomNavigation } from "../components/BottomNavigation";
import { PageContainer } from "../components/PageContainer";

const statCards = [
  {
    label: "Total Members",
    value: "1,248",
    change: "+12% this month",
    tone: "bg-blue-50 text-blue-700",
    icon: Users,
  },
  {
    label: "Present Today",
    value: "84",
    change: "12 checked in now",
    tone: "bg-emerald-50 text-emerald-700",
    icon: Activity,
  },
  {
    label: "Renewals Due",
    value: "29",
    change: "Next 7 days",
    tone: "bg-amber-50 text-amber-700",
    icon: CalendarClock,
  },
  {
    label: "Expired Memberships",
    value: "7",
    change: "Requires follow-up",
    tone: "bg-rose-50 text-rose-700",
    icon: AlertCircle,
  },
];

const quickActions = [
  {
    title: "Add Member",
    subtitle: "Create a new profile",
    icon: Plus,
    accent: "from-blue-600 to-blue-500",
  },
  {
    title: "Attendance",
    subtitle: "Scan and verify check-ins",
    icon: ScanLine,
    accent: "from-indigo-600 to-violet-500",
  },
  {
    title: "Renewals",
    subtitle: "Review due invoices",
    icon: RefreshCcw,
    accent: "from-slate-700 to-slate-600",
  },
];

const recentCheckIns = [
  { name: "Riya Sharma", time: "08:12", plan: "Platinum" },
  { name: "Aman Verma", time: "08:24", plan: "Classic" },
  { name: "Zara Khan", time: "08:41", plan: "Premium" },
];

export default function DashboardPage() {
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  }, []);

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,_#f5f8ff_0%,_#eef5ff_100%)] text-slate-900">
      <AppHeader title={`${greeting}, Nisha`} />

      <PageContainer>
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <article key={card.label} className="rounded-[1.4rem] border border-slate-200 bg-white p-4 shadow-[0_10px_35px_rgba(15,23,42,0.06)]">
                <div className={`inline-flex rounded-2xl p-2 ${card.tone}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <p className="mt-4 text-sm font-medium text-slate-500">{card.label}</p>
                <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">{card.value}</p>
                <p className="mt-2 text-sm text-slate-500">{card.change}</p>
              </article>
            );
          })}
        </section>

        <section className="mt-6 grid gap-3 md:grid-cols-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.title}
                className={`rounded-[1.5rem] bg-gradient-to-br ${action.accent} p-[1px] text-left shadow-[0_18px_45px_rgba(37,99,235,0.16)]`}
              >
                <div className="rounded-[1.4rem] bg-white/95 p-4 backdrop-blur">
                  <div className="flex items-center justify-between">
                    <div className={`inline-flex rounded-2xl bg-slate-950/95 p-2.5 text-white`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <BadgeCheck className="h-4 w-4 text-blue-600" />
                  </div>
                  <h2 className="mt-4 text-lg font-semibold text-slate-900">{action.title}</h2>
                  <p className="mt-1 text-sm text-slate-500">{action.subtitle}</p>
                </div>
              </button>
            );
          })}
        </section>

        <section className="mt-6 rounded-[1.7rem] border border-slate-200 bg-white p-4 shadow-[0_10px_35px_rgba(15,23,42,0.06)] sm:p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">Recent Check-ins</p>
              <p className="text-sm text-slate-500">Today&apos;s arrivals and renewals</p>
            </div>
            <button className="rounded-full border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:border-blue-200 hover:text-blue-600">
              View all
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {recentCheckIns.map((entry) => (
              <div key={entry.name} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/70 px-3 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 text-sm font-semibold text-white">
                    {entry.name
                      .split(" ")
                      .map((part) => part[0])
                      .join("")}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{entry.name}</p>
                    <p className="text-sm text-slate-500">{entry.plan} member</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-900">{entry.time}</p>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Arrived</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </PageContainer>

      <BottomNavigation />
    </div>
  );
}
