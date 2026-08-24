import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MembershipStatus, PaymentStatus } from "@prisma/client";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

type ScopeFilter = {
  gymId?: string;
  branchId?: string;
};

const INR_FORMAT = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const WEEKDAYS = [
  "Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
];

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Scope strictly to the authenticated user's gym/branch.
    let scopeFilter: ScopeFilter = {};
    if (session.user.gymId) {
      scopeFilter.gymId = session.user.gymId;
      if (session.user.branchId) {
        scopeFilter.branchId = session.user.branchId;
      }
    }

    // Legacy fallback for deployments that don't store scope on the session.
    if (!scopeFilter.gymId) {
      const gym = await prisma.gym.findFirst();
      if (!gym) {
        return NextResponse.json({ error: "No gym found" }, { status: 400 });
      }
      scopeFilter.gymId = gym.id;
      const branch = await prisma.branch.findFirst({
        where: { gymId: gym.id, isActive: true },
      });
      if (branch) {
        scopeFilter.branchId = branch.id;
      }
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart);
    todayEnd.setHours(23, 59, 59, 999);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const inSevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const inThirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const [
      totalMembers,
      activeMembers,
      newMembersThisMonth,
      newMembersPreviousMonth,
      attendanceToday,
      attendanceThisMonth,
      attendanceWeekRecords,
      revenueThisMonthAgg,
      revenuePreviousMonthAgg,
      expiringIn7Days,
      expiringIn30Days,
      renewalsThisMonth,
    ] = await Promise.all([
      // Total members in scope
      prisma.member.count({ where: scopeFilter as any }),

      // Active members — matching the dashboard logic (ACTIVE + endDate >= now)
      prisma.membership.count({
        where: {
          ...scopeFilter,
          status: MembershipStatus.ACTIVE,
          endDate: { gte: now },
        } as any,
      }),

      // New members this month
      prisma.member.count({
        where: {
          ...scopeFilter,
          joiningDate: { gte: startOfMonth, lte: endOfMonth },
        } as any,
      }),

      // New members previous month
      prisma.member.count({
        where: {
          ...scopeFilter,
          joiningDate: { gte: prevMonthStart, lte: prevMonthEnd },
        } as any,
      }),

      // Today's attendance
      prisma.attendance.count({
        where: {
          ...scopeFilter,
          attendanceDate: { gte: todayStart, lte: todayEnd },
        } as any,
      }),

      // This month's attendance
      prisma.attendance.count({
        where: {
          ...scopeFilter,
          attendanceDate: { gte: startOfMonth, lte: endOfMonth },
        } as any,
      }),

      // Current week's attendance records — will be grouped by day below
      prisma.attendance.findMany({
        where: { ...scopeFilter, attendanceDate: { gte: startOfWeek } } as any,
        select: { attendanceDate: true },
      }),

      // Revenue this month
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: {
          ...scopeFilter,
          paymentStatus: PaymentStatus.PAID,
          paymentDate: { gte: startOfMonth, lte: endOfMonth },
        } as any,
      }),

      // Revenue previous month
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: {
          ...scopeFilter,
          paymentStatus: PaymentStatus.PAID,
          paymentDate: { gte: prevMonthStart, lte: prevMonthEnd },
        } as any,
      }),

      // Expiring in next 7 days
      prisma.membership.count({
        where: {
          ...scopeFilter,
          status: MembershipStatus.ACTIVE,
          endDate: { gte: now, lte: inSevenDays },
        } as any,
      }),

      // Expiring in next 30 days
      prisma.membership.count({
        where: {
          ...scopeFilter,
          status: MembershipStatus.ACTIVE,
          endDate: { gte: now, lte: inThirtyDays },
        } as any,
      }),

      // Renewals this month (memberships created this month)
      prisma.membership.count({
        where: {
          ...scopeFilter,
          createdAt: { gte: startOfMonth, lte: endOfMonth },
        } as any,
      }),
    ]);

    const revenueThisMonth = Number(revenueThisMonthAgg._sum.amount || 0);
    const revenuePreviousMonth = Number(revenuePreviousMonthAgg._sum.amount || 0);

    const newMembersChangePct =
      newMembersPreviousMonth > 0
        ? Math.round(
            ((newMembersThisMonth - newMembersPreviousMonth) /
              newMembersPreviousMonth) *
              100
          )
        : null;

    const revenueChangePct =
      revenuePreviousMonth > 0
        ? Math.round(((revenueThisMonth - revenuePreviousMonth) / revenuePreviousMonth) * 100)
        : null;

    // Group current-week attendance by day
    const attendanceWeek = WEEKDAYS.map((day, i) => {
      const dayDate = new Date(
        startOfWeek.getFullYear(),
        startOfWeek.getMonth(),
        startOfWeek.getDate() + i
      );
      const count = attendanceWeekRecords.filter((a) => {
        const ad = a.attendanceDate;
        return (
          ad.getFullYear() === dayDate.getFullYear() &&
          ad.getMonth() === dayDate.getMonth() &&
          ad.getDate() === dayDate.getDate()
        );
      }).length;
      return { day, count };
    });

    const plural = (n: number) => (n === 1 ? "" : "s");

    // Deterministic, DB-calculated insights — NOT AI-generated.
    const insights: string[] = [];

    if (activeMembers > 0) {
      insights.push(
        `Your gym currently has ${activeMembers} active member${plural(activeMembers)}.`
      );
    } else if (totalMembers > 0) {
      insights.push(
        "No active memberships right now. Renewals and new enrollments will appear here."
      );
    } else {
      insights.push(
        "No members have been registered yet. Register members to see active counts and trends."
      );
    }

    if (newMembersThisMonth > 0) {
      insights.push(
        `${newMembersThisMonth} new member${plural(newMembersThisMonth)} joined this month.`
      );
      if (newMembersChangePct !== null) {
        if (newMembersChangePct > 0) {
          insights.push(
            `New member sign-ups are up ${newMembersChangePct}% compared to last month.`
          );
        } else if (newMembersChangePct < 0) {
          insights.push(
            `New member sign-ups are down ${Math.abs(newMembersChangePct)}% compared to last month.`
          );
        } else {
          insights.push("New member sign-ups are flat compared to last month.");
        }
      }
    } else if (totalMembers > 0) {
      insights.push("No new members have joined this month yet.");
    }

    if (revenueThisMonth > 0) {
      insights.push(
        `${INR_FORMAT.format(revenueThisMonth)} collected in payments this month.`
      );
      if (revenueChangePct !== null) {
        if (revenueChangePct > 0) {
          insights.push(`Revenue is up ${revenueChangePct}% compared to last month.`);
        } else if (revenueChangePct < 0) {
          insights.push(`Revenue is down ${Math.abs(revenueChangePct)}% compared to last month.`);
        }
      }
    }

    if (expiringIn7Days > 0) {
      insights.push(
        `${expiringIn7Days} membership${plural(expiringIn7Days)} expiring in the next 7 days.`
      );
    }

    if (attendanceToday > 0) {
      insights.push(
        `Today's attendance is ${attendanceToday} member${plural(attendanceToday)}.`
      );
    } else if (totalMembers > 0) {
      insights.push("Attendance has not been recorded today yet.");
    }

    if (renewalsThisMonth > 0) {
      insights.push(
        `${renewalsThisMonth} membership${plural(renewalsThisMonth)} renewed this month.`
      );
    }

    return NextResponse.json({
      stats: {
        totalMembers,
        activeMembers,
        newMembersThisMonth,
        newMembersPreviousMonth,
        newMembersChangePct,
        attendanceToday,
        attendanceThisMonth,
        revenueThisMonth,
        revenuePreviousMonth,
        revenueChangePct,
        expiringIn7Days,
        expiringIn30Days,
        renewalsThisMonth,
      },
      attendanceWeek,
      insights,
    });
  } catch (error) {
    console.error("Failed to fetch member progress:", error);
    return NextResponse.json(
      { error: "Failed to load member progress. Please try again." },
      { status: 500 }
    );
  }
}