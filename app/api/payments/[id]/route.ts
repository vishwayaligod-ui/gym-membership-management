import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PaymentStatus, PaymentMode } from "@prisma/client";
import { requireApiPermission } from "@/lib/auth-helpers";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const access = await requireApiPermission("payments", "read");
    if (access.response) {
      return access.response;
    }

    const { id } = await params;

    const payment = await prisma.payment.findUnique({
      where: { id },
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
                durationInDays: true,
              },
            },
          },
        },
      },
    });

    if (!payment) {
      return NextResponse.json(
        { error: "Payment not found" },
        { status: 404 }
      );
    }

    const member = payment.member;
    const membership = payment.membership;
    const plan = membership?.plan;

    const initials = `${member.firstName.charAt(0)}${
      member.lastName?.charAt(0) || ""
    }`;

    return NextResponse.json({
      payment: {
        id: payment.id,
        memberId: payment.memberId,
        membershipId: payment.membershipId,
        memberName: `${member.firstName} ${member.lastName || ""}`.trim(),
        memberPhone: member.phone,
        plan: plan?.name || "N/A",
        planId: plan?.id || "",
        planDurationInDays: plan?.durationInDays || 0,
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
      },
    });
  } catch (error) {
    console.error("Failed to fetch payment:", error);
    return NextResponse.json(
      { error: "Failed to fetch payment" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const access = await requireApiPermission("payments", "update");
    if (access.response) {
      return access.response;
    }

    const { id } = await params;
    const body = await request.json();

    const {
      amount,
      paymentMode,
      paymentStatus,
      paymentDate,
      transactionId,
      remarks,
    } = body;

    // Validate required fields
    if (!amount || !paymentMode || !paymentStatus) {
      return NextResponse.json(
        { error: "Missing required fields: amount, payment mode, and payment status are required" },
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

    // Check payment exists
    const existingPayment = await prisma.payment.findUnique({
      where: { id },
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
            status: true,
            plan: {
              select: { name: true },
            },
          },
        },
      },
    });

    if (!existingPayment) {
      return NextResponse.json(
        { error: "Payment not found" },
        { status: 404 }
      );
    }

    // Update the payment - memberId and membershipId stay unchanged
    const payment = await prisma.payment.update({
      where: { id },
      data: {
        amount: parsedAmount,
        paymentMode: paymentMode as PaymentMode,
        paymentStatus: paymentStatus as PaymentStatus,
        paymentDate: paymentDate ? new Date(paymentDate) : existingPayment.paymentDate,
        transactionId: transactionId?.trim() || null,
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
    if (paymentStatus === "PAID") {
      const membership = existingPayment.membership;
      if (membership && membership.status !== "ACTIVE") {
        await prisma.membership.update({
          where: { id: existingPayment.membershipId },
          data: { status: "ACTIVE" },
        });
      }
    }

    const memberData = payment.member;
    const membershipData = payment.membership;
    const planData = membershipData?.plan;
    const initials = `${memberData.firstName.charAt(0)}${
      memberData.lastName?.charAt(0) || ""
    }`;

    return NextResponse.json({
      message: "Payment updated successfully",
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
    });
  } catch (error) {
    console.error("Failed to update payment:", error);
    return NextResponse.json(
      { error: "Failed to update payment. Please try again." },
      { status: 500 }
    );
  }
}