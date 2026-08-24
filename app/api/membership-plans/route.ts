import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiPermission } from "@/lib/auth-helpers";

export async function GET() {
  try {
    const access = await requireApiPermission("membershipPlans", "read");
    if (access.response) {
      return access.response;
    }

    const plans = await prisma.membershipPlan.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { memberships: true },
        },
      },
    });

    return NextResponse.json(plans);
  } catch (error) {
    console.error("Failed to fetch membership plans:", error);
    return NextResponse.json(
      { error: "Failed to fetch membership plans" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const access = await requireApiPermission("membershipPlans", "create");
    if (access.response) {
      return access.response;
    }

    const body = await request.json();

    const { name, durationInDays, price, joiningFee, freezeDays, description, isActive } = body;

    // Validation
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const duration = Number(durationInDays);
    if (!Number.isInteger(duration) || duration <= 0) {
      return NextResponse.json({ error: "Duration must be a positive integer (months)" }, { status: 400 });
    }

    const membershipFee = Number(price);
    if (isNaN(membershipFee) || membershipFee < 0) {
      return NextResponse.json({ error: "Membership fee must be >= 0" }, { status: 400 });
    }

    const joiningFeeNum = Number(joiningFee) || 0;
    if (joiningFeeNum < 0) {
      return NextResponse.json({ error: "Joining fee must be >= 0" }, { status: 400 });
    }

    const freezeDaysNum = Number(freezeDays) || 0;
    if (freezeDaysNum < 0) {
      return NextResponse.json({ error: "Freeze days must be >= 0" }, { status: 400 });
    }

    // Get the first gym (multi-tenant support)
    const gym = await prisma.gym.findFirst();
    if (!gym) {
      return NextResponse.json(
        { error: "No gym found. Please set up your gym first." },
        { status: 400 }
      );
    }

    const plan = await prisma.membershipPlan.create({
      data: {
        gymId: gym.id,
        name: name.trim(),
        durationInDays: duration,
        price: membershipFee,
        joiningFee: joiningFeeNum,
        freezeDays: freezeDaysNum,
        description: description || null,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    return NextResponse.json(plan, { status: 201 });
  } catch (error) {
    console.error("Failed to create membership plan:", error);
    return NextResponse.json(
      { error: "Failed to create membership plan" },
      { status: 500 }
    );
  }
}