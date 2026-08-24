import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { Prisma, type UserRole } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireApiPermission } from "@/lib/auth-helpers";

const ownerRoles: readonly UserRole[] = ["GYM_OWNER", "SUPER_ADMIN"];

const userCreateSchema = z
  .object({
    fullName: z.string().trim().min(2, "Full name is required"),
    email: z.string().trim().email("Enter a valid email address"),
    phone: z
      .string()
      .trim()
      .max(20)
      .optional()
      .transform((value) => value?.trim() || null),
    role: z.enum(["GYM_OWNER", "SUPER_ADMIN", "BRANCH_MANAGER", "RECEPTIONIST", "TRAINER"]),
    isActive: z.boolean().optional().default(true),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Confirm the password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function mapUser(user: {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  const parts = user.fullName.trim().split(/\s+/).filter(Boolean);
  const avatar =
    parts.length === 0
      ? "US"
      : parts.length === 1
        ? parts[0].slice(0, 2).toUpperCase()
        : `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();

  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    avatar,
  };
}

export async function GET() {
  try {
    const access = await requireApiPermission("settings", "read");
    if (access.response) {
      return access.response;
    }

    const gymId = access.session?.user.gymId;
    if (!gymId) {
      return NextResponse.json({ error: "No gym found" }, { status: 400 });
    }

    const [users, ownerCount] = await Promise.all([
      prisma.user.findMany({
        where: { gymId },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.user.count({
        where: {
          gymId,
          role: { in: ownerRoles as UserRole[] },
        },
      }),
    ]);

    return NextResponse.json({
      users: users.map(mapUser),
      currentUserId: access.session.user.id,
      ownerCount,
    });
  } catch (error) {
    console.error("Failed to fetch users:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const access = await requireApiPermission("settings", "create");
    if (access.response) {
      return access.response;
    }

    const gymId = access.session?.user.gymId;
    if (!gymId) {
      return NextResponse.json({ error: "No gym found" }, { status: 400 });
    }

    const body = (await request.json()) as unknown;
    const parsed = userCreateSchema.safeParse(body);

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0]?.message || "Invalid user payload";
      return NextResponse.json({ error: firstIssue, fieldErrors: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const email = normalizeEmail(parsed.data.email);
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      return NextResponse.json({ error: "A user with this email already exists" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 10);

    const created = await prisma.user.create({
      data: {
        gymId,
        branchId: null,
        fullName: parsed.data.fullName.trim(),
        email,
        phone: parsed.data.phone,
        password: passwordHash,
        role: parsed.data.role,
        isActive: parsed.data.isActive,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      user: mapUser(created),
      message: "User created successfully",
    }, { status: 201 });
  } catch (error) {
    console.error("Failed to create user:", error);

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "A user with this email already exists" }, { status: 409 });
    }

    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}
