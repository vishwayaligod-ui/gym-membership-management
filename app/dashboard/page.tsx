"use client";

import Link from "next/link";
import {
  Users,
  UserCheck,
  CalendarClock,
  AlertTriangle,
  UserPlus,
  ClipboardCheck,
  CreditCard,
  ArrowRight,
} from "lucide-react";

const stats = [
  {
    title: "Total Members",
    value: "248",
    icon: Users,
    color: "bg-blue-500",
  },
  {
    title: "Present Today",
    value: "84",
    icon: UserCheck,
    color: "bg-green-500",
  },
  {
    title: "Renewals Due",
    value: "12",
    icon: CalendarClock,
    color: "bg-amber-500",
  },
  {
    title: "Expired",
    value: "7",
    icon: AlertTriangle,
    color: "bg-red-500",
  },
];

const actions = [
  {
    title: "Add Member",
    description: "Register a new gym member",
    href: "/members/new",
    icon: UserPlus,
  },
  {
    title: "Attendance",
    description: "Mark today's attendance",
    href: "/attendance",
    icon: ClipboardCheck,
  },
  {
    title: "Renewals",
    description: "Manage membership renewals",
    href: "/renewals",
    icon: CreditCard,
  },
];

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-5 py-8">

        {/* Header */}

        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-blue-600">
            Welcome Back 👋
          </p>

          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Elite Fitness Studio
          </h1>

          <p className="text-slate-500">
            Here's what's happening today.
          </p>
        </div>

        {/* Stats */}

        <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">

          {stats.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.title}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="flex items-center justify-between">

                  <div>
                    <p className="text-sm text-slate-500">
                      {item.title}
                    </p>

                    <h2 className="mt-3 text-4xl font-bold">
                      {item.value}
                    </h2>
                  </div>

                  <div
                    className={`flex h-14 w-14 items-center justify-center rounded-2xl ${item.color}`}
                  >
                    <Icon className="h-7 w-7 text-white" />
                  </div>
                </div>
              </div>
            );
          })}

        </div>

        {/* Quick Actions */}

        <div className="mt-12">

          <div className="mb-5 flex items-center justify-between">

            <h2 className="text-2xl font-bold text-slate-900">
              Quick Actions
            </h2>

          </div>

          <div className="grid gap-5 md:grid-cols-3">

            {actions.map((action) => {
              const Icon = action.icon;

              return (
                <Link
                  key={action.title}
                  href={action.href}
                  className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-blue-500 hover:shadow-xl"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600">
                    <Icon className="h-7 w-7 text-white" />
                  </div>

                  <h3 className="mt-5 text-xl font-semibold">
                    {action.title}
                  </h3>

                  <p className="mt-2 text-sm text-slate-500">
                    {action.description}
                  </p>

                  <div className="mt-6 flex items-center text-blue-600 font-semibold">
                    Open
                    <ArrowRight className="ml-2 h-4 w-4 transition group-hover:translate-x-1" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
                  {/* Recent Check-ins */}

        <div className="mt-12 grid gap-6 lg:grid-cols-3">

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">

            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900">
                Recent Check-ins
              </h2>

              <Link
                href="/attendance"
                className="text-sm font-semibold text-blue-600 hover:underline"
              >
                View All
              </Link>
            </div>

            <div className="space-y-4">

              {[
                {
                  name: "Rahul Patil",
                  time: "07:15 AM",
                  membership: "Gold",
                },
                {
                  name: "Sneha Kulkarni",
                  time: "07:42 AM",
                  membership: "Premium",
                },
                {
                  name: "Ajay Deshmukh",
                  time: "08:10 AM",
                  membership: "Silver",
                },
                {
                  name: "Neha Sharma",
                  time: "08:35 AM",
                  membership: "Gold",
                },
                {
                  name: "Kiran Joshi",
                  time: "09:00 AM",
                  membership: "Premium",
                },
              ].map((member) => (
                <div
                  key={member.name}
                  className="flex items-center justify-between rounded-2xl border border-slate-100 p-4 transition hover:bg-slate-50"
                >
                  <div className="flex items-center gap-4">

                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">
                      {member.name.charAt(0)}
                    </div>

                    <div>
                      <h4 className="font-semibold text-slate-900">
                        {member.name}
                      </h4>

                      <p className="text-sm text-slate-500">
                        {member.membership}
                      </p>
                    </div>

                  </div>

                  <span className="text-sm font-semibold text-green-600">
                    {member.time}
                  </span>
                </div>
              ))}

            </div>

          </div>

          {/* Today's Summary */}

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

            <h2 className="mb-6 text-2xl font-bold text-slate-900">
              Today's Summary
            </h2>

            <div className="space-y-5">

              <div className="rounded-2xl bg-blue-50 p-5">
                <p className="text-sm text-slate-500">
                  New Members
                </p>

                <h3 className="mt-2 text-3xl font-bold text-blue-700">
                  6
                </h3>
              </div>

              <div className="rounded-2xl bg-green-50 p-5">
                <p className="text-sm text-slate-500">
                  Attendance
                </p>

                <h3 className="mt-2 text-3xl font-bold text-green-700">
                  84
                </h3>
              </div>

              <div className="rounded-2xl bg-amber-50 p-5">
                <p className="text-sm text-slate-500">
                  Renewals Today
                </p>

                <h3 className="mt-2 text-3xl font-bold text-amber-700">
                  12
                </h3>
              </div>

              <div className="rounded-2xl bg-red-50 p-5">
                <p className="text-sm text-slate-500">
                  Expired Plans
                </p>

                <h3 className="mt-2 text-3xl font-bold text-red-700">
                  7
                </h3>
              </div>

            </div>

          </div>

        </div>

        {/* Renewals */}

        <div className="mt-12 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="mb-6 flex items-center justify-between">

            <h2 className="text-2xl font-bold text-slate-900">
              Upcoming Renewals
            </h2>

            <Link
              href="/renewals"
              className="text-sm font-semibold text-blue-600 hover:underline"
            >
              Manage
            </Link>

          </div>

          <div className="overflow-x-auto">

            <table className="min-w-full">

              <thead>

                <tr className="border-b">

                  <th className="py-3 text-left">Member</th>
                  <th className="py-3 text-left">Plan</th>
                  <th className="py-3 text-left">Expiry</th>
                  <th className="py-3 text-left">Status</th>

                </tr>

              </thead>

              <tbody>

                {[
                  ["Amit Patil", "Gold", "20 Jul", "Due"],
                  ["Pooja Rao", "Premium", "21 Jul", "Due"],
                  ["Rakesh Jain", "Silver", "22 Jul", "Due"],
                  ["Shilpa More", "Gold", "23 Jul", "Due"],
                ].map((row) => (
                  <tr key={row[0]} className="border-b last:border-none">

                    <td className="py-4">{row[0]}</td>
                    <td>{row[1]}</td>
                    <td>{row[2]}</td>

                    <td>
                      <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                        {row[3]}
                      </span>
                    </td>

                  </tr>
                ))}

              </tbody>

            </table>

          </div>

        </div>
              </div>

      {/* Footer */}

      <footer className="border-t border-slate-200 bg-white mt-12">
        <div className="mx-auto max-w-7xl px-5 py-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">

          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              Elite Fitness Studio
            </h3>

            <p className="text-sm text-slate-500">
              Gym Membership Management System
            </p>
          </div>

          <div className="flex items-center gap-6 text-sm text-slate-500">
            <Link
              href="/members"
              className="hover:text-blue-600 transition"
            >
              Members
            </Link>

            <Link
              href="/attendance"
              className="hover:text-blue-600 transition"
            >
              Attendance
            </Link>

            <Link
              href="/renewals"
              className="hover:text-blue-600 transition"
            >
              Renewals
            </Link>

            <Link
              href="/settings"
              className="hover:text-blue-600 transition"
            >
              Settings
            </Link>
          </div>

        </div>
      </footer>

    </main>
  );
}