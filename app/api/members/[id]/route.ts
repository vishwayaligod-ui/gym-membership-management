import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Gender, MemberStatus, MembershipStatus, PaymentMode, PaymentStatus, Prisma } from "@prisma/client";
import { requireApiPermission } from "@/lib/auth-helpers";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const access = await requireApiPermission("members", "read");
    if (access.response) {
      return access.response;
    }

    const { id } = await params;

    const member = await prisma.member.findUnique({
      where: { id },
      include: {
        memberships: {
          include: {
            plan: true,
          },
          orderBy: { startDate: "desc" },
          take: 1,
        },
        payments: {
          orderBy: { paymentDate: "desc" },
          take: 1,
        },
      },
    });

    if (!member) {
      return NextResponse.json(
        { error: "Member not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ member });
  } catch (error) {
    console.error("Failed to fetch member:", error);
    return NextResponse.json(
      { error: "Failed to fetch member" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const access = await requireApiPermission("members", "update");
    if (access.response) {
      return access.response;
    }

    const { id } = await params;
    const body = await request.json();

    const {
      fullName,
      mobileNumber,
      emailAddress,
      gender,
      dateOfBirth,
      address,
      emergencyContact,
      membershipPlanId,
      joiningDate,
      expiryDate,
      notes,
    } = body;

    // Validate required fields
    if (!fullName || !mobileNumber || !gender) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check member exists
    const existingMember = await prisma.member.findUnique({
      where: { id },
    });

    if (!existingMember) {
      return NextResponse.json(
        { error: "Member not found" },
        { status: 404 }
      );
    }

    // Check for duplicate mobile number (excluding current member)
    const duplicatePhone = await prisma.member.findFirst({
      where: {
        phone: mobileNumber,
        id: { not: id },
      },
    });

    if (duplicatePhone) {
      return NextResponse.json(
        { error: "A member with this mobile number already exists" },
        { status: 409 }
      );
    }

    // Split full name
    const nameParts = fullName.trim().split(/\s+/);
    const firstName = nameParts[0];
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : null;

    // Map gender
    const genderEnum: Gender = gender === "Male" ? "MALE" : gender === "Female" ? "FEMALE" : "OTHER";

    // Parse dates
    const dob = dateOfBirth ? new Date(dateOfBirth) : null;

    // Update member
    const member = await prisma.member.update({
      where: { id },
      data: {
        firstName,
        lastName,
        gender: genderEnum,
        dateOfBirth: dob,
        phone: mobileNumber,
        email: emailAddress || null,
        address: address || null,
        emergencyPhone: emergencyContact || null,
        notes: notes || null,
      },
    });

    // If plan or dates changed, update the membership so the plan change
    // persists. The members list reads the latest membership by startDate
    // regardless of status, so we update that record (reactivating it).
    // If the member has no membership yet, create one instead of silently
    // dropping the plan change.
    if (membershipPlanId && joiningDate && expiryDate) {
      const plan = await prisma.membershipPlan.findUnique({
        where: { id: membershipPlanId },
      });

      if (plan) {
        const latestMembership = await prisma.membership.findFirst({
          where: { memberId: id },
          orderBy: { startDate: "desc" },
        });

        if (latestMembership) {
          await prisma.membership.update({
            where: { id: latestMembership.id },
            data: {
              planId: membershipPlanId,
              startDate: new Date(joiningDate),
              endDate: new Date(expiryDate),
              amount: plan.price,
              finalAmount: plan.price,
              status: MembershipStatus.ACTIVE,
            },
          });
        } else {
          await prisma.membership.create({
            data: {
              gymId: member.gymId,
              branchId: member.branchId,
              memberId: id,
              planId: membershipPlanId,
              startDate: new Date(joiningDate),
              endDate: new Date(expiryDate),
              amount: plan.price,
              discount: 0,
              finalAmount: plan.price,
              status: MembershipStatus.ACTIVE,
              remarks: member.notes || null,
            },
          });
        }
      }
    }

    return NextResponse.json({
      message: "Member updated successfully",
      member: {
        id: member.id,
        firstName: member.firstName,
        lastName: member.lastName,
      },
    });
  } catch (error) {
    console.error("Failed to update member:", error);
    return NextResponse.json(
      { error: "Failed to update member" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const access = await requireApiPermission("members", "delete");
    if (access.response) {
      return access.response;
    }

    const { id } = await params;

    const existingMember = await prisma.member.findUnique({
      where: { id },
    });

    if (!existingMember) {
      return NextResponse.json(
        { error: "Member not found" },
        { status: 404 }
      );
    }

    await prisma.member.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Member deleted successfully",
    });
  } catch (error: unknown) {
    console.error("Failed to delete member:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      return NextResponse.json(
        {
          error: "This member cannot be deleted because related records (attendance, payments, memberships, etc.) still exist. Remove or reassign those records first, then try again.",
        },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Failed to delete member" },
      { status: 500 }
    );
  }
}
