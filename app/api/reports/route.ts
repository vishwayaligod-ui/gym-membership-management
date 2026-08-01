import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PaymentStatus, MembershipStatus } from "@prisma/client";
import { getMemberStatus } from "@/app/lib/member-status";
import type { ActivityLog, InsightMessage, MemberExportRow } from "@/app/reports/types";

function getDayName(date: Date): string {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return days[date.getDay()];
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get("dateFrom") || "";
    const dateTo = searchParams.get("dateTo") || "";
    const memberId = searchParams.get("memberId") || "";
    const planId = searchParams.get("planId") || "";

    // Get gym and branch for multi-tenant
    const gym = await prisma.gym.findFirst();
    if (!gym) {
      return NextResponse.json({ error: "No gym found" }, { status: 400 });
    }

    const branch = await prisma.branch.findFirst({
      where: { gymId: gym.id, isActive: true },
    });

    // Build common where filters
    const dateFilter: Record<string, unknown> = {};
    if (dateFrom) {
      dateFilter.gte = new Date(dateFrom);
    }
    if (dateTo) {
      dateFilter.lte = new Date(dateTo + "T23:59:59.999Z");
    }

    const paymentWhere: Record<string, unknown> = {
      paymentStatus: PaymentStatus.PAID,
      gymId: gym.id,
    };
    if (branch) paymentWhere.branchId = branch.id;
    if (Object.keys(dateFilter).length > 0) {
      paymentWhere.paymentDate = dateFilter;
    }
    if (memberId) {
      paymentWhere.memberId = memberId;
    }

    const membershipWhere: Record<string, unknown> = { gymId: gym.id };
    if (branch) membershipWhere.branchId = branch.id;

    const attendanceWhere: Record<string, unknown> = { gymId: gym.id };
    if (branch) attendanceWhere.branchId = branch.id;

    const memberWhere: Record<string, unknown> = { gymId: gym.id };
    if (branch) memberWhere.branchId = branch.id;

    const currentDate = new Date();

    const membersRaw = await prisma.member.findMany({
      where: memberWhere as any,
      include: {
        memberships: {
          include: {
            plan: true,
          },
          orderBy: { startDate: "desc" },
          take: 1,
        },
      },
      orderBy: { joiningDate: "desc" },
    });

    const members: MemberExportRow[] = membersRaw.map((member) => {
      const latestMembership = member.memberships[0];
      const expiryDate = latestMembership?.endDate ?? null;
      const daysRemaining = expiryDate
        ? Math.max(0, Math.ceil((expiryDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)))
        : 0;

      return {
        memberId: member.id,
        name: `${member.firstName} ${member.lastName || ""}`.trim(),
        phone: member.phone,
        email: member.email || "",
        plan: latestMembership?.plan?.name || "N/A",
        joinDate: member.joiningDate.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        expiryDate: expiryDate
          ? expiryDate.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          : "N/A",
        daysRemaining,
        membershipStatus: getMemberStatus(expiryDate, latestMembership?.status),
      };
    });

    // ── KPI: Total Revenue ──
    const revenueAgg = await prisma.payment.aggregate({
      _sum: { amount: true },
      where: paymentWhere as any,
    });
    const totalRevenue = Number(revenueAgg._sum.amount || 0);

    // ── KPI: Active Members ──
    const activeMembers = await prisma.membership.count({
      where: {
        ...membershipWhere,
        status: MembershipStatus.ACTIVE,
      } as any,
    });

    // ── KPI: Today's Attendance ──
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);

    const todayAttendance = await prisma.attendance.count({
      where: {
        ...attendanceWhere,
        attendanceDate: { gte: today, lte: todayEnd },
      } as any,
    });

    // ── KPI: Expiring Memberships (within next 7 days) ──
    const now = new Date();
    const sevenDaysLater = new Date(now);
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);

    const expiringMembershipsCount = await prisma.membership.count({
      where: {
        ...membershipWhere,
        status: MembershipStatus.ACTIVE,
        endDate: { gte: now, lte: sevenDaysLater },
      } as any,
    });

    // ── Revenue by Ranges ──
    const nowDate = new Date();

    // Daily (last 7 days, bucketed by hour or by day segments)
    const dailyLabels = ["06 AM", "09 AM", "12 PM", "03 PM", "06 PM", "09 PM"];
    const todayStart = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate());
    const dailyPayments = await prisma.payment.findMany({
      where: {
        ...paymentWhere,
        paymentDate: { gte: todayStart },
      } as any,
      select: { amount: true, paymentDate: true },
    });
    const dailyRevenue = dailyLabels.map((label) => {
      const hour = parseInt(label.split(" ")[0], 10);
      const isPM = label.includes("PM");
      const hour24 = isPM && hour !== 12 ? hour + 12 : !isPM && hour === 12 ? 0 : hour;
      const amount = dailyPayments
        .filter((p) => p.paymentDate.getHours() >= hour24 && p.paymentDate.getHours() < hour24 + 3)
        .reduce((sum, p) => sum + Number(p.amount), 0);
      return { label, amount };
    });

    // Weekly (last 7 days)
    const weekAgo = new Date(nowDate);
    weekAgo.setDate(weekAgo.getDate() - 6);
    weekAgo.setHours(0, 0, 0, 0);
    const weeklyPayments = await prisma.payment.findMany({
      where: {
        ...paymentWhere,
        paymentDate: { gte: weekAgo },
      } as any,
      select: { amount: true, paymentDate: true },
    });
    const weeklyLabels: string[] = [];
    const weeklyAmounts: number[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekAgo);
      d.setDate(d.getDate() + i);
      const dayName = getDayName(d);
      weeklyLabels.push(dayName);
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);
      const amount = weeklyPayments
        .filter((p) => p.paymentDate >= dayStart && p.paymentDate <= dayEnd)
        .reduce((sum, p) => sum + Number(p.amount), 0);
      weeklyAmounts.push(amount);
    }
    const weeklyRevenue = weeklyLabels.map((label, i) => ({
      label,
      amount: weeklyAmounts[i],
    }));

    // Monthly (last 12 months)
    const twelveMonthsAgo = new Date(nowDate.getFullYear(), nowDate.getMonth() - 11, 1);
    const monthlyPayments = await prisma.payment.findMany({
      where: {
        ...paymentWhere,
        paymentDate: { gte: twelveMonthsAgo },
      } as any,
      select: { amount: true, paymentDate: true },
    });
    const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthlyRevenue: { label: string; amount: number }[] = [];
    for (let i = 0; i < 12; i++) {
      const monthDate = new Date(nowDate.getFullYear(), nowDate.getMonth() - 11 + i, 1);
      const month = monthDate.getMonth();
      const year = monthDate.getFullYear();
      const label = monthLabels[month];
      const amount = monthlyPayments
        .filter(
          (p) =>
            p.paymentDate.getMonth() === month && p.paymentDate.getFullYear() === year
        )
        .reduce((sum, p) => sum + Number(p.amount), 0);
      monthlyRevenue.push({ label, amount });
    }

    // Yearly (last 5 years)
    const currentYear = nowDate.getFullYear();
    const yearlyRevenue: { label: string; amount: number }[] = [];
    for (let y = currentYear - 4; y <= currentYear; y++) {
      const yearStart = new Date(y, 0, 1);
      const yearEnd = new Date(y, 11, 31, 23, 59, 59, 999);
      const paymentsInYear = await prisma.payment.findMany({
        where: {
          ...paymentWhere,
          paymentDate: { gte: yearStart, lte: yearEnd },
        } as any,
        select: { amount: true },
      });
      const amount = paymentsInYear.reduce((sum, p) => sum + Number(p.amount), 0);
      yearlyRevenue.push({ label: String(y), amount });
    }

    // ── Attendance Data (current week) ──
    const startOfWeek = new Date(nowDate);
    startOfWeek.setDate(nowDate.getDate() - nowDate.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const weekAttendances = await prisma.attendance.findMany({
      where: {
        ...attendanceWhere,
        attendanceDate: { gte: startOfWeek, lte: endOfWeek },
      } as any,
      select: { attendanceDate: true },
    });

    const totalMembers = await prisma.member.count({
      where: { gymId: gym.id, branchId: branch?.id, status: "ACTIVE" as any },
    });

    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const attendanceData = dayNames.map((dayName) => {
      const dayIndex = dayNames.indexOf(dayName);
      const dayDate = new Date(startOfWeek);
      dayDate.setDate(dayDate.getDate() + dayIndex);
      const checkIns = weekAttendances.filter((a) => {
        const aDate = new Date(a.attendanceDate);
        return (
          aDate.getDate() === dayDate.getDate() &&
          aDate.getMonth() === dayDate.getMonth() &&
          aDate.getFullYear() === dayDate.getFullYear()
        );
      }).length;
      const percentage = totalMembers > 0 ? Math.round((checkIns / totalMembers) * 100) : 0;
      return { day: dayName, percentage, checkIns };
    });

    // ── Membership Stats (tier-wise distribution) ──
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

    const totalActiveMemberships = await prisma.membership.count({
      where: {
        ...membershipWhere,
        status: MembershipStatus.ACTIVE,
      } as any,
    });

    const membershipStatsPromises = plans.map(async (plan) => {
      const count = await prisma.membership.count({
        where: {
          ...membershipWhere,
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
    const membershipStats = await Promise.all(membershipStatsPromises);

    // ── Expiring Memberships ──
    const expiringMembershipsRaw = await prisma.membership.findMany({
      where: {
        ...membershipWhere,
        status: MembershipStatus.ACTIVE,
        endDate: { gte: now, lte: sevenDaysLater },
      } as any,
      include: {
        member: { select: { id: true, firstName: true, lastName: true, phone: true } },
        plan: { select: { name: true } },
      },
      orderBy: { endDate: "asc" },
      take: 10,
    });

    const expiringMemberships = expiringMembershipsRaw.map((m) => {
      const daysRemaining = Math.ceil(
        (m.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      const member = m.member;
      const initials = `${member.firstName.charAt(0)}${member.lastName?.charAt(0) || ""}`;
      return {
        id: m.id,
        name: `${member.firstName} ${member.lastName || ""}`.trim(),
        plan: m.plan.name,
        avatar: initials,
        expiryDate: m.endDate.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        daysRemaining: Math.max(0, daysRemaining),
        phone: member.phone,
        memberId: member.id,
      };
    });

    // ── Recent Activity ──
    const recentPayments = await prisma.payment.findMany({
      where: { gymId: gym.id } as any,
      include: {
        member: { select: { id: true, firstName: true, lastName: true } },
        membership: {
          select: {
            plan: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    const recentActivity = recentPayments.map((p) => {
      const member = p.member;
      const memberName = `${member.firstName} ${member.lastName || ""}`.trim();
      const planName = p.membership?.plan?.name || "Unknown";
      const minutesAgo = Math.floor(
        (nowDate.getTime() - p.createdAt.getTime()) / (1000 * 60)
      );

      let timeStr = "";
      if (minutesAgo < 60) {
        timeStr = `${minutesAgo} min ago`;
      } else {
        const hoursAgo = Math.floor(minutesAgo / 60);
        timeStr = `${hoursAgo} hour${hoursAgo > 1 ? "s" : ""} ago`;
      }

      let type: ActivityLog["type"] = "payment";
      let description = `Payment received for ${planName} plan`;
      let color = "bg-purple-900/30 text-purple-400";
      if (p.paymentStatus === "PAID") {
        type = "payment";
        color = "bg-purple-900/30 text-purple-400";
      }

      return {
        id: p.id,
        type,
        memberName,
        description,
        timestamp: timeStr,
        icon: "CreditCard",
        color,
      };
    });

    // ── Quick Insights ──
    const quickInsights: InsightMessage[] = [];

    // Revenue trend insight
    if (monthlyRevenue.length >= 2) {
      const lastMonth = monthlyRevenue[monthlyRevenue.length - 1]?.amount || 0;
      const prevMonth = monthlyRevenue[monthlyRevenue.length - 2]?.amount || 0;
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
    if (attendanceData.length > 0) {
      const maxAttendance = Math.max(...attendanceData.map((d) => d.checkIns));
      const maxDay = attendanceData.find((d) => d.checkIns === maxAttendance);
      if (maxDay) {
        quickInsights.push({
          type: "info",
          message: `Today's attendance: ${todayAttendance} check-ins. Peak was ${maxDay.day} with ${maxDay.checkIns}`,
          trend: String(todayAttendance),
        });
      }
    }

    // Expiring insight
    if (expiringMemberships.length > 0) {
      const urgentCount = expiringMemberships.filter((m) => m.daysRemaining <= 2).length;
      if (urgentCount > 0) {
        quickInsights.push({
          type: "warning",
          message: `${urgentCount} membership${urgentCount > 1 ? "s" : ""} expiring in the next 48 hours`,
          trend: "Action",
        });
      }
    }

    // Churn risk insight
    const inactiveThreshold = new Date(nowDate);
    inactiveThreshold.setDate(inactiveThreshold.getDate() - 14);
    const inactiveMembers = await prisma.attendance.groupBy({
      by: ["memberId"],
      where: {
        ...attendanceWhere,
        attendanceDate: { lt: inactiveThreshold },
      } as any,
      _max: { attendanceDate: true },
    });
    if (inactiveMembers.length > 0) {
      quickInsights.push({
        type: "alert",
        message: `${inactiveMembers.length} inactive member${inactiveMembers.length > 1 ? "s" : ""} have not attended in 14 days`,
        trend: "Risk",
      });
    }

    if (quickInsights.length === 0) {
      quickInsights.push({
        type: "info",
        message: "All metrics are normal. No significant changes detected.",
        trend: "Stable",
      });
    }

    return NextResponse.json({
      kpis: {
        totalRevenue,
        activeMembers,
        todayAttendance,
        expiringMemberships: expiringMembershipsCount,
      },
      revenue: {
        daily: dailyRevenue,
        weekly: weeklyRevenue,
        monthly: monthlyRevenue,
        yearly: yearlyRevenue,
      },
      attendance: attendanceData,
      membershipStats,
      expiringMemberships,
      members,
      recentActivity,
      quickInsights,
    });
  } catch (error) {
    console.error("Failed to fetch reports:", error);
    return NextResponse.json(
      { error: "Failed to fetch reports" },
      { status: 500 }
    );
  }
}