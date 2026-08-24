import { NextResponse } from "next/server";
import type { UserRole } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireApiPermission } from "@/lib/auth-helpers";

const ownerRoles: readonly UserRole[] = ["GYM_OWNER", "SUPER_ADMIN"];

const userUpdateSchema = z
  .object({
    fullName: z.string().trim().min(2, "Full name is required").optional(),
    phone: z
      .string()
      .trim()
      .max(20)
      .optional()
      .transform((value) => (value === undefined ? undefined : value.trim() || null)),
    role: z.enum(["GYM_OWNER", "SUPER_ADMIN", "BRANCH_MANAGER", "RECEPTIONIST", "TRAINER"]).optional(),
    isActive: z.boolean().optional(),
  })
  .strict();

function toAvatar(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "US";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
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
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    avatar: toAvatar(user.fullName),
  };
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const access = await requireApiPermission("settings", "update");
    if (access.response) {
      return access.response;
    }

    const { id } = await params;
    const gymId = access.session?.user.gymId;
    if (!gymId) {
      return NextResponse.json({ error: "No gym found" }, { status: 400 });
    }

    const body = (await request.json()) as unknown;
    const parsed = userUpdateSchema.safeParse(body);

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0]?.message || "Invalid user payload";
      return NextResponse.json({ error: firstIssue, fieldErrors: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    if (Object.keys(parsed.data).length === 0) {
      return NextResponse.json({ error: "No update data provided" }, { status: 400 });
    }

    const existingUser = await prisma.user.findFirst({
      where: { id, gymId },
      select: { id: true, role: true, isActive: true },
    });

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (existingUser.id === access.session.user.id) {
      if (parsed.data.isActive === false) {
        return NextResponse.json({ error: "You cannot deactivate your own account" }, { status: 400 });
      }

      if (parsed.data.role && !ownerRoles.includes(parsed.data.role)) {
        return NextResponse.json({ error: "You cannot change your own role to a non-owner role" }, { status: 400 });
      }
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(parsed.data.fullName ? { fullName: parsed.data.fullName.trim() } : {}),
        ...(parsed.data.phone !== undefined ? { phone: parsed.data.phone } : {}),
        ...(parsed.data.role ? { role: parsed.data.role } : {}),
        ...(parsed.data.isActive !== undefined ? { isActive: parsed.data.isActive } : {}),
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
      user: mapUser(updated),
      message: "User updated successfully",
    });
  } catch (error) {
    console.error("Failed to update user:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const access = await requireApiPermission("settings", "delete");
    if (access.response) {
      return access.response;
    }

    const { id } = await params;
    const gymId = access.session?.user.gymId;
    if (!gymId) {
      return NextResponse.json({ error: "No gym found" }, { status: 400 });
    }

    const targetUser = await prisma.user.findFirst({
      where: { id, gymId },
      select: { id: true, role: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (targetUser.id === access.session.user.id) {
      return NextResponse.json({ error: "You cannot delete your own account" }, { status: 400 });
    }

    if (ownerRoles.includes(targetUser.role) && targetUser.role && ownerRoles.length > 0) {
      const ownerCount = await prisma.user.count({
        where: {
          gymId,
          role: { in: ownerRoles as UserRole[] },
        },
      });

      if (ownerCount <= 1) {
        return NextResponse.json({ error: "You cannot delete the last OWNER account" }, { status: 400 });
      }
    }

    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Failed to delete user:", error);
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
