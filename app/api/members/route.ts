import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Gender, PaymentMode, PaymentStatus, MembershipStatus, MemberStatus } from "@prisma/client";
import { getMemberStatus } from "@/app/lib/member-status";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const plan = searchParams.get("plan") || "";
    const gender = searchParams.get("gender") || "";
    const sortBy = searchParams.get("sortBy") || "newest";

    // Build where clause
    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { phone: { contains: search } },
        { email: { contains: search, mode: "insensitive" } },
        { memberCode: { contains: search, mode: "insensitive" } },
      ];
    }

    if (status) {
      where.status = status as MemberStatus;
    }

    if (gender) {
      where.gender = gender as Gender;
    }

    // Build orderBy
    let orderBy: Record<string, "asc" | "desc"> = { joiningDate: "desc" };
    switch (sortBy) {
      case "oldest":
        orderBy = { joiningDate: "asc" };
        break;
      case "name-asc":
        orderBy = { firstName: "asc" };
        break;
      case "name-desc":
        orderBy = { firstName: "desc" };
        break;
      default:
        orderBy = { joiningDate: "desc" };
    }

    // Fetch members with their latest membership
    const members = await prisma.member.findMany({
      where: where as any,
      include: {
        memberships: {
          include: {
            plan: true,
          },
          orderBy: { startDate: "desc" },
          take: 1,
        },
        _count: {
          select: {
            attendances: true,
            payments: true,
          },
        },
      },
      orderBy: orderBy,
    });

    // If plan filter is set, filter after fetching
    let filteredMembers = members;
    if (plan) {
      filteredMembers = members.filter((m) =>
        m.memberships[0]?.plan?.name === plan
      );
    }

    // Map to the expected format
    const mappedMembers = filteredMembers.map((member) => {
      const latestMembership = member.memberships[0];
      const planName = latestMembership?.plan?.name || "N/A";
      const joinedOn = member.joiningDate;
      const expiresOn = latestMembership?.endDate || member.joiningDate;

      const displayStatus = getMemberStatus(
        latestMembership ? expiresOn : null,
        latestMembership?.status
      );

      // Calculate avatar initials
      const initials = `${member.firstName.charAt(0)}${member.lastName?.charAt(0) || ""}`;

      return {
        id: member.id,
        name: `${member.firstName} ${member.lastName || ""}`.trim(),
        username: `@${member.firstName.toLowerCase()}${member.lastName ? member.lastName.toLowerCase() : ""}`,
        plan: planName,
        phone: member.phone,
        email: member.email || "",
        gender: member.gender === "MALE" ? "Male" as const : member.gender === "FEMALE" ? "Female" as const : "Male" as const,
        joinedOn: joinedOn.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        expiresOn: expiresOn.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        status: displayStatus as "Active" | "Expiring" | "Expired" | "Pending",
        avatar: initials,
        streak: 0,
        lifetimeRevenue: 0,
        visits: member._count.attendances,
        mtd: 0,
      };
    });

    // Get KPI data
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const totalMembers = await prisma.member.count();
    const activeMemberships = await prisma.membership.count({
      where: {
        status: MembershipStatus.ACTIVE,
        endDate: { gte: now },
      },
    });
    const expiringSoon = await prisma.membership.count({
      where: {
        status: MembershipStatus.ACTIVE,
        endDate: {
          gte: now,
          lte: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
        },
      },
    });
    const newThisMonth = await prisma.member.count({
      where: {
        joiningDate: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    });

    return NextResponse.json({
      members: mappedMembers,
      kpis: {
        totalMembers,
        activeMembers: activeMemberships,
        expiringSoon,
        newThisMonth,
      },
    });
  } catch (error) {
    console.error("Failed to fetch members:", error);
    return NextResponse.json(
      { error: "Failed to fetch members" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
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
      membershipFee,
      paymentMethod,
      notes,
    } = body;

    // Validate required fields
    if (!fullName || !mobileNumber || !gender || !membershipPlanId || !joiningDate || !expiryDate || !membershipFee || !paymentMethod) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check for duplicate mobile number
    const existingMember = await prisma.member.findFirst({
      where: { phone: mobileNumber },
    });

    if (existingMember) {
      return NextResponse.json(
        { error: "A member with this mobile number already exists" },
        { status: 409 }
      );
    }

    // Get the membership plan for validation
    const plan = await prisma.membershipPlan.findUnique({
      where: { id: membershipPlanId },
    });

    if (!plan) {
      return NextResponse.json(
        { error: "Selected membership plan not found" },
        { status: 404 }
      );
    }

    // Get the first gym and branch (multi-tenant support)
    const gym = await prisma.gym.findFirst();
    if (!gym) {
      return NextResponse.json(
        { error: "No gym found. Please set up your gym first." },
        { status: 400 }
      );
    }

    const branch = await prisma.branch.findFirst({
      where: { gymId: gym.id, isActive: true },
    });
    if (!branch) {
      return NextResponse.json(
        { error: "No active branch found. Please set up a branch first." },
        { status: 400 }
      );
    }

    // Generate member code
    const memberCount = await prisma.member.count({
      where: { gymId: gym.id },
    });
    const memberCode = `M${String(memberCount + 1).padStart(5, "0")}`;

    // Split full name into first and last name
    const nameParts = fullName.trim().split(/\s+/);
    const firstName = nameParts[0];
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : null;

    // Parse dates
    const joinDate = new Date(joiningDate);
    const endDate = new Date(expiryDate);
    const dob = dateOfBirth ? new Date(dateOfBirth) : null;

    // Parse fee
    const fee = parseFloat(membershipFee);

    // Map gender
    const genderEnum: Gender = gender === "Male" ? "MALE" : gender === "Female" ? "FEMALE" : "OTHER";

    // Map payment method
    const paymentModeMap: Record<string, PaymentMode> = {
      Cash: "CASH",
      UPI: "UPI",
      Card: "CARD",
      "Bank Transfer": "BANK_TRANSFER",
    };
    const paymentMode = paymentModeMap[paymentMethod] || "CASH";

    // Create member, membership, and payment in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create member
      const member = await tx.member.create({
        data: {
          gymId: gym.id,
          branchId: branch.id,
          memberCode,
          firstName,
          lastName,
          gender: genderEnum,
          dateOfBirth: dob,
          phone: mobileNumber,
          email: emailAddress || null,
          address: address || null,
          emergencyName: null,
          emergencyPhone: emergencyContact || null,
          joiningDate: joinDate,
          status: MemberStatus.ACTIVE,
          notes: notes || null,
        },
      });

      // Create membership
      const membership = await tx.membership.create({
        data: {
          gymId: gym.id,
          branchId: branch.id,
          memberId: member.id,
          planId: membershipPlanId,
          startDate: joinDate,
          endDate,
          amount: plan.price,
          discount: 0,
          finalAmount: fee,
          status: MembershipStatus.ACTIVE,
          remarks: notes || null,
        },
      });

      // Create payment
      await tx.payment.create({
        data: {
          gymId: gym.id,
          branchId: branch.id,
          memberId: member.id,
          membershipId: membership.id,
          amount: fee,
          paymentMode,
          paymentStatus: PaymentStatus.PAID,
          paymentDate: new Date(),
          remarks: `Payment for ${plan.name} membership`,
        },
      });

      return member;
    });

    return NextResponse.json(
      {
        message: "Member created successfully",
        member: {
          id: result.id,
          memberCode: result.memberCode,
          firstName: result.firstName,
          lastName: result.lastName,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create member:", error);
    return NextResponse.json(
      { error: "Failed to create member. Please try again." },
      { status: 500 }
    );
  }
}