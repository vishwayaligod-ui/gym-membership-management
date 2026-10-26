import { NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/auth-helpers";
import { dateOnlyString, resolveEnquiryScope } from "@/lib/enquiries";
import { prisma } from "@/lib/prisma";
import { updateEnquirySchema } from "@/lib/validations/enquiry";

type RouteContext = { params: Promise<{ id: string }> };

function scopeWhere(gymId: string, branchId: string | null) {
  return { gymId, ...(branchId ? { branchId } : {}) };
}

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const access = await requireApiPermission("enquiries", "read");
    if (access.response) return access.response;
    const resolved = await resolveEnquiryScope(access.session.user);
    if (resolved.response) return resolved.response;
    const { id } = await params;

    const enquiry = await prisma.enquiry.findFirst({
      where: { id, ...scopeWhere(resolved.scope.gymId, resolved.scope.branchId) },
      include: {
        branch: { select: { id: true, name: true } },
        followUps: {
          orderBy: [{ contactedAt: "asc" }, { createdAt: "asc" }],
          include: { recordedBy: { select: { id: true, fullName: true } } },
        },
      },
    });
    if (!enquiry) {
      return NextResponse.json({ error: "Enquiry not found" }, { status: 404 });
    }

    return NextResponse.json({
      enquiry: {
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
        followUps: enquiry.followUps.map((entry) => ({
          id: entry.id,
          outcome: entry.outcome,
          notes: entry.notes,
          contactedAt: entry.contactedAt.toISOString(),
          nextFollowUpDate: dateOnlyString(entry.nextFollowUpAt),
          createdAt: entry.createdAt.toISOString(),
          recordedBy: entry.recordedBy
            ? { id: entry.recordedBy.id, name: entry.recordedBy.fullName }
            : null,
        })),
      },
    });
  } catch (error) {
    console.error("Failed to fetch enquiry:", error);
    return NextResponse.json({ error: "Failed to fetch enquiry" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const access = await requireApiPermission("enquiries", "update");
    if (access.response) return access.response;
    const resolved = await resolveEnquiryScope(access.session.user);
    if (resolved.response) return resolved.response;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Request body must be valid JSON" }, { status: 400 });
    }
    const parsed = updateEnquirySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const { id } = await params;
    const update = await prisma.enquiry.updateMany({
      where: { id, ...scopeWhere(resolved.scope.gymId, resolved.scope.branchId) },
      data: {
        ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
        ...(parsed.data.mobileNumber !== undefined ? { mobileNumber: parsed.data.mobileNumber } : {}),
        ...(parsed.data.notes !== undefined ? { notes: parsed.data.notes || null } : {}),
      },
    });
    if (update.count === 0) {
      return NextResponse.json({ error: "Enquiry not found" }, { status: 404 });
    }

    const enquiry = await prisma.enquiry.findFirst({
      where: { id, ...scopeWhere(resolved.scope.gymId, resolved.scope.branchId) },
      include: { branch: { select: { id: true, name: true } } },
    });
    if (!enquiry) {
      return NextResponse.json({ error: "Enquiry not found" }, { status: 404 });
    }

    return NextResponse.json({
      enquiry: {
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
      },
    });
  } catch (error) {
    console.error("Failed to update enquiry:", error);
    return NextResponse.json({ error: "Failed to update enquiry" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    const access = await requireApiPermission("enquiries", "delete");
    if (access.response) return access.response;
    const resolved = await resolveEnquiryScope(access.session.user);
    if (resolved.response) return resolved.response;
    const { id } = await params;

    const deleted = await prisma.enquiry.deleteMany({
      where: { id, ...scopeWhere(resolved.scope.gymId, resolved.scope.branchId) },
    });
    if (deleted.count === 0) {
      return NextResponse.json({ error: "Enquiry not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete enquiry:", error);
    return NextResponse.json({ error: "Failed to delete enquiry" }, { status: 500 });
  }
}
