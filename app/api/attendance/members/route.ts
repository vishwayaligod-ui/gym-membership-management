import { NextResponse } from "next/server";
import { MemberStatus, Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getMemberStatus } from "@/app/lib/member-status";
import { requireApiPermission } from "@/lib/auth-helpers";

function startOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function formatTime(value: Date | null | undefined) {
  if (!value) {
    return null;
  }

  return value.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export async function GET(request: Request) {
  try {
    const access = await requireApiPermission("attendance", "read");
    if (access.response) {
      return access.response;
    }

    const session = await auth();
    const gymId = session?.user?.gymId ?? undefined;
    const branchId = session?.user?.branchId ?? undefined;

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() ?? "";
    const searchWords = search.split(/\s+/).filter(Boolean);
    const now = new Date();
    const todayStart = startOfDay(now);

    const searchFilter: Prisma.MemberWhereInput[] | undefined = searchWords.length
      ? searchWords.map((word) => ({
          OR: [
            { firstName: { contains: word, mode: "insensitive" } },
            { lastName: { contains: word, mode: "insensitive" } },
            { phone: { contains: word } },
            { memberCode: { contains: word, mode: "insensitive" } },
          ],
        }))
      : undefined;

    const members = await prisma.member.findMany({
      where: {
        ...(gymId ? { gymId } : {}),
        ...(branchId ? { branchId } : {}),
        ...(searchFilter ? { AND: searchFilter } : {}),
      },
      include: {
        memberships: {
          include: {
            plan: true,
          },
          orderBy: {
            startDate: "desc",
          },
          take: 1,
        },
        attendances: {
          where: {
            attendanceDate: {
              gte: todayStart,
            },
          },
          orderBy: {
            checkIn: "desc",
          },
          take: 1,
        },
      },
      orderBy: {
        firstName: "asc",
      },
      take: search ? 20 : 10,
    });

    const mappedMembers = members.map((member) => {
      const latestMembership = member.memberships[0];
      const todayAttendance = member.attendances[0];
      const expiresOn = latestMembership?.endDate ?? null;

      const membershipStatus =
        member.status !== MemberStatus.ACTIVE
          ? member.status === MemberStatus.FROZEN
            ? "Frozen"
            : "Inactive"
          : getMemberStatus(expiresOn, latestMembership?.status);

      return {
        id: member.id,
        name: `${member.firstName} ${member.lastName || ""}`.trim(),
        avatar: `${member.firstName.charAt(0)}${member.lastName?.charAt(0) || ""}`,
        phone: member.phone,
        plan: latestMembership?.plan?.name || "N/A",
        membershipId: member.memberCode,
        membershipExpiry: expiresOn
          ? expiresOn.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          : "—",
        membershipStatus,
        lastVisit: "—",
        todayCheckedIn: Boolean(todayAttendance?.checkIn),
        todayCheckInTime: formatTime(todayAttendance?.checkIn),
        todayCheckOutTime: formatTime(todayAttendance?.checkOut),
      };
    });

    return NextResponse.json({ members: mappedMembers });
  } catch (error) {
    console.error("Failed to fetch attendance members:", error);
    return NextResponse.json({ error: "Failed to fetch attendance members" }, { status: 500 });
  }
}
