import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiPermission } from "@/lib/auth-helpers";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const access = await requireApiPermission("membershipPlans", "read");
    if (access.response) {
      return access.response;
    }

    const { id } = await params;

    const plan = await prisma.membershipPlan.findUnique({
      where: { id },
    });

    if (!plan) {
      return NextResponse.json(
        { error: "Membership plan not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(plan);
  } catch (error) {
    console.error("Failed to fetch membership plan:", error);
    return NextResponse.json(
      { error: "Failed to fetch membership plan" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const access = await requireApiPermission("membershipPlans", "update");
    if (access.response) {
      return access.response;
    }

    const { id } = await params;
    const body = await request.json();

    const { name, durationInDays, price, joiningFee, freezeDays, description, isActive } = body;

    // Check plan exists
    const existing = await prisma.membershipPlan.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Membership plan not found" },
        { status: 404 }
      );
    }

    // Validation
    if (name !== undefined) {
      if (typeof name !== "string" || name.trim().length === 0) {
        return NextResponse.json({ error: "Name is required" }, { status: 400 });
      }
    }

    if (durationInDays !== undefined) {
      const duration = Number(durationInDays);
      if (!Number.isInteger(duration) || duration <= 0) {
        return NextResponse.json({ error: "Duration must be a positive integer (months)" }, { status: 400 });
      }
    }

    if (price !== undefined) {
      const membershipFee = Number(price);
      if (isNaN(membershipFee) || membershipFee < 0) {
        return NextResponse.json({ error: "Membership fee must be >= 0" }, { status: 400 });
      }
    }

    if (joiningFee !== undefined) {
      const joiningFeeNum = Number(joiningFee);
      if (joiningFeeNum < 0) {
        return NextResponse.json({ error: "Joining fee must be >= 0" }, { status: 400 });
      }
    }

    if (freezeDays !== undefined) {
      const freezeDaysNum = Number(freezeDays);
      if (freezeDaysNum < 0) {
        return NextResponse.json({ error: "Freeze days must be >= 0" }, { status: 400 });
      }
    }

    const plan = await prisma.membershipPlan.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(durationInDays !== undefined && { durationInDays: Number(durationInDays) }),
        ...(price !== undefined && { price: Number(price) }),
        ...(joiningFee !== undefined && { joiningFee: Number(joiningFee) }),
        ...(freezeDays !== undefined && { freezeDays: Number(freezeDays) }),
        ...(description !== undefined && { description: description || null }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json(plan);
  } catch (error) {
    console.error("Failed to update membership plan:", error);
    return NextResponse.json(
      { error: "Failed to update membership plan" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return PUT(request, { params });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const access = await requireApiPermission("membershipPlans", "delete");
    if (access.response) {
      return access.response;
    }

    const { id } = await params;

    const existing = await prisma.membershipPlan.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            memberships: true,
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Membership plan not found" },
        { status: 404 }
      );
    }

    if (existing._count.memberships > 0) {
      return NextResponse.json(
        {
          error: "This plan is currently assigned to members. Remove or move active memberships before deleting this plan.",
        },
        { status: 409 }
      );
    }

    await prisma.membershipPlan.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Membership plan deleted successfully" });
  } catch (error) {
    console.error("Failed to delete membership plan:", error);
    return NextResponse.json(
      { error: "Failed to delete membership plan" },
      { status: 500 }
    );
  }
}