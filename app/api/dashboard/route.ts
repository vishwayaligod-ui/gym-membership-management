import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PaymentStatus, MembershipStatus, MemberStatus } from "@prisma/client";

function getDayName(date: Date): string {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return days[date.getDay()];
}

export async function GET() {
  try {
    // Get gym and branch for multi-tenant
    const gym = await prisma.gym.findFirst();
    if (!gym) {
      return NextResponse.json({ error: "No gym found" }, { status: 400 });
    }

    const branch = await prisma.branch.findFirst({
      where: { gymId: gym.id, isActive: true },
    });

    // Common where filters
    const gymFilter = { gymId: gym.id };
    const branchFilter = branch ? { ...gymFilter, branchId: branch.id } : gymFilter;

    // Date boundaries
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart);
    todayEnd.setHours(23, 59, 59, 999);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // ── Run all counts in parallel ──
    const [
      totalMembers,
      activeMemberships,
      expiringSoonCount,
      expiredMembershipsCount,
      todayCheckIns,
      currentActiveCheckIns,
      todayRevenueAgg,
      monthlyRevenueAgg,
      totalRevenueAgg,
      recentPayments,
      recentRenewals,
      recentRegistrations,
    ] = await Promise.all([
      // Total Members
      prisma.member.count({ where: branchFilter }),

      // Active Members (memberships with ACTIVE status and endDate >= now)
      prisma.membership.count({
        where: {
          ...branchFilter,
          status: MembershipStatus.ACTIVE,
          endDate: { gte: now },
        } as any,
      }),

      // Expiring Soon (within 30 days)
      prisma.membership.count({
        where: {
          ...branchFilter,
          status: MembershipStatus.ACTIVE,
          endDate: {
            gte: now,
            lte: thirtyDaysLater,
          },
        } as any,
      }),

      // Expired Memberships
      prisma.membership.count({
        where: {
          ...branchFilter,
          status: MembershipStatus.EXPIRED,
        } as any,
      }),

      // Today's Check-ins
      prisma.attendance.count({
        where: {
          ...branchFilter,
          attendanceDate: { gte: todayStart, lte: todayEnd },
        } as any,
      }),

      // Current Active Check-ins (checked in but not checked out today)
      prisma.attendance.count({
        where: {
          ...branchFilter,
          attendanceDate: { gte: todayStart, lte: todayEnd },
          checkOut: null,
        } as any,
      }),

      // Today's Revenue
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: {
          ...branchFilter,
          paymentStatus: PaymentStatus.PAID,
          paymentDate: { gte: todayStart },
        } as any,
      }),

      // Monthly Revenue
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: {
          ...branchFilter,
          paymentStatus: PaymentStatus.PAID,
          paymentDate: { gte: startOfMonth, lte: endOfMonth },
        } as any,
      }),

      // Total Revenue
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: {
          ...branchFilter,
          paymentStatus: PaymentStatus.PAID,
        } as any,
      }),

      // Recent Payments (last 5)
      prisma.payment.findMany({
        where: branchFilter as any,
        include: {
          member: {
            select: { id: true, firstName: true, lastName: true, phone: true },
          },
          membership: {
            select: {
              plan: { select: { name: true } },
            },
          },
        },
        orderBy: { paymentDate: "desc" },
        take: 5,
      }),

      // Recent Renewals (last 5 memberships created)
      prisma.membership.findMany({
        where: branchFilter as any,
        include: {
          member: {
            select: { id: true, firstName: true, lastName: true },
          },
          plan: {
            select: { id: true, name: true, price: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),

      // Recent Member Registrations (last 5 members)
      prisma.member.findMany({
        where: branchFilter as any,
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

    // ── Revenue Chart (monthly - last 12 months) ──
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    const monthlyPayments = await prisma.payment.findMany({
      where: {
        ...branchFilter,
        paymentStatus: PaymentStatus.PAID,
        paymentDate: { gte: twelveMonthsAgo },
      } as any,
      select: { amount: true, paymentDate: true },
    });
    const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const revenueChart: { label: string; amount: number }[] = [];
    for (let i = 0; i < 12; i++) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
      const month = monthDate.getMonth();
      const year = monthDate.getFullYear();
      const label = monthLabels[month];
      const amount = monthlyPayments
        .filter(
          (p) =>
            p.paymentDate.getMonth() === month && p.paymentDate.getFullYear() === year
        )
        .reduce((sum, p) => sum + Number(p.amount), 0);
      revenueChart.push({ label, amount });
    }

    // ── Membership Distribution (plan-wise) ──
    const plans = await prisma.membershipPlan.findMany({
      where: { gymId: gym.id, isActive: true },
      select: { id: true, name: true },
    });

    const planColorsMap: Record<string, string> = {
      Platinum: "bg-blue-600 text-blue-600 border-blue-200",
      Gold: "bg-amber-500 text-amber-500 border-amber-200",
      Silver: "bg-slate-400 text-slate-400 border-slate-200",
      Basic: "bg-zinc-600 text-zinc-600 border-zinc-200",
      Premium: "bg-purple-600 text-purple-600 border-purple-200",
      Classic: "bg-teal-600 text-teal-600 border-teal-200",
    };

    const totalActiveMemberships = activeMemberships;
    const membershipDistributionPromises = plans.map(async (plan) => {
      const count = await prisma.membership.count({
        where: {
          ...branchFilter,
          planId: plan.id,
          status: MembershipStatus.ACTIVE,
        } as any,
      });
      const percentage = totalActiveMemberships > 0
        ? parseFloat(((count / totalActiveMemberships) * 100).toFixed(1))
        : 0;
      return {
        tier: plan.name,
        count,
        percentage,
        color: planColorsMap[plan.name] || "bg-blue-600 text-blue-600 border-blue-200",
      };
    });
    const membershipDistribution = await Promise.all(membershipDistributionPromises);

    // ── Attendance Summary (today's check-ins by time slots) ──
    const todayAttendances = await prisma.attendance.findMany({
      where: {
        ...branchFilter,
        attendanceDate: { gte: todayStart, lte: todayEnd },
      } as any,
      select: { checkIn: true },
    });

    const timeSlots = [
      { label: "6 AM - 9 AM", startHour: 6, endHour: 9 },
      { label: "9 AM - 12 PM", startHour: 9, endHour: 12 },
      { label: "12 PM - 3 PM", startHour: 12, endHour: 15 },
      { label: "3 PM - 6 PM", startHour: 15, endHour: 18 },
      { label: "6 PM - 9 PM", startHour: 18, endHour: 21 },
      { label: "9 PM - 12 AM", startHour: 21, endHour: 24 },
    ];

    const maxCount = Math.max(
      ...timeSlots.map((slot) => {
        return todayAttendances.filter((a) => {
          if (!a.checkIn) return false;
          const hour = a.checkIn.getHours();
          return hour >= slot.startHour && hour < slot.endHour;
        }).length;
      }),
      1
    );

    const attendanceSummary = timeSlots.map((slot) => {
      const count = todayAttendances.filter((a) => {
        if (!a.checkIn) return false;
        const hour = a.checkIn.getHours();
        return hour >= slot.startHour && hour < slot.endHour;
      }).length;
      const percentage = Math.round((count / maxCount) * 100);
      return { time: slot.label, count, percentage };
    });

    // ── Map Recent Payments ──
    const mappedRecentPayments = recentPayments.map((p) => {
      const member = p.member;
      const initials = `${member.firstName.charAt(0)}${member.lastName?.charAt(0) || ""}`;
      return {
        id: p.id,
        memberId: p.memberId,
        memberName: `${member.firstName} ${member.lastName || ""}`.trim(),
        plan: p.membership?.plan?.name || "N/A",
        amount: Number(p.amount),
        paymentMode: p.paymentMode,
        paymentDate: p.paymentDate.toISOString(),
        avatar: initials,
        transactionId: p.transactionId,
      };
    });

    // ── Map Recent Renewals ──
    const mappedRecentRenewals = recentRenewals.map((r) => {
      const member = r.member;
      const initials = `${member.firstName.charAt(0)}${member.lastName?.charAt(0) || ""}`;
      return {
        id: r.id,
        memberId: r.memberId,
        memberName: `${member.firstName} ${member.lastName || ""}`.trim(),
        plan: r.plan.name,
        amount: Number(r.finalAmount),
        startDate: r.startDate.toISOString(),
        endDate: r.endDate.toISOString(),
        avatar: initials,
        status: r.status,
      };
    });

    // ── Map Recent Registrations ──
    const mappedRecentRegistrations = recentRegistrations.map((m) => {
      const initials = `${m.firstName.charAt(0)}${m.lastName?.charAt(0) || ""}`;
      const timeAgo = getTimeAgo(m.createdAt);
      return {
        id: m.id,
        name: `${m.firstName} ${m.lastName || ""}`.trim(),
        memberCode: m.memberCode,
        gender: m.gender,
        phone: m.phone,
        avatar: initials,
        joinedAt: m.createdAt.toISOString(),
        timeAgo,
      };
    });

    // ── Quick Insights ──
    const quickInsights: { type: "success" | "info" | "warning" | "alert"; message: string; trend: string }[] = [];

    // Revenue trend insight
    if (revenueChart.length >= 2) {
      const lastMonth = revenueChart[revenueChart.length - 1]?.amount || 0;
      const prevMonth = revenueChart[revenueChart.length - 2]?.amount || 0;
      if (lastMonth > prevMonth && prevMonth > 0) {
        const pctChange = Math.round(((lastMonth - prevMonth) / prevMonth) * 100);
        quickInsights.push({
          type: "success",
          message: `Revenue increased ${pctChange}% compared to last month`,
          trend: `+${pctChange}%`,
        });
      } else if (prevMonth > 0) {
        const pctChange = Math.round(((prevMonth - lastMonth) / prevMonth) * 100);
        quickInsights.push({
          type: "warning",
          message: `Revenue decreased ${pctChange}% compared to last month`,
          trend: `-${pctChange}%`,
        });
      }
    }

    // Attendance insight
    if (todayCheckIns > 0) {
      quickInsights.push({
        type: "info",
        message: `Today's attendance: ${todayCheckIns} check-ins with ${currentActiveCheckIns} currently active`,
        trend: String(todayCheckIns),
      });
    }

    // Expiring insight
    if (expiringSoonCount > 0) {
      quickInsights.push({
        type: "warning",
        message: `${expiringSoonCount} membership${expiringSoonCount > 1 ? "s" : ""} expiring within the next 30 days`,
        trend: "Action",
      });
    }

    // New members insight
    if (mappedRecentRegistrations.length > 0) {
      quickInsights.push({
        type: "info",
        message: `${mappedRecentRegistrations.length} new member${mappedRecentRegistrations.length > 1 ? "s" : ""} joined recently`,
        trend: "Growth",
      });
    }

    // Active vs expired ratio insight
    if (totalMembers > 0 && expiredMembershipsCount > 0) {
      const retentionRate = Math.round(((totalMembers - expiredMembershipsCount) / totalMembers) * 100);
      if (retentionRate < 70) {
        quickInsights.push({
          type: "alert",
          message: `Member retention rate is ${retentionRate}% — consider engagement initiatives`,
          trend: `${retentionRate}%`,
        });
      } else {
        quickInsights.push({
          type: "success",
          message: `Member retention rate is ${retentionRate}% — healthy engagement`,
          trend: `${retentionRate}%`,
        });
      }
    }

    if (quickInsights.length === 0) {
      quickInsights.push({
        type: "info",
        message: "All metrics are normal. No significant changes detected.",
        trend: "Stable",
      });
    }

    return NextResponse.json({
      stats: {
        totalMembers,
        activeMembers: activeMemberships,
        expiringSoon: expiringSoonCount,
        expiredMembers: expiredMembershipsCount,
        todayCheckIns,
        currentActiveCheckIns,
        todayRevenue: Number(todayRevenueAgg._sum.amount || 0),
        monthlyRevenue: Number(monthlyRevenueAgg._sum.amount || 0),
        totalRevenue: Number(totalRevenueAgg._sum.amount || 0),
      },
      recentPayments: mappedRecentPayments,
      recentRenewals: mappedRecentRenewals,
      recentRegistrations: mappedRecentRegistrations,
      revenueChart,
      membershipDistribution,
      attendanceSummary,
      quickInsights,
    });
  } catch (error) {
    console.error("Failed to fetch dashboard data:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  if (diffDays < 30) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  return date.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
}