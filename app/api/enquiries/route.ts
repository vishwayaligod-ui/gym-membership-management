import { EnquiryStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/auth-helpers";
import {
  dateOnlyString,
  dateOnlyToUtc,
  dateStringInTimeZone,
  isDateTodayOrLater,
  resolveEnquiryScope,
  utcDayRange,
} from "@/lib/enquiries";
import { prisma } from "@/lib/prisma";
import { createEnquirySchema, enquiryListQuerySchema } from "@/lib/validations/enquiry";

function toEnquiryResponse(enquiry: {
  id: string;
  name: string;
  mobileNumber: string;
  nextFollowUpAt: Date | null;
  notes: string | null;
  status: string;
  branchId: string;
  branch: { id: string; name: string };
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: enquiry.id,
    name: enquiry.name,
    mobileNumber: enquiry.mobileNumber,
    nextFollowUpDate: dateOnlyString(enquiry.nextFollowUpAt),
    notes: enquiry.notes,
    status: enquiry.status,
    branchId: enquiry.branchId,
    branch: enquiry.branch,
    createdAt: enquiry.createdAt.toISOString(),
    updatedAt: enquiry.updatedAt.toISOString(),
  };
}

export async function GET(request: Request) {
  try {
    const access = await requireApiPermission("enquiries", "read");
    if (access.response) return access.response;

    const resolved = await resolveEnquiryScope(access.session.user);
    if (resolved.response) return resolved.response;
    const scope = resolved.scope;

    const url = new URL(request.url);
    const parsed = enquiryListQuerySchema.safeParse({
      bucket: url.searchParams.get("bucket") ?? undefined,
      status: url.searchParams.get("status") ?? undefined,
      search: url.searchParams.get("search") ?? "",
      page: url.searchParams.get("page") ?? undefined,
      pageSize: url.searchParams.get("pageSize") ?? undefined,
    });
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const { bucket, status, search, page, pageSize } = parsed.data;
    const today = dateStringInTimeZone(new Date(), scope.timezone);
    const dayRange = utcDayRange(today);
    const openStatuses = [EnquiryStatus.PENDING, EnquiryStatus.CONTACTED];
    const tenantWhere = {
      gymId: scope.gymId,
      ...(scope.branchId ? { branchId: scope.branchId } : {}),
    };
    const bucketWhere =
      bucket === "today"
        ? { nextFollowUpAt: { gte: dayRange.start, lt: dayRange.end } }
        : bucket === "overdue"
          ? { nextFollowUpAt: { lt: dayRange.start } }
          : bucket === "upcoming"
            ? { nextFollowUpAt: { gte: dayRange.end } }
            : {};
    const searchWhere = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            ...(search.replace(/\D/g, "")
              ? [{
                  mobileNumber: {
                    contains: search.replace(/\D/g, "").replace(/^91(?=\d{10}$)/, ""),
                  },
                }]
              : []),
          ],
        }
      : {};
    const where = {
      ...tenantWhere,
      ...bucketWhere,
      ...(bucket !== "all" ? { status: { in: openStatuses } } : {}),
      ...(status ? { AND: [{ status: status as EnquiryStatus }] } : {}),
      ...searchWhere,
    };

    const [records, total, allCount, todayCount, overdueCount, upcomingCount] = await Promise.all([
      prisma.enquiry.findMany({
        where,
        include: { branch: { select: { id: true, name: true } } },
        orderBy: [{ nextFollowUpAt: "asc" }, { createdAt: "desc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.enquiry.count({ where }),
      prisma.enquiry.count({ where: tenantWhere }),
      prisma.enquiry.count({
        where: {
          ...tenantWhere,
          status: { in: openStatuses },
          nextFollowUpAt: { gte: dayRange.start, lt: dayRange.end },
        },
      }),
      prisma.enquiry.count({
        where: {
          ...tenantWhere,
          status: { in: openStatuses },
          nextFollowUpAt: { lt: dayRange.start },
        },
      }),
      prisma.enquiry.count({
        where: {
          ...tenantWhere,
          status: { in: openStatuses },
          nextFollowUpAt: { gte: dayRange.end },
        },
      }),
    ]);

    return NextResponse.json({
      enquiries: records.map(toEnquiryResponse),
      counts: { today: todayCount, overdue: overdueCount, upcoming: upcomingCount },
      timezone: scope.timezone,
      totalCount: allCount,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error("Failed to fetch enquiries:", error);
    return NextResponse.json({ error: "Failed to fetch enquiries" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const access = await requireApiPermission("enquiries", "create");
    if (access.response) return access.response;

    const resolved = await resolveEnquiryScope(access.session.user);
    if (resolved.response) return resolved.response;
    const scope = resolved.scope;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Request body must be valid JSON" }, { status: 400 });
    }

    const parsed = createEnquirySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    if (!isDateTodayOrLater(parsed.data.nextFollowUpDate, scope.timezone)) {
      return NextResponse.json(
        { error: { nextFollowUpDate: ["Follow-up date cannot be in the past"] } },
        { status: 400 },
      );
    }

    let branchId = scope.branchId;
    if (branchId) {
      const assignedBranch = await prisma.branch.findFirst({
        where: {
          id: branchId,
          gymId: scope.gymId,
          isActive: true,
        },
        select: { id: true },
      });
      if (!assignedBranch) {
        return NextResponse.json(
          { error: "Your assigned branch is unavailable. Contact a gym administrator." },
          { status: 403 },
        );
      }
      branchId = assignedBranch.id;
    } else {
      const activeBranches = await prisma.branch.findMany({
        where: { gymId: scope.gymId, isActive: true },
        select: { id: true },
        orderBy: { id: "asc" },
        take: 2,
      });
      if (activeBranches.length === 0) {
        return NextResponse.json(
          { error: "No active branch is configured for this gym. Add and activate a branch before creating enquiries." },
          { status: 400 },
        );
      }
      if (activeBranches.length > 1) {
        return NextResponse.json(
          { error: "Your account has no assigned branch and this gym has multiple active branches. Ask an administrator to assign your account to a branch." },
          { status: 400 },
        );
      }
      branchId = activeBranches[0].id;
    }

    const enquiry = await prisma.enquiry.create({
      data: {
        gymId: scope.gymId,
        branchId,
        name: parsed.data.name,
        mobileNumber: parsed.data.mobileNumber,
        nextFollowUpAt: dateOnlyToUtc(parsed.data.nextFollowUpDate),
        notes: parsed.data.notes || null,
        status: EnquiryStatus.PENDING,
      },
      include: { branch: { select: { id: true, name: true } } },
    });

    return NextResponse.json(
      {
        enquiry: toEnquiryResponse(enquiry),
        today: dateStringInTimeZone(new Date(), scope.timezone),
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Failed to create enquiry:", error);
    return NextResponse.json({ error: "Failed to create enquiry" }, { status: 500 });
  }
}
