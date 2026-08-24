"use client";

import { useEffect, useState } from "react";
import {
  Users,
  UserCheck,
  UserPlus,
  Activity,
  IndianRupee,
  CalendarClock,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  AlertCircle,
  Loader2,
} from "lucide-react";

type MemberProgressData = {
  stats: {
    totalMembers: number;
    activeMembers: number;
    newMembersThisMonth: number;
    newMembersPreviousMonth: number;
    newMembersChangePct: number | null;
    attendanceToday: number;
    attendanceThisMonth: number;
    revenueThisMonth: number;
    revenuePreviousMonth: number;
    revenueChangePct: number | null;
    expiringIn7Days: number;
    expiringIn30Days: number;
    renewalsThisMonth: number;
  };
  attendanceWeek: { day: string; count: number }[];
  insights: string[];
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
};

function TrendBadge({
  value,
  positiveIsGood = true,
}: {
  value: number | null;
  positiveIsGood?: boolean;
}) {
  if (value === null) return null;

  const isPositive = value > 0;
  const isNegative = value < 0;
  const isNeutral = value === 0;

  const Icon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus;

  let classes =
    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold";
  if (isNeutral) {
    classes += " bg-slate-100 text-slate-500";
  } else if (positiveIsGood ? isPositive : isNegative) {
    classes += " bg-emerald-50 text-emerald-700";
  } else {
    classes += " bg-red-50 text-red-600";
  }

  const label = `${isPositive ? "+" : ""}${value}%`;

  return (
    <span className={classes}>
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  sublabel,
  accentClass,
  iconBgClass,
}: {
  icon: typeof Users;
  label: string;
  value: string;
  sublabel?: React.ReactNode;
  accentClass?: string;
  iconBgClass: string;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconBgClass}`}
        >
          <Icon className="h-5 w-5" />
        </span>
        {sublabel}
      </div>
      <div className="min-w-0">
        <p className="truncate text-lg font-bold text-slate-900 sm:text-xl">
          {value}
        </p>
        <p className="mt-0.5 text-xs font-medium text-slate-500">{label}</p>
      </div>
      {accentClass && <div className={`h-0.5 w-full rounded-full ${accentClass}`} />}
    </div>
  );
}

export default function MemberProgress({
  variant = "progress",
}: {
  variant?: "progress" | "insights";
}) {
  const [data, setData] = useState<MemberProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchProgress() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("/api/member-progress", {
          cache: "no-store",
        });
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          throw new Error(body?.error || "Failed to load member progress.");
        }
        const json = await res.json();
        if (!cancelled) setData(json);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Something went wrong.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchProgress();
    return () => {
      cancelled = true;
    };
  }, []);

  // Loading state — clean skeleton matching the app's existing patterns.
  if (loading) {
    return (
      <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-16 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
          <p className="text-sm font-medium text-slate-500">
            Loading member progress...
          </p>
        </div>
      </div>
    );
  }

  // Error state — clean, user-friendly, no fake data.
  if (error || !data) {
    return (
      <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-16 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50">
            <AlertCircle className="h-7 w-7 text-red-500" />
          </span>
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Couldn't load member progress
            </h2>
            <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
              {error ||
                "We couldn't retrieve your gym data right now. Please try again."}
            </p>
          </div>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-amber-500/25 transition-colors hover:bg-amber-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { stats, attendanceWeek, insights } = data;
  const totalDataPoints =
    stats.totalMembers +
    stats.activeMembers +
    stats.newMembersThisMonth +
    stats.attendanceThisMonth +
    stats.revenueThisMonth +
    stats.expiringIn7Days +
    stats.renewalsThisMonth;

  // Empty state — no members/attendance/payments recorded yet.
  if (totalDataPoints === 0) {
    return (
      <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-16 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg shadow-amber-500/20">
            <Users className="h-8 w-8 text-white" />
          </span>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Not enough data yet
            </h2>
            <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-slate-500">
              Once you register members, record attendance, and collect payments,
              this page will show smart KPIs, revenue trends, expiring memberships,
              and helpful business insights.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const maxWeekCount = Math.max(...attendanceWeek.map((d) => d.count), 1);

  return (
    <div className="flex flex-1 flex-col gap-4">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900">
          {variant === "insights" ? "Gym Insights" : "Member Progress"}
        </h2>
        <p className="mt-0.5 text-sm text-slate-500">
          {variant === "insights"
            ? "Calculated from your live gym data"
            : "Smart insights from your gym data"}
        </p>
      </div>

      {variant === "progress" ? (
        /* KPI Cards — Member Progress only */
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
          <KpiCard
            icon={Users}
            iconBgClass="bg-amber-50 text-amber-600"
            label="Total Members"
            value={String(stats.totalMembers)}
            accentClass="bg-amber-400"
          />
          <KpiCard
            icon={UserCheck}
            iconBgClass="bg-emerald-50 text-emerald-600"
            label="Active Members"
            value={String(stats.activeMembers)}
            accentClass="bg-emerald-400"
          />
          <KpiCard
            icon={UserPlus}
            iconBgClass="bg-blue-50 text-blue-600"
            label="New Members"
            value={String(stats.newMembersThisMonth)}
            sublabel={
              <TrendBadge value={stats.newMembersChangePct} />
            }
            accentClass="bg-blue-400"
          />
          <KpiCard
            icon={Activity}
            iconBgClass="bg-violet-50 text-violet-600"
            label="Today's Attendance"
            value={String(stats.attendanceToday)}
            sublabel={
              stats.attendanceThisMonth > 0 ? (
                <span className="text-[11px] font-medium text-slate-400">
                  {stats.attendanceThisMonth} this month
                </span>
              ) : undefined
            }
            accentClass="bg-violet-400"
          />
          <KpiCard
            icon={IndianRupee}
            iconBgClass="bg-teal-50 text-teal-600"
            label="Revenue This Month"
            value={formatCurrency(stats.revenueThisMonth)}
            sublabel={
              <TrendBadge value={stats.revenueChangePct} />
            }
            accentClass="bg-teal-400"
          />
          <KpiCard
            icon={CalendarClock}
            iconBgClass="bg-rose-50 text-rose-600"
            label="Expiring in 7 Days"
            value={String(stats.expiringIn7Days)}
            sublabel={
              stats.expiringIn30Days > 0 ? (
                <span className="text-[11px] font-medium text-slate-400">
                  {stats.expiringIn30Days} in 30 days
                </span>
              ) : undefined
            }
            accentClass="bg-rose-400"
          />
        </div>
      ) : (
        <>
          {/* Trend Section — Gym Insights only */}
          {(attendanceWeek.some((d) => d.count > 0) ||
            stats.renewalsThisMonth > 0) && (
            <div className="grid gap-4 lg:grid-cols-2">
              {/* Attendance this week */}
              {attendanceWeek.some((d) => d.count > 0) && (
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Attendance This Week
                  </h3>
                  <div className="mt-4 flex h-28 items-end gap-1.5 sm:gap-2">
                    {attendanceWeek.map((d) => (
                      <div
                        key={d.day}
                        className="flex h-full flex-1 flex-col items-center justify-end gap-1.5"
                      >
                        <span className="text-[10px] font-semibold text-slate-500">
                          {d.count > 0 ? d.count : ""}
                        </span>
                        <div
                          className="w-full rounded-t-md bg-gradient-to-t from-amber-500 to-amber-400 transition-all"
                          style={{
                            height: d.count === 0 ? "3px" : `${(d.count / maxWeekCount) * 100}%`,
                            minHeight: d.count > 0 ? "8px" : "3px",
                          }}
                        />
                        <span className="text-[10px] font-medium text-slate-400">
                          {d.day}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Renewals this month */}
              {stats.renewalsThisMonth > 0 && (
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Membership Renewals
                  </h3>
                  <div className="mt-4 flex items-center gap-4">
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50">
                      <UserCheck className="h-6 w-6 text-emerald-600" />
                    </span>
                    <div>
                      <p className="text-2xl font-bold text-slate-900">
                        {stats.renewalsThisMonth}
                      </p>
                      <p className="text-xs text-slate-500">
                        renewed this month
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Gym Insights */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4 sm:px-6">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 shadow-sm shadow-amber-500/20">
                <Sparkles className="h-4 w-4 text-white" />
              </span>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Gym Insights</h3>
                <p className="text-xs text-slate-400">
                  Calculated from your live gym data
                </p>
              </div>
            </div>
            <div className="grid gap-2 px-5 py-5 sm:grid-cols-2 sm:px-6">
              {insights.map((insight) => (
                <div
                  key={insight}
                  className="flex items-start gap-2.5 rounded-xl bg-slate-50 px-3.5 py-3 text-sm leading-relaxed text-slate-700"
                >
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                  {insight}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
