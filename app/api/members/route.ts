import { NextResponse } from "next/server";
import { after } from "next/server";
import { prisma } from "../../../lib/prisma";
import { Gender, PaymentMode, PaymentStatus, MembershipStatus, MemberStatus } from "@prisma/client";
import { getMemberStatus } from "../../lib/member-status";
import { requireApiPermission } from "../../../lib/auth-helpers";
import { sendRenewalReceiptWhatsApp } from "@/lib/whatsapp/receipts";

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
        payments: {
          select: {
            amount: true,
          },
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

      // Payment calculations (mirrors Member Details page logic)
      const totalPaid = member.payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
      const discount = Number(latestMembership?.discount || 0);
      const finalAmount = Number(latestMembership?.finalAmount || 0);
      const balanceDue = Math.max(0, finalAmount - totalPaid);

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
        discount,
        amountPaid: totalPaid,
        balanceDue,
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
    const access = await requireApiPermission("members", "create");
    if (access.response) {
      return access.response;
    }

    // Tenant scope is derived ONLY from the authenticated session.
    // Never from the request body and never from a database lookup
    // (e.g. prisma.gym.findFirst()), which is non-deterministic in a
    // multi-gym database and could attach the member to the wrong gym.
    const session = access.session;
    const gymId = session?.user?.gymId;

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

    // Tenant must be known before any write. Require the session gymId and
    // never fall back to gym table lookups to resolve the current tenant.
    if (!gymId) {
      return NextResponse.json(
        { error: "No gym assigned to your account. Please contact an administrator." },
        { status: 400 }
      );
    }

    const branch = await prisma.branch.findFirst({
      where: { gymId, isActive: true },
    });
    if (!branch) {
      return NextResponse.json(
        { error: "No active branch found. Please set up a branch first." },
        { status: 400 }
      );
    }

    // Generate member code
    const lastMember = await prisma.member.findFirst({
  where: { gymId },
  orderBy: { memberCode: "desc" },
  select: { memberCode: true },
});

const lastNumber = lastMember
  ? parseInt(lastMember.memberCode.replace("M", ""), 10)
  : 0;

const memberCode = `M${String(lastNumber + 1).padStart(5, "0")}`;

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
          gymId,
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
          gymId,
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
      const payment = await tx.payment.create({
        data: {
          gymId,
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

      return { member, payment };
    });

    // Fire-and-forget: for the PAID membership payment created above, deliver
    // the PDF receipt over WhatsApp after the response. A WhatsApp/PDF failure
    // can never fail the member creation above.
    if (result.payment.paymentStatus === PaymentStatus.PAID) {
      after(async () => {
        try {
          await sendRenewalReceiptWhatsApp({ paymentId: result.payment.id });
        } catch (error) {
          console.error("[WhatsApp] Receipt delivery failed (member POST):", error);
        }
      });
    }

    return NextResponse.json(
      {
        message: "Member created successfully",
        member: {
          id: result.member.id,
          memberCode: result.member.memberCode,
          firstName: result.member.firstName,
          lastName: result.member.lastName,
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