import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MembershipStatus, PaymentStatus, PaymentMode } from "@prisma/client";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const membership = await prisma.membership.findUnique({
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
        plan: {
          select: {
            id: true,
            name: true,
            price: true,
          },
        },
        payments: {
          orderBy: { paymentDate: "desc" },
          take: 1,
          select: {
            id: true,
            paymentDate: true,
            paymentStatus: true,
            amount: true,
            paymentMode: true,
          },
        },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "Membership not found" },
        { status: 404 }
      );
    }

    const member = membership.member;
    const plan = membership.plan;

    const now = new Date();
    const endDate = new Date(membership.endDate);
    const diffTime = endDate.getTime() - now.getTime();
    const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const expiryDate = endDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    const initials = `${member.firstName.charAt(0)}${member.lastName?.charAt(0) || ""}`;

    let status: "Active" | "Due Soon" | "Expired" | "Renewed";
    if (daysRemaining < 0) {
      status = "Expired";
    } else if (daysRemaining <= 30) {
      status = "Due Soon";
    } else {
      status = "Active";
    }

    const wasRenewed =
      membership.updatedAt.getTime() - membership.createdAt.getTime() > 60000 &&
      membership.status === "ACTIVE" &&
      daysRemaining > 0;

    return NextResponse.json({
      renewal: {
        id: membership.id,
        name: `${member.firstName} ${member.lastName || ""}`.trim(),
        plan: plan.name,
        phone: member.phone,
        expiryDate,
        daysRemaining,
        fee: Number(membership.finalAmount),
        status: wasRenewed ? "Renewed" : status,
        avatar: initials,
        membershipId: membership.id,
        planId: plan.id,
        amount: Number(membership.amount),
        discount: Number(membership.discount),
        finalAmount: Number(membership.finalAmount),
        startDate: membership.startDate.toISOString(),
        endDate: membership.endDate.toISOString(),
        lastPayment: membership.payments[0] || null,
        updatedAt: membership.updatedAt.toISOString(),
        createdAt: membership.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Failed to fetch renewal:", error);
    return NextResponse.json(
      { error: "Failed to fetch renewal" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const {
      planId,
      startDate,
      endDate,
      amount,
      discount,
      finalAmount,
      paymentMethod,
      notes,
    } = body;

    // Validate required fields
    if (!startDate || !endDate || !amount || !paymentMethod) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Find the existing membership
    const existingMembership = await prisma.membership.findUnique({
      where: { id },
      include: {
        plan: true,
      },
    });

    if (!existingMembership) {
      return NextResponse.json(
        { error: "Membership not found" },
        { status: 404 }
      );
    }

    // Map payment method
    const paymentModeMap: Record<string, PaymentMode> = {
      Cash: "CASH",
      UPI: "UPI",
      Card: "CARD",
      "Bank Transfer": "BANK_TRANSFER",
      Cheque: "CHEQUE",
    };
    const paymentMode = paymentModeMap[paymentMethod] || "CASH";

    // Update the existing membership record
    const updatedMembership = await prisma.membership.update({
      where: { id },
      data: {
        planId: planId || existingMembership.planId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        amount: amount,
        discount: discount || 0,
        finalAmount: finalAmount || amount,
        status: MembershipStatus.ACTIVE,
        remarks: notes || existingMembership.remarks,
      },
    });

    // Create a payment record for the renewal
    await prisma.payment.create({
      data: {
        gymId: existingMembership.gymId,
        branchId: existingMembership.branchId,
        memberId: existingMembership.memberId,
        membershipId: id,
        amount: finalAmount || amount,
        paymentMode,
        paymentStatus: PaymentStatus.PAID,
        paymentDate: new Date(),
        remarks: `Renewal payment for ${existingMembership.plan.name} - ${notes || ""}`.trim(),
      },
    });

    return NextResponse.json({
      message: "Renewal updated successfully",
      membership: {
        id: updatedMembership.id,
        startDate: updatedMembership.startDate,
        endDate: updatedMembership.endDate,
        amount: updatedMembership.amount,
        finalAmount: updatedMembership.finalAmount,
        status: updatedMembership.status,
      },
    });
  } catch (error) {
    console.error("Failed to update renewal:", error);
    return NextResponse.json(
      { error: "Failed to update renewal" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existingMembership = await prisma.membership.findUnique({
      where: { id },
    });

    if (!existingMembership) {
      return NextResponse.json(
        { error: "Membership not found" },
        { status: 404 }
      );
    }

    const cancelledMembership = await prisma.membership.update({
      where: { id },
      data: {
        status: MembershipStatus.CANCELLED,
        remarks: existingMembership.remarks
          ? `${existingMembership.remarks}\nCancelled via renewals API`
          : "Cancelled via renewals API",
      },
    });

    return NextResponse.json({
      message: "Membership cancelled successfully",
      membership: {
        id: cancelledMembership.id,
        status: cancelledMembership.status,
      },
    });
  } catch (error) {
    console.error("Failed to cancel renewal:", error);
    return NextResponse.json(
      { error: "Failed to cancel renewal" },
      { status: 500 }
    );
  }
}