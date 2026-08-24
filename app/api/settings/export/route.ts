import { NextResponse } from "next/server";
import { getPrimaryGym, toSettingsPayload } from "../_utils";
import { prisma } from "@/lib/prisma";
import { requireApiPermission } from "@/lib/auth-helpers";

export async function GET(request: Request) {
  try {
    const access = await requireApiPermission("settings", "read");
    if (access.response) {
      return access.response;
    }

    const gym = await getPrimaryGym();
    if (!gym) {
      return NextResponse.json({ error: "No gym found" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const kind = searchParams.get("kind") || "configuration";

    if (kind === "configuration") {
      return NextResponse.json({
        exportedAt: new Date().toISOString(),
        gymId: gym.id,
        settings: toSettingsPayload(gym),
      });
    }

    const [branches, plans, members, memberships, payments, trainers] = await Promise.all([
      prisma.branch.findMany({ where: { gymId: gym.id } }),
      prisma.membershipPlan.findMany({ where: { gymId: gym.id } }),
      prisma.member.findMany({ where: { gymId: gym.id } }),
      prisma.membership.findMany({ where: { gymId: gym.id } }),
      prisma.payment.findMany({ where: { gymId: gym.id } }),
      prisma.trainerProfile.findMany({ where: { gymId: gym.id } }),
    ]);

    return NextResponse.json({
      exportedAt: new Date().toISOString(),
      gym,
      settings: toSettingsPayload(gym),
      branches,
      plans,
      members,
      memberships,
      payments,
      trainers,
      summary: {
        branches: branches.length,
        plans: plans.length,
        members: members.length,
        memberships: memberships.length,
        payments: payments.length,
        trainers: trainers.length,
      },
    });
  } catch (error) {
    console.error("Failed to export settings data:", error);
    return NextResponse.json({ error: "Failed to export settings data" }, { status: 500 });
  }
}
