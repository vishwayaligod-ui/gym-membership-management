import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { AttendanceStatus, MemberStatus, MembershipStatus } from "@prisma/client";
import { requireApiPermission } from "@/lib/auth-helpers";

const attendanceQuerySchema = z.object({
  search: z.string().optional().default(""),
  date: z.string().optional(),
});

const attendanceCheckInSchema = z.object({
  memberId: z.string().min(1, "Member is required"),
  remarks: z.string().optional(),
});

function startOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function endOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(23, 59, 59, 999);
  return copy;
}

function formatTime(value: Date | null | undefined) {
  if (!value) {
    return "—";
  }

  return value.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function calculateDuration(checkIn: Date | null, checkOut: Date | null) {
  if (!checkIn || !checkOut) {
    return "—";
  }

  const diffMs = checkOut.getTime() - checkIn.getTime();
  const diffMinutes = Math.max(0, Math.round(diffMs / 60000));
  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;

  return `${hours}h ${minutes}m`;
}

class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = "ApiError";
  }
}

export async function GET(request: Request) {
  try {
    const access = await requireApiPermission("attendance", "read");
    if (access.response) {
      return access.response;
    }

    const session = access.session;
    const gymId = session?.user?.gymId ?? undefined;
    const branchId = session?.user?.branchId ?? undefined;

    const url = new URL(request.url);
    const parsed = attendanceQuerySchema.safeParse({
      search: url.searchParams.get("search") ?? "",
      date: url.searchParams.get("date") ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const { search, date } = parsed.data;
    const targetDate = date ? new Date(date) : new Date();
    const dateStart = startOfDay(targetDate);
    const dateEnd = endOfDay(targetDate);

    const attendances = await prisma.attendance.findMany({
      where: {
        ...(gymId ? { gymId } : {}),
        ...(branchId ? { branchId } : {}),
        attendanceDate: {
          gte: dateStart,
          lte: dateEnd,
        },
        OR: search
          ? [
              { member: { firstName: { contains: search, mode: "insensitive" } } },
              { member: { lastName: { contains: search, mode: "insensitive" } } },
              { member: { phone: { contains: search } } },
              { member: { memberCode: { contains: search, mode: "insensitive" } } },
            ]
          : undefined,
      },
      include: {
        member: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            status: true,
          },
        },
      },
      orderBy: {
        checkIn: "asc",
      },
    });

    const mappedRecords = attendances.map((attendance) => ({
      id: attendance.id,
      memberId: attendance.memberId,
      name: `${attendance.member.firstName} ${attendance.member.lastName || ""}`.trim(),
      avatar: `${attendance.member.firstName.charAt(0)}${attendance.member.lastName?.charAt(0) || ""}`,
      plan: "N/A",
      phone: attendance.member.phone,
      checkIn: formatTime(attendance.checkIn),
      checkOut: formatTime(attendance.checkOut),
      duration: calculateDuration(attendance.checkIn, attendance.checkOut),
      status: attendance.status,
      memberStatus: attendance.member.status,
    }));

    const checkedIn = mappedRecords.filter((record) => record.checkIn !== "—").length;
    const checkedOut = mappedRecords.filter((record) => record.checkOut !== "—").length;

    return NextResponse.json({
      records: mappedRecords,
      summary: {
        totalMembers: mappedRecords.length,
        checkedIn,
        checkedOut,
        activeNow: checkedIn - checkedOut,
        peakHour: "—",
        avgDuration: "—",
      },
    });
  } catch (error) {
    console.error("Failed to fetch attendance:", error);
    return NextResponse.json({ error: "Failed to fetch attendance" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const access = await requireApiPermission("attendance", "create");
    if (access.response) {
      return access.response;
    }

    const session = access.session;
    const gymId = session?.user?.gymId ?? undefined;
    const branchId = session?.user?.branchId ?? undefined;

    const body = await request.json();
    const parsed = attendanceCheckInSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const { memberId, remarks } = parsed.data;
    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);

    const result = await prisma.$transaction(async (tx) => {
      const member = await tx.member.findUnique({
        where: { id: memberId },
      });

      if (!member || (gymId && member.gymId !== gymId) || (branchId && member.branchId !== branchId)) {
        throw new ApiError("Member not found", 404);
      }

      if (member.status !== MemberStatus.ACTIVE) {
        throw new ApiError("Member is not active for check-in", 403);
      }

      const latestMembership = await tx.membership.findFirst({
        where: {
          memberId: member.id,
          ...(gymId ? { gymId } : {}),
          ...(branchId ? { branchId } : {}),
        },
        orderBy: {
          startDate: "desc",
        },
      });

      if (!latestMembership) {
        throw new ApiError("No active membership found for this member", 403);
      }

      if (
        latestMembership.status !== MembershipStatus.ACTIVE ||
        latestMembership.endDate < now
      ) {
        throw new ApiError("Membership is not active for check-in", 403);
      }

      const duplicate = await tx.attendance.findFirst({
        where: {
          memberId: member.id,
          ...(gymId ? { gymId } : {}),
          ...(branchId ? { branchId } : {}),
          attendanceDate: {
            gte: todayStart,
            lte: todayEnd,
          },
        },
      });

      if (duplicate) {
        throw new ApiError("Member already checked in today", 409);
      }

      const attendance = await tx.attendance.create({
        data: {
          gymId: member.gymId,
          branchId: member.branchId,
          memberId: member.id,
          createdById: session?.user?.id ?? (await tx.user.findFirst({ select: { id: true } }))?.id ?? "",
          attendanceDate: todayStart,
          checkIn: now,
          checkOut: null,
          status: AttendanceStatus.PRESENT,
          remarks: remarks || null,
        },
      });

      return attendance;
    });

    return NextResponse.json(
      {
        message: "Check-in recorded successfully",
        attendance: result,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error("Failed to create attendance:", error);
    return NextResponse.json({ error: "Failed to create attendance" }, { status: 500 });
  }
}
