import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import type { TrainerStatus } from "@/app/trainers/types";
import { requireApiPermission } from "@/lib/auth-helpers";

type TrainerRecord = {
  id: string;
  specialization: string | null;
  experienceYears: number | null;
  joiningDate: Date | null;
  certifications: string | null;
  emergencyContact: string | null;
  bio: string | null;
  isActive: boolean;
  user: {
    id: string;
    fullName: string;
    email: string;
    phone: string | null;
    isActive: boolean;
  };
};

const DEFAULT_SPECIALIZATION = "Strength";
const DEFAULT_PHONE = "Not Provided";

function toAvatar(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "TR";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

function computeStatus(record: TrainerRecord): TrainerStatus {
  if (!record.user.isActive) return "Inactive";
  if (!record.isActive) return "On Leave";
  return "Active";
}

function computeRating(experience: number): number {
  const safeExperience = Number.isFinite(experience) ? Math.max(0, experience) : 0;
  const rating = Math.min(5, 4 + safeExperience * 0.1);
  return Number(rating.toFixed(1));
}

function mapTrainer(record: TrainerRecord, assignedMembers: number) {
  const experience = record.experienceYears ?? 0;
  return {
    id: record.id,
    name: record.user.fullName,
    email: record.user.email,
    phone: record.user.phone ?? DEFAULT_PHONE,
    specialization: record.specialization ?? DEFAULT_SPECIALIZATION,
    experience,
    assignedMembers,
    assignedMemberNames: [],
    status: computeStatus(record),
    avatar: toAvatar(record.user.fullName),
    rating: computeRating(experience),
    joiningDate: record.joiningDate ? record.joiningDate.toISOString() : null,
    certifications: record.certifications,
    emergencyContact: record.emergencyContact,
    notes: record.bio,
  };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const access = await requireApiPermission("trainers", "read");
    if (access.response) {
      return access.response;
    }

    const { id } = await params;

    const trainerProfile = await prisma.trainerProfile.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            isActive: true,
          },
        },
      },
    });

    if (!trainerProfile) {
      return NextResponse.json({ error: "Trainer not found" }, { status: 404 });
    }

    const assignedMembers = await prisma.pTSession.groupBy({
      by: ["memberId"],
      where: {
        trainerProfileId: id,
      },
    });

    const assignedMemberRows = await prisma.pTSession.findMany({
      where: {
        trainerProfileId: id,
      },
      distinct: ["memberId"],
      select: {
        member: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        sessionDate: "desc",
      },
      take: 8,
    });

    const assignedMemberNames = assignedMemberRows.map((row) =>
      `${row.member.firstName} ${row.member.lastName || ""}`.trim()
    );

    return NextResponse.json({
      ...mapTrainer(trainerProfile, assignedMembers.length),
      assignedMemberNames,
    });
  } catch (error) {
    console.error("Failed to fetch trainer:", error);
    return NextResponse.json({ error: "Failed to fetch trainer" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const access = await requireApiPermission("trainers", "update");
    if (access.response) {
      return access.response;
    }

    const { id } = await params;
    const body = await request.json();

    const name = (body.name as string | undefined)?.trim();
    const email = (body.email as string | undefined)?.trim().toLowerCase();
    const phone = (body.phone as string | undefined)?.trim();
    const specialization = (body.specialization as string | undefined)?.trim();
    const experience = Number(body.experience ?? 0);
    const status = (body.status as TrainerStatus | undefined) ?? "Active";

    if (!name || !email || !phone) {
      return NextResponse.json({ error: "Name, email, and phone are required" }, { status: 400 });
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      return NextResponse.json({ error: "Please enter a valid email address" }, { status: 400 });
    }

    if (!["Active", "On Leave", "Inactive"].includes(status)) {
      return NextResponse.json({ error: "Invalid trainer status" }, { status: 400 });
    }

    const existing = await prisma.trainerProfile.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Trainer not found" }, { status: 404 });
    }

    const userIsActive = status !== "Inactive";
    const profileIsActive = status === "Active";

    const duplicateEmailUser = await prisma.user.findFirst({
      where: {
        email,
        id: {
          not: existing.user.id,
        },
      },
      select: {
        id: true,
      },
    });

    if (duplicateEmailUser) {
      return NextResponse.json({ error: "A trainer with this email already exists" }, { status: 409 });
    }

    await prisma.user.update({
      where: { id: existing.user.id },
      data: {
        fullName: name,
        email,
        phone,
        isActive: userIsActive,
      },
    });

    const updated = await prisma.trainerProfile.update({
      where: { id },
      data: {
        specialization: specialization || DEFAULT_SPECIALIZATION,
        experienceYears: Number.isFinite(experience) ? Math.max(0, experience) : 0,
        isActive: profileIsActive,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            isActive: true,
          },
        },
      },
    });

    const assignedMembers = await prisma.pTSession.groupBy({
      by: ["memberId"],
      where: {
        trainerProfileId: id,
      },
    });

    const assignedMemberRows = await prisma.pTSession.findMany({
      where: {
        trainerProfileId: id,
      },
      distinct: ["memberId"],
      select: {
        member: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        sessionDate: "desc",
      },
      take: 8,
    });

    const assignedMemberNames = assignedMemberRows.map((row) =>
      `${row.member.firstName} ${row.member.lastName || ""}`.trim()
    );

    return NextResponse.json({
      ...mapTrainer(updated, assignedMembers.length),
      assignedMemberNames,
    });
  } catch (error: unknown) {
    console.error("Failed to update trainer:", error);
    const message = error instanceof Error ? error.message : "Failed to update trainer";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const access = await requireApiPermission("trainers", "delete");
    if (access.response) {
      return access.response;
    }

    const { id } = await params;

    const existing = await prisma.trainerProfile.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Trainer not found" }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.pTSession.deleteMany({
        where: {
          trainerProfileId: id,
        },
      });

      await tx.trainerProfile.delete({
        where: { id },
      });

      await tx.user.delete({
        where: {
          id: existing.user.id,
        },
      });
    });

    return NextResponse.json({ message: "Trainer deleted successfully" });
  } catch (error: unknown) {
    console.error("Failed to delete trainer:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      return NextResponse.json(
        {
          error:
            "This trainer cannot be deleted because related records still exist. Remove related records and try again.",
        },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: "Failed to delete trainer" }, { status: 500 });
  }
}
