import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MembershipStatus, PaymentStatus } from "@prisma/client";
import type { NotificationsResponse } from "@/app/notifications/types";
import { requireApiPermission } from "@/lib/auth-helpers";

export async function GET() {
  try {
    const access = await requireApiPermission("notifications", "read");
    if (access.response) {
      return access.response;
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
    const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // ── Reminders ──────────────────────────────────────────────────────

    // Expiry today: memberships ending today
    const expiryTodayCount = await prisma.membership.count({
      where: {
        status: MembershipStatus.ACTIVE,
        endDate: {
          gte: todayStart,
          lt: todayEnd,
        },
      },
    });

    // Pending payments: memberships with PENDING payment status
    const pendingPaymentsCount = await prisma.payment.count({
      where: {
        paymentStatus: PaymentStatus.PENDING,
      },
    });

    // Birthdays today: members whose dateOfBirth month/day matches today
    const allMembers = await prisma.member.findMany({
      where: {
        dateOfBirth: { not: null },
      },
      select: { dateOfBirth: true },
    });
    const birthdayTodayCount = allMembers.filter((m) => {
      if (!m.dateOfBirth) return false;
      return (
        m.dateOfBirth.getMonth() === now.getMonth() &&
        m.dateOfBirth.getDate() === now.getDate()
      );
    }).length;

    // Trial ending: memberships ending in the next 3 days (proxy for "trial")
    const trialEndingCount = await prisma.membership.count({
      where: {
        status: MembershipStatus.ACTIVE,
        endDate: {
          gte: now,
          lte: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
        },
      },
    });

    const reminders = [
      {
        id: 1,
        type: "expiry" as const,
        title: "Membership Expires Today",
        description: "Needs renewal immediately",
        count: expiryTodayCount,
        icon: "📅",
        color: "bg-rose-50 text-rose-600",
      },
      {
        id: 2,
        type: "payment" as const,
        title: "Pending Payments",
        description: "Awaiting member payment",
        count: pendingPaymentsCount,
        icon: "💳",
        color: "bg-amber-50 text-amber-600",
      },
      {
        id: 3,
        type: "birthday" as const,
        title: "Birthdays Today",
        description: "Send birthday wishes",
        count: birthdayTodayCount,
        icon: "🎂",
        color: "bg-purple-50 text-purple-600",
      },
      {
        id: 4,
        type: "trial" as const,
        title: "Trial Ending",
        description: "Convert to paid plans",
        count: trialEndingCount,
        icon: "⏰",
        color: "bg-blue-50 text-blue-600",
      },
    ];

    // ── Upcoming Renewals (next 7 days) ────────────────────────────────

    const upcomingMemberships = await prisma.membership.findMany({
      where: {
        status: MembershipStatus.ACTIVE,
        endDate: {
          gte: now,
          lte: sevenDaysLater,
        },
      },
      include: {
        member: { select: { firstName: true, lastName: true } },
        plan: { select: { name: true, price: true } },
      },
      orderBy: { endDate: "asc" },
      take: 10,
    });

    const upcomingRenewals = upcomingMemberships.map((m, idx) => {
      const daysUntil = Math.ceil(
        (m.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      const initials = `${m.member.firstName.charAt(0)}${m.member.lastName?.charAt(0) || ""}`;
      return {
        id: idx + 1,
        memberName: `${m.member.firstName} ${m.member.lastName || ""}`.trim(),
        planName: m.plan.name,
        daysUntil: Math.max(0, daysUntil),
        amount: Number(m.plan.price),
        avatar: initials || "?",
      };
    });

    // ── Overdue Payments ───────────────────────────────────────────────

    const overduePaymentsData = await prisma.payment.findMany({
      where: {
        paymentStatus: PaymentStatus.PENDING,
        paymentDate: { lt: now },
      },
      include: {
        member: { select: { firstName: true, lastName: true } },
        membership: {
          include: { plan: { select: { name: true } } },
        },
      },
      orderBy: { paymentDate: "asc" },
      take: 10,
    });

    const overduePayments = overduePaymentsData.map((p, idx) => {
      const daysOverdue = Math.ceil(
        (now.getTime() - p.paymentDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      const initials = `${p.member.firstName.charAt(0)}${p.member.lastName?.charAt(0) || ""}`;
      return {
        id: idx + 1,
        memberName: `${p.member.firstName} ${p.member.lastName || ""}`.trim(),
        amount: Number(p.amount),
        daysOverdue,
        planName: p.membership?.plan?.name || "N/A",
        avatar: initials || "?",
      };
    });

    // ── Recent Notifications (recent payments & renewals) ──────────────

    const recentPayments = await prisma.payment.findMany({
      where: {
        paymentStatus: PaymentStatus.PAID,
      },
      include: {
        member: { select: { firstName: true, lastName: true } },
      },
      orderBy: { paymentDate: "desc" },
      take: 5,
    });

    const recentRenewals = await prisma.membership.findMany({
      where: {
        status: MembershipStatus.ACTIVE,
        createdAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
      },
      include: {
        member: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    const recentNotifications: NotificationsResponse["recentNotifications"] = [];

    recentPayments.forEach((p, idx) => {
      const memberName = `${p.member.firstName} ${p.member.lastName || ""}`.trim();
      const diffMs = now.getTime() - p.paymentDate.getTime();
      const diffMin = Math.floor(diffMs / (1000 * 60));
      const diffHr = Math.floor(diffMs / (1000 * 60 * 60));
      let timestamp: string;
      if (diffMin < 60) {
        timestamp = `${diffMin} min ago`;
      } else if (diffHr < 24) {
        timestamp = `${diffHr} hours ago`;
      } else {
        timestamp = `${Math.floor(diffHr / 24)} days ago`;
      }

      recentNotifications.push({
        id: idx + 1,
        type: "payment",
        title: "Payment Received",
        description: `₹${Number(p.amount).toLocaleString()} received from ${memberName}`,
        timestamp,
        icon: "💰",
        color: "bg-amber-50 text-amber-600",
        read: false,
      });
    });

    recentRenewals.forEach((m, idx) => {
      const memberName = `${m.member.firstName} ${m.member.lastName || ""}`.trim();
      const diffMs = now.getTime() - m.createdAt.getTime();
      const diffHr = Math.floor(diffMs / (1000 * 60 * 60));
      let timestamp: string;
      if (diffHr < 1) {
        timestamp = "Just now";
      } else if (diffHr < 24) {
        timestamp = `${diffHr} hours ago`;
      } else {
        timestamp = `${Math.floor(diffHr / 24)} days ago`;
      }

      recentNotifications.push({
        id: 100 + idx + 1,
        type: "renewal",
        title: "Membership Renewed",
        description: `${memberName} successfully renewed today`,
        timestamp,
        icon: "✅",
        color: "bg-emerald-50 text-emerald-600",
        read: false,
      });
    });

    // Sort by timestamp (most recent first) and limit to 10
    recentNotifications.sort((a, b) => {
      const aMin = a.timestamp.includes("min")
        ? parseInt(a.timestamp)
        : a.timestamp.includes("hour")
          ? parseInt(a.timestamp) * 60
          : a.timestamp.includes("day")
            ? parseInt(a.timestamp) * 1440
            : 0;
      const bMin = b.timestamp.includes("min")
        ? parseInt(b.timestamp)
        : b.timestamp.includes("hour")
          ? parseInt(b.timestamp) * 60
          : b.timestamp.includes("day")
            ? parseInt(b.timestamp) * 1440
            : 0;
      return aMin - bMin;
    });

    const response: NotificationsResponse = {
      reminders,
      upcomingRenewals,
      overduePayments,
      recentNotifications: recentNotifications.slice(0, 10),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Failed to fetch notifications:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}