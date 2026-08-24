import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireApiPermission } from "@/lib/auth-helpers";

const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Confirm the password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
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
    const parsed = resetPasswordSchema.safeParse(body);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0]?.message || "Invalid password payload";
      return NextResponse.json({ error: firstIssue, fieldErrors: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const targetUser = await prisma.user.findFirst({
      where: { id, gymId },
      select: { id: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 10);

    await prisma.user.update({
      where: { id },
      data: { password: passwordHash },
    });

    return NextResponse.json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Failed to reset user password:", error);
    return NextResponse.json({ error: "Failed to reset password" }, { status: 500 });
  }
}
