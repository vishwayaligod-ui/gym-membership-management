import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
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
  _count: {
    ptSessions: number;
  };
};

const DEFAULT_SPECIALIZATION = "Strength";
const DEFAULT_PHONE = "Not Provided";
const DEFAULT_PASSWORD = "Trainer@123";

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

export async function GET() {
  try {
    const access = await requireApiPermission("trainers", "read");
    if (access.response) {
      return access.response;
    }

    const [trainerProfiles, assignmentGroups] = await Promise.all([
      prisma.trainerProfile.findMany({
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
          _count: {
            select: {
              ptSessions: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.pTSession.groupBy({
        by: ["trainerProfileId", "memberId"],
      }),
    ]);

    const assignedMemberCountByTrainer = new Map<string, number>();
    for (const row of assignmentGroups) {
      assignedMemberCountByTrainer.set(
        row.trainerProfileId,
        (assignedMemberCountByTrainer.get(row.trainerProfileId) ?? 0) + 1
      );
    }

    const trainers = trainerProfiles.map((profile) =>
      mapTrainer(profile, assignedMemberCountByTrainer.get(profile.id) ?? 0)
    );

    const kpis = {
      totalTrainers: trainers.length,
      activeTrainers: trainers.filter((t) => t.status === "Active").length,
      onLeaveTrainers: trainers.filter((t) => t.status === "On Leave").length,
      totalAssignedMembers: trainers.reduce((sum, t) => sum + t.assignedMembers, 0),
    };

    return NextResponse.json({ trainers, kpis });
  } catch (error) {
    console.error("Failed to fetch trainers:", error);
    return NextResponse.json({ error: "Failed to fetch trainers" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const access = await requireApiPermission("trainers", "create");
    if (access.response) {
      return access.response;
    }

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

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { error: "A trainer with this email already exists" },
        { status: 409 }
      );
    }

    const gym = await prisma.gym.findFirst();
    if (!gym) {
      return NextResponse.json(
        { error: "No gym found. Please set up your gym first." },
        { status: 400 }
      );
    }

    const branch = await prisma.branch.findFirst({
      where: { gymId: gym.id, isActive: true },
    });

    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);

    const userIsActive = status !== "Inactive";
    const profileIsActive = status === "Active";

    const created = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          gymId: gym.id,
          branchId: branch?.id ?? null,
          fullName: name,
          email,
          phone,
          password: hashedPassword,
          role: "TRAINER",
          isActive: userIsActive,
        },
      });

      const trainerProfile = await tx.trainerProfile.create({
        data: {
          gymId: gym.id,
          userId: user.id,
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
          _count: {
            select: {
              ptSessions: true,
            },
          },
        },
      });

      return trainerProfile;
    });

    const trainer = mapTrainer(created, 0);
    return NextResponse.json(trainer, { status: 201 });
  } catch (error: unknown) {
    console.error("Failed to create trainer:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json(
        { error: "A trainer with this email already exists" },
        { status: 409 }
      );
    }
    const message = error instanceof Error ? error.message : "Failed to create trainer";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
