import { EnquiryFollowUpOutcome, EnquiryStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/auth-helpers";
import {
  dateOnlyString,
  dateOnlyToUtc,
  isDateTodayOrLater,
  mapEnquiryFollowUp,
  resolveEnquiryScope,
} from "@/lib/enquiries";
import { prisma } from "@/lib/prisma";
import { enquiryFollowUpSchema } from "@/lib/validations/enquiry";

type RouteContext = { params: Promise<{ id: string }> };

class RouteError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = "RouteError";
  }
}

function tenantWhere(gymId: string, branchId: string | null) {
  return { gymId, ...(branchId ? { branchId } : {}) };
}

async function getAuthorizedEnquiryId(id: string, gymId: string, branchId: string | null) {
  return prisma.enquiry.findFirst({
    where: { id, ...tenantWhere(gymId, branchId) },
    select: { id: true },
  });
}

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const access = await requireApiPermission("enquiries", "read");
    if (access.response) return access.response;
    const resolved = await resolveEnquiryScope(access.session.user);
    if (resolved.response) return resolved.response;
    const { id } = await params;

    const enquiry = await getAuthorizedEnquiryId(
      id,
      resolved.scope.gymId,
      resolved.scope.branchId,
    );
    if (!enquiry) {
      return NextResponse.json({ error: "Enquiry not found" }, { status: 404 });
    }

    const followUps = await prisma.enquiryFollowUp.findMany({
      where: {
        enquiryId: enquiry.id,
        enquiry: {
          gymId: resolved.scope.gymId,
          ...(resolved.scope.branchId ? { branchId: resolved.scope.branchId } : {}),
        },
      },
      include: { recordedBy: { select: { id: true, fullName: true } } },
      orderBy: [{ contactedAt: "asc" }, { createdAt: "asc" }],
    });

    return NextResponse.json({ followUps: followUps.map(mapEnquiryFollowUp) });
  } catch (error) {
    console.error("Failed to fetch enquiry follow-up history:", error);
    return NextResponse.json({ error: "Failed to fetch follow-up history" }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const access = await requireApiPermission("enquiries", "create");
    if (access.response) return access.response;
    const resolved = await resolveEnquiryScope(access.session.user);
    if (resolved.response) return resolved.response;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Request body must be valid JSON" }, { status: 400 });
    }
    const parsed = enquiryFollowUpSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const { outcome, notes, nextFollowUpDate } = parsed.data;
    if (nextFollowUpDate && !isDateTodayOrLater(nextFollowUpDate, resolved.scope.timezone)) {
      return NextResponse.json(
        { error: { nextFollowUpDate: ["Follow-up date cannot be in the past"] } },
        { status: 400 },
      );
    }

    const user = access.session.user;
    const dbUser = await prisma.user.findFirst({
      where: {
        id: user.id,
        gymId: resolved.scope.gymId,
        branchId: resolved.scope.branchId,
        isActive: true,
      },
      select: { id: true },
    });
    if (!dbUser) {
      return NextResponse.json({ error: "Your account assignment is no longer valid" }, { status: 403 });
    }

    const { id: enquiryId } = await params;
    const openStatuses = [EnquiryStatus.PENDING, EnquiryStatus.CONTACTED];
    const terminalOutcome =
      outcome === "CONVERTED" || outcome === "NOT_INTERESTED";
    const nextStatus =
      outcome === "CONVERTED"
        ? EnquiryStatus.CONVERTED
        : outcome === "NOT_INTERESTED"
          ? EnquiryStatus.NOT_INTERESTED
          : EnquiryStatus.CONTACTED;

    const result = await prisma.$transaction(async (tx) => {
      const enquiry = await tx.enquiry.findFirst({
        where: {
          id: enquiryId,
          ...tenantWhere(resolved.scope.gymId, resolved.scope.branchId),
          status: { in: openStatuses },
        },
        select: { id: true, nextFollowUpAt: true },
      });
      if (!enquiry) {
        throw new RouteError("Open enquiry not found", 404);
      }

      const update = await tx.enquiry.updateMany({
        where: {
          id: enquiryId,
          ...tenantWhere(resolved.scope.gymId, resolved.scope.branchId),
          status: { in: openStatuses },
        },
        data: {
          status: nextStatus,
          nextFollowUpAt: terminalOutcome
            ? null
            : nextFollowUpDate
              ? dateOnlyToUtc(nextFollowUpDate)
              : enquiry.nextFollowUpAt,
        },
      });
      if (update.count !== 1) {
        throw new RouteError("Enquiry was updated concurrently. Refresh and try again.", 409);
      }

      const followUp = await tx.enquiryFollowUp.create({
        data: {
          enquiryId,
          outcome: outcome as EnquiryFollowUpOutcome,
          notes: notes || null,
          contactedAt: new Date(),
          nextFollowUpAt: nextFollowUpDate ? dateOnlyToUtc(nextFollowUpDate) : null,
          recordedById: dbUser.id,
        },
        include: { recordedBy: { select: { id: true, fullName: true } } },
      });
      const updatedEnquiry = await tx.enquiry.findUnique({
        where: {
          id: enquiryId,
          ...tenantWhere(resolved.scope.gymId, resolved.scope.branchId),
        },
        select: { id: true, status: true, nextFollowUpAt: true, updatedAt: true },
      });

      if (!updatedEnquiry) {
        throw new RouteError("Enquiry not found", 404);
      }

      return { followUp, enquiry: updatedEnquiry };
    });

    return NextResponse.json(
      {
        followUp: mapEnquiryFollowUp(result.followUp),
        enquiry: {
          id: result.enquiry.id,
          status: result.enquiry.status,
          nextFollowUpDate: dateOnlyString(result.enquiry.nextFollowUpAt),
          updatedAt: result.enquiry.updatedAt.toISOString(),
        },
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof RouteError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Failed to record enquiry follow-up:", error);
    return NextResponse.json({ error: "Failed to record follow-up" }, { status: 500 });
  }
}
