import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { Prisma, UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ownerSignupSchema } from "@/lib/validations/auth";

function buildGymCodeBase(gymName: string): string {
  const normalized = gymName.toUpperCase().replace(/[^A-Z0-9]+/g, "").slice(0, 2);

  if (normalized.length === 2) {
    return normalized;
  }

  return (normalized + "GY").slice(0, 2);
}

async function generateUniqueGymCode(
  tx: Prisma.TransactionClient,
  gymName: string
): Promise<string> {
  const base = buildGymCodeBase(gymName);

  for (let attempt = 0; attempt < 12; attempt += 1) {
    const randomSuffix = crypto.randomUUID().replace(/-/g, "").slice(0, 6).toUpperCase();
    const candidate = `${base}${randomSuffix}`;
    const existing = await tx.gym.findUnique({
      where: { code: candidate },
      select: { id: true },
    });

    if (!existing) {
      return candidate;
    }
  }

  throw new Error("Unable to generate a unique gym code");
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as unknown;
    const parsed = ownerSignupSchema.safeParse(body);

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0]?.message || "Invalid signup details";
      return NextResponse.json({ error: firstIssue }, { status: 400 });
    }

    const { gymName, ownerFullName, email, password } = parsed.data;
    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await prisma.$transaction(async (tx) => {
      const gymCode = await generateUniqueGymCode(tx, gymName);

      const gym = await tx.gym.create({
        data: {
          name: gymName.trim(),
          code: gymCode,
          email: normalizedEmail,
        },
      });

      const branch = await tx.branch.create({
        data: {
          gymId: gym.id,
          name: "Main Branch",
          code: "MAIN",
          isActive: true,
        },
      });

      await tx.user.create({
        data: {
          fullName: ownerFullName.trim(),
          email: normalizedEmail,
          password: passwordHash,
          role: UserRole.GYM_OWNER,
          isActive: true,
          gymId: gym.id,
          branchId: branch.id,
        },
      });
    });

    return NextResponse.json(
      { success: true, message: "Account created successfully." },
      { status: 201 }
    );
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return NextResponse.json(
          { error: "An account with this email already exists." },
          { status: 409 }
        );
      }
    }

    console.error("Owner signup failed:", error);
    return NextResponse.json(
      { error: "We could not create your account right now. Please try again." },
      { status: 500 }
    );
  }
}
