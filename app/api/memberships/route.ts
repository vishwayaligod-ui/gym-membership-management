import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get("memberId") || "";

    if (!memberId) {
      return NextResponse.json(
        { error: "memberId query parameter is required" },
        { status: 400 }
      );
    }

    // Verify member exists
    const member = await prisma.member.findUnique({
      where: { id: memberId },
      select: { id: true },
    });

    if (!member) {
      return NextResponse.json(
        { error: "Member not found" },
        { status: 404 }
      );
    }

    // Fetch all memberships for the member with plan details
    const memberships = await prisma.membership.findMany({
      where: { memberId },
      include: {
        plan: {
          select: {
            id: true,
            name: true,
            price: true,
            durationInDays: true,
            description: true,
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
          },
        },
      },
      orderBy: { startDate: "desc" },
    });

    // Map to response format
    const mappedMemberships = memberships.map((membership) => {
      const plan = membership.plan;
      return {
        id: membership.id,
        memberId: membership.memberId,
        planId: plan.id,
        planName: plan.name,
        planPrice: Number(plan.price),
        planDurationInDays: plan.durationInDays,
        planDescription: plan.description,
        startDate: membership.startDate.toISOString(),
        endDate: membership.endDate.toISOString(),
        amount: Number(membership.amount),
        discount: Number(membership.discount),
        finalAmount: Number(membership.finalAmount),
        status: membership.status,
        remarks: membership.remarks,
        lastPayment: membership.payments[0] || null,
      };
    });

    return NextResponse.json({
      memberships: mappedMemberships,
    });
  } catch (error) {
    console.error("Failed to fetch memberships:", error);
    return NextResponse.json(
      { error: "Failed to fetch memberships" },
      { status: 500 }
    );
  }
}