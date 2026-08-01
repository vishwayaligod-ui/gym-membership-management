import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AttendanceStatus } from "@prisma/client";

const attendanceCheckoutSchema = z.object({
  checkOut: z.string().datetime().optional(),
  remarks: z.string().optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    const gymId = session?.user?.gymId ?? undefined;
    const branchId = session?.user?.branchId ?? undefined;

    const { id } = await params;
    const body = await request.json();
    const parsed = attendanceCheckoutSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const attendance = await prisma.attendance.findUnique({
      where: { id },
      include: { member: true },
    });

    if (!attendance) {
      return NextResponse.json({ error: "Attendance record not found" }, { status: 404 });
    }

    if ((gymId && attendance.gymId !== gymId) || (branchId && attendance.branchId !== branchId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (attendance.checkOut) {
      return NextResponse.json({ error: "Member already checked out today" }, { status: 409 });
    }

    const updated = await prisma.attendance.update({
      where: { id },
      data: {
        checkOut: parsed.data.checkOut ? new Date(parsed.data.checkOut) : new Date(),
        status: AttendanceStatus.PRESENT,
        remarks: parsed.data.remarks ?? attendance.remarks,
      },
    });

    return NextResponse.json({
      message: "Check-out recorded successfully",
      attendance: updated,
    });
  } catch (error) {
    console.error("Failed to update attendance:", error);
    return NextResponse.json({ error: "Failed to update attendance" }, { status: 500 });
  }
}
