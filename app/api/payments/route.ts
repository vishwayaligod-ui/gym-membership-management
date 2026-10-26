import { NextResponse } from "next/server";
import { after } from "next/server";
import { prisma } from "@/lib/prisma";
import { PaymentStatus, PaymentMode, MembershipStatus } from "@prisma/client";
import { requireApiPermission } from "@/lib/auth-helpers";
import { sendRenewalReceiptWhatsApp } from "@/lib/whatsapp/receipts";

export async function GET(request: Request) {
  try {
    const access = await requireApiPermission("payments", "read");
    if (access.response) {
      return access.response;
    }

    // Tenant scope is derived ONLY from the authenticated session.
    // Never from query parameters, body, or URL — the list, its counts,
    // and its summary aggregates can only ever see this gym's payments.
    const session = access.session;
    const gymId = session?.user?.gymId;
    if (!gymId) {
      return NextResponse.json(
        { error: "No gym assigned to your account. Please contact an administrator." },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const method = searchParams.get("method") || "";
    const dateFrom = searchParams.get("dateFrom") || "";
    const dateTo = searchParams.get("dateTo") || "";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    // Validate pagination
    const validPage = Math.max(1, page);
    const validLimit = Math.min(100, Math.max(1, limit));
    const skip = (validPage - 1) * validLimit;

    // Build where clause — always scoped to the authenticated gym.
    const where: Record<string, unknown> = { gymId };

    // Search by member name, phone, or transactionId (receipt number)
    if (search) {
      where.OR = [
        {
          member: {
            OR: [
              { firstName: { contains: search, mode: "insensitive" } },
              { lastName: { contains: search, mode: "insensitive" } },
              { phone: { contains: search } },
            ],
          },
        },
        { transactionId: { contains: search, mode: "insensitive" } },
      ];
    }

    // Filter by payment status
    if (status) {
      where.paymentStatus = status as PaymentStatus;
    }

    // Filter by payment method
    if (method) {
      where.paymentMode = method as PaymentMode;
    }

    // Filter by date range
    if (dateFrom || dateTo) {
      where.paymentDate = {};
      if (dateFrom) {
        (where.paymentDate as Record<string, unknown>).gte = new Date(dateFrom);
      }
      if (dateTo) {
        (where.paymentDate as Record<string, unknown>).lte = new Date(
          dateTo + "T23:59:59.999Z"
        );
      }
    }

    // Get total count
    const total = await prisma.payment.count({ where: where as any });

    // Fetch payments with relations
    const payments = await prisma.payment.findMany({
      where: where as any,
      include: {
        member: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        membership: {
          select: {
            id: true,
            startDate: true,
            endDate: true,
            amount: true,
            discount: true,
            finalAmount: true,
            plan: {
              select: {
                id: true,
                name: true,
                price: true,
              },
            },
          },
        },
      },
      orderBy: { paymentDate: "desc" },
      skip,
      take: validLimit,
    });

    // Map to response format
    const mappedPayments = payments.map((payment) => {
      const member = payment.member;
      const membership = payment.membership;
      const plan = membership?.plan;

      // Calculate avatar initials
      const initials = `${member.firstName.charAt(0)}${
        member.lastName?.charAt(0) || ""
      }`;

      return {
        id: payment.id,
        memberId: payment.memberId,
        membershipId: payment.membershipId,
        memberName: `${member.firstName} ${member.lastName || ""}`.trim(),
        memberPhone: member.phone,
        plan: plan?.name || "N/A",
        planId: plan?.id || "",
        amount: Number(payment.amount),
        paymentMode: payment.paymentMode,
        paymentStatus: payment.paymentStatus,
        transactionId: payment.transactionId,
        paymentDate: payment.paymentDate.toISOString(),
        remarks: payment.remarks,
        avatar: initials,
        membershipStartDate: membership?.startDate?.toISOString() || null,
        membershipEndDate: membership?.endDate?.toISOString() || null,
        membershipAmount: membership ? Number(membership.amount) : null,
        membershipDiscount: membership ? Number(membership.discount) : null,
        membershipFinalAmount: membership ? Number(membership.finalAmount) : null,
        createdAt: payment.createdAt.toISOString(),
        updatedAt: payment.updatedAt.toISOString(),
      };
    });

    // Calculate summary stats
    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const [todayRevenue, weeklyRevenue, monthlyRevenue, pendingCount] =
      await Promise.all([
        prisma.payment.aggregate({
          _sum: { amount: true },
          where: {
            gymId,
            paymentStatus: PaymentStatus.PAID,
            paymentDate: { gte: startOfToday },
          },
        }),
        prisma.payment.aggregate({
          _sum: { amount: true },
          where: {
            gymId,
            paymentStatus: PaymentStatus.PAID,
            paymentDate: { gte: startOfWeek },
          },
        }),
        prisma.payment.aggregate({
          _sum: { amount: true },
          where: {
            gymId,
            paymentStatus: PaymentStatus.PAID,
            paymentDate: { gte: startOfMonth, lte: endOfMonth },
          },
        }),
        prisma.payment.count({
          where: { gymId, paymentStatus: PaymentStatus.PENDING },
        }),
      ]);

    const pendingAmount = await prisma.payment.aggregate({
      _sum: { amount: true },
      where: { gymId, paymentStatus: PaymentStatus.PENDING },
    });

    return NextResponse.json({
      payments: mappedPayments,
      pagination: {
        page: validPage,
        limit: validLimit,
        total,
        totalPages: Math.ceil(total / validLimit),
      },
      summary: {
        todayRevenue: Number(todayRevenue._sum.amount || 0),
        weeklyRevenue: Number(weeklyRevenue._sum.amount || 0),
        monthlyRevenue: Number(monthlyRevenue._sum.amount || 0),
        pendingCount,
        pendingAmount: Number(pendingAmount._sum.amount || 0),
      },
    });
  } catch (error) {
    console.error("Failed to fetch payments:", error);
    return NextResponse.json(
      { error: "Failed to fetch payments" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const access = await requireApiPermission("payments", "create");
    if (access.response) {
      return access.response;
    }

    // Tenant scope is derived ONLY from the authenticated session.
    // Never from the request body and never from a database lookup
    // (e.g. prisma.gym.findFirst()), which is non-deterministic in a
    // multi-gym database and could attach the payment to the wrong gym.
    const session = access.session;
    const gymId = session?.user?.gymId;
    if (!gymId) {
      return NextResponse.json(
        { error: "No gym assigned to your account. Please contact an administrator." },
        { status: 400 }
      );
    }

    const body = await request.json();

    const {
      memberId,
      membershipId,
      amount,
      paymentMode,
      paymentStatus,
      paymentDate,
      transactionId,
      remarks,
    } = body;

    // Validate required fields
    if (!memberId || !membershipId || !amount || !paymentMode || !paymentStatus) {
      return NextResponse.json(
        { error: "Missing required fields: member, membership, amount, payment mode, and payment status are required" },
        { status: 400 }
      );
    }

    // Validate amount
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json(
        { error: "Amount must be a valid positive number" },
        { status: 400 }
      );
    }

    // Validate payment mode
    const validPaymentModes: PaymentMode[] = ["CASH", "UPI", "CARD", "BANK_TRANSFER", "CHEQUE"];
    if (!validPaymentModes.includes(paymentMode as PaymentMode)) {
      return NextResponse.json(
        { error: "Invalid payment mode" },
        { status: 400 }
      );
    }

    // Validate payment status
    const validPaymentStatuses: PaymentStatus[] = ["PAID", "PARTIAL", "PENDING", "FAILED", "REFUNDED"];
    if (!validPaymentStatuses.includes(paymentStatus as PaymentStatus)) {
      return NextResponse.json(
        { error: "Invalid payment status" },
        { status: 400 }
      );
    }

    // Verify member exists AND belongs to the authenticated gym.
    const member = await prisma.member.findFirst({
      where: { id: memberId, gymId },
    });

    if (!member) {
      return NextResponse.json(
        { error: "Member not found" },
        { status: 404 }
      );
    }

    // Verify membership exists and belongs to the authenticated gym.
    const membership = await prisma.membership.findFirst({
      where: { id: membershipId, gymId },
      include: {
        plan: {
          select: { name: true },
        },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "Membership not found" },
        { status: 404 }
      );
    }

    if (membership.memberId !== memberId) {
      return NextResponse.json(
        { error: "Membership does not belong to the selected member" },
        { status: 400 }
      );
    }

    const branch = await prisma.branch.findFirst({
      where: { gymId, isActive: true },
    });
    if (!branch) {
      return NextResponse.json(
        { error: "No active branch found. Please set up a branch first." },
        { status: 400 }
      );
    }

    // Create the payment
    const payment = await prisma.payment.create({
      data: {
        gymId,
        branchId: branch.id,
        memberId,
        membershipId,
        amount: parsedAmount,
        paymentMode: paymentMode as PaymentMode,
        paymentStatus: paymentStatus as PaymentStatus,
        transactionId: transactionId?.trim() || null,
        paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
        remarks: remarks?.trim() || null,
      },
      include: {
        member: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        membership: {
          select: {
            id: true,
            startDate: true,
            endDate: true,
            amount: true,
            discount: true,
            finalAmount: true,
            plan: {
              select: {
                id: true,
                name: true,
                price: true,
              },
            },
          },
        },
      },
    });

    // If payment status is PAID, update membership status if needed
    if (paymentStatus === "PAID" && membership.status !== MembershipStatus.ACTIVE) {
      await prisma.membership.update({
        where: { id: membershipId },
        data: {
          status: MembershipStatus.ACTIVE,
        },
      });
    }

    // Fire-and-forget: for successful payments, deliver the PDF receipt over
    // WhatsApp after the response. A WhatsApp/PDF failure can never fail the
    // payment above.
    if (paymentStatus === "PAID") {
      after(async () => {
        try {
          await sendRenewalReceiptWhatsApp({ paymentId: payment.id });
        } catch (error) {
          console.error("[WhatsApp] Receipt delivery failed (payment POST):", error);
        }
      });
    }

    // Calculate initials for response
    const memberData = payment.member;
    const membershipData = payment.membership;
    const planData = membershipData?.plan;
    const initials = `${memberData.firstName.charAt(0)}${
      memberData.lastName?.charAt(0) || ""
    }`;

    return NextResponse.json(
      {
        message: "Payment recorded successfully",
        payment: {
          id: payment.id,
          memberId: payment.memberId,
          membershipId: payment.membershipId,
          memberName: `${memberData.firstName} ${memberData.lastName || ""}`.trim(),
          memberPhone: memberData.phone,
          plan: planData?.name || "N/A",
          planId: planData?.id || "",
          amount: Number(payment.amount),
          paymentMode: payment.paymentMode,
          paymentStatus: payment.paymentStatus,
          transactionId: payment.transactionId,
          paymentDate: payment.paymentDate.toISOString(),
          remarks: payment.remarks,
          avatar: initials,
          membershipStartDate: membershipData?.startDate?.toISOString() || null,
          membershipEndDate: membershipData?.endDate?.toISOString() || null,
          membershipAmount: membershipData ? Number(membershipData.amount) : null,
          membershipDiscount: membershipData ? Number(membershipData.discount) : null,
          membershipFinalAmount: membershipData ? Number(membershipData.finalAmount) : null,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create payment:", error);
    return NextResponse.json(
      { error: "Failed to create payment. Please try again." },
      { status: 500 }
    );
  }
}