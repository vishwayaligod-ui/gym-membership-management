import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Gender, PaymentMode, PaymentStatus, MembershipStatus, MemberStatus } from "@prisma/client";
import { requireApiPermission } from "@/lib/auth-helpers";

interface ImportRow {
  fullName?: string;
  "Name of Member"?: string;
  mobileNumber?: string;
  "Contact"?: string;
  emailAddress?: string;
  gender?: string;
  dateOfBirth?: string;
  address?: string;
  emergencyContact?: string;
  membershipPlan?: string;
  planPrice?: string | number;
  planDuration?: string;
  joiningDate?: string;
  expiryDate?: string;
  membershipFee?: string | number;
  paymentRemaining?: string;
  paymentMethod?: string;
  notes?: string;
}

/** Normalize a phone number: strip spaces, dashes, and leading +91. */
function normalizePhone(raw: string): string {
  let phone = raw.replace(/[\s-]/g, "");
  if (phone.startsWith("+91")) {
    phone = phone.slice(3);
  }
  return phone;
}

/** Parse dates in DD-MM-YYYY or DD/MM/YYYY format (real gym files use DD-MM-YYYY). */
function parseDate(raw: string): Date | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  // Try standard ISO / JS parseable formats first.
  const standard = new Date(trimmed);
  if (!isNaN(standard.getTime())) return standard;

  // Try DD-MM-YYYY / DD/MM/YYYY.
  const match = trimmed.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (match) {
    const day = Number(match[1]);
    const month = Number(match[2]);
    const year = Number(match[3]);
    const date = new Date(year, month - 1, day);
    if (
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
    ) {
      return date;
    }
  }

  return null;
}

/** Convert a duration string like "1m", "3m", "6m", "1yr" to days. */
function durationToDays(raw: string): number | null {
  const trimmed = raw.trim().toLowerCase();
  if (!trimmed) return null;

  const match = trimmed.match(/^(\d+)\s*(m|mo|month|months|y|yr|year|years|d|day|days)?$/);
  if (!match) return null;

  const value = Number(match[1]);
  const unit = match[2] || "m";

  switch (unit) {
    case "d":
    case "day":
    case "days":
      return value;
    case "m":
    case "mo":
    case "month":
    case "months":
      return value * 30;
    case "y":
    case "yr":
    case "year":
    case "years":
      return value * 365;
    default:
      return null;
  }
}

export async function POST(request: Request) {
  try {
    const access = await requireApiPermission("members", "create");
    if (access.response) {
      return access.response;
    }

    const session = access.session;
    const gymId = session?.user?.gymId;
    const branchId = session?.user?.branchId;

    if (!gymId) {
      return NextResponse.json(
        { error: "No gym assigned to your account. Please contact an administrator." },
        { status: 400 }
      );
    }

    if (!branchId) {
      return NextResponse.json(
        { error: "No branch assigned to your account. Please contact an administrator." },
        { status: 400 }
      );
    }

    const body = await request.json();
    const rows: ImportRow[] = Array.isArray(body.rows) ? body.rows : [];

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "No rows provided to import." },
        { status: 400 }
      );
    }

    // Load existing plans for this gym (by name) — never create new plans.
    const plans = await prisma.membershipPlan.findMany({
      where: { gymId },
    });
    const planByName = new Map<string, string>();
    const planByDuration = new Map<number, string>();
    const planByPrice = new Map<number, string>();
    for (const plan of plans) {
      const key = plan.name.trim().toLowerCase();
      if (!planByName.has(key)) {
        planByName.set(key, plan.id);
      }
      const durationKey = plan.durationInDays;
      if (!planByDuration.has(durationKey)) {
        planByDuration.set(durationKey, plan.id);
      }
      const priceKey = Number(plan.price);
      if (!planByPrice.has(priceKey)) {
        planByPrice.set(priceKey, plan.id);
      }
    }

    // Load existing phone numbers to avoid duplicates.
    const existingPhones = new Set<string>();
    const existingMembers = await prisma.member.findMany({
      where: { gymId },
      select: { phone: true },
    });
    for (const m of existingMembers) {
      existingPhones.add(normalizePhone(m.phone).toLowerCase());
    }

    // Current member count for code generation.
    const memberCount = await prisma.member.count({ where: { gymId } });

    const paymentModeMap: Record<string, PaymentMode> = {
      Cash: "CASH",
      UPI: "UPI",
      Card: "CARD",
      "Bank Transfer": "BANK_TRANSFER",
    };

    const imported: Array<{ row: number; name: string; memberCode: string }> = [];
    const skipped: Array<{ row: number; reason: string }> = [];
    let codeCounter = memberCount;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 2; // +1 for header, +1 for 1-based

      // Validate required fields
      const fullName = (row.fullName || row["Name of Member"])?.trim();
      const mobileNumber = normalizePhone((row.mobileNumber || row["Contact"])?.trim() || "");
      const gender = row.gender?.trim() || "Other";
      const membershipPlanName = row.membershipPlan?.trim();
      const planDuration = durationToDays(row.planDuration || "");
      const planPrice = row.planPrice !== "" && row.planPrice != null ? Number(row.planPrice) : NaN;
      const joiningDate = row.joiningDate?.trim();
      const expiryDate = row.expiryDate?.trim();
      const membershipFee = row.membershipFee;
      const paymentMethod = row.paymentMethod?.trim() || "Cash";

      if (!fullName) {
        skipped.push({ row: rowNumber, reason: "Full Name is required" });
        continue;
      }
      if (!mobileNumber) {
        skipped.push({ row: rowNumber, reason: "Mobile Number is required" });
        continue;
      }
      if (!["Male", "Female", "Other"].includes(gender)) {
        skipped.push({ row: rowNumber, reason: "Gender must be Male, Female, or Other" });
        continue;
      }
      if (!membershipPlanName && !planDuration && isNaN(planPrice)) {
        skipped.push({ row: rowNumber, reason: "Membership Plan is required" });
        continue;
      }
      const joinDate = parseDate(joiningDate || "");
      if (!joinDate) {
        skipped.push({ row: rowNumber, reason: "Joining Date is required and must be a valid date" });
        continue;
      }
      const endDate = parseDate(expiryDate || "");
      if (!endDate) {
        skipped.push({ row: rowNumber, reason: "Expiry Date is required and must be a valid date" });
        continue;
      }
      const fee = Number(membershipFee);
      if (isNaN(fee) || fee < 0) {
        skipped.push({ row: rowNumber, reason: "Membership Fee must be a valid number >= 0" });
        continue;
      }
      if (!paymentModeMap[paymentMethod]) {
        skipped.push({ row: rowNumber, reason: "Payment Method must be Cash, UPI, Card, or Bank Transfer" });
        continue;
      }

      // Duplicate phone check
      const phoneKey = mobileNumber.toLowerCase();
      if (existingPhones.has(phoneKey)) {
        skipped.push({ row: rowNumber, reason: `A member with mobile number ${mobileNumber} already exists` });
        continue;
      }

      // Plan lookup: by name → by duration → by price (never create new plans).
      let planId: string | undefined;
      if (membershipPlanName) {
        planId = planByName.get(membershipPlanName.toLowerCase());
      }
      if (!planId && planDuration) {
        planId = planByDuration.get(planDuration);
      }
      if (!planId && !isNaN(planPrice)) {
        planId = planByPrice.get(planPrice);
      }
      if (!planId) {
        const reason = membershipPlanName
          ? `Membership plan "${membershipPlanName}" not found for this gym`
          : planDuration
            ? `No membership plan with ${planDuration}-day duration found for this gym`
            : `No membership plan with price ${planPrice} found for this gym`;
        skipped.push({ row: rowNumber, reason });
        continue;
      }

      const plan = plans.find((p) => p.id === planId)!;

      // Generate member code
      codeCounter += 1;
      const memberCode = `M${String(codeCounter).padStart(5, "0")}`;

      // Split name
      const nameParts = fullName.split(/\s+/);
      const firstName = nameParts[0];
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : null;

      const dob = row.dateOfBirth ? parseDate(row.dateOfBirth) : null;
      const genderEnum: Gender = gender === "Male" ? "MALE" : gender === "Female" ? "FEMALE" : "OTHER";
      const paymentMode = paymentModeMap[paymentMethod];

      // Append payment remaining info to notes when present.
      const paymentRemaining = row.paymentRemaining?.trim();
      const notesParts = [row.notes?.trim(), paymentRemaining && paymentRemaining !== "Done"
        ? `Payment remaining: ${paymentRemaining}`
        : null].filter(Boolean);
      const notes = notesParts.length > 0 ? notesParts.join(" | ") : null;

      try {
        await prisma.$transaction(async (tx) => {
          const member = await tx.member.create({
            data: {
              gymId,
              branchId,
              memberCode,
              firstName,
              lastName,
              gender: genderEnum,
              dateOfBirth: dob,
              phone: mobileNumber,
              email: row.emailAddress?.trim() || null,
              address: row.address?.trim() || null,
              emergencyName: null,
              emergencyPhone: row.emergencyContact?.trim() || null,
              joiningDate: joinDate,
              status: MemberStatus.ACTIVE,
              notes,
            },
          });

          const membership = await tx.membership.create({
            data: {
              gymId,
              branchId,
              memberId: member.id,
              planId,
              startDate: joinDate,
              endDate,
              amount: plan.price,
              discount: 0,
              finalAmount: fee,
              status: MembershipStatus.ACTIVE,
              remarks: notes,
            },
          });

          await tx.payment.create({
            data: {
              gymId,
              branchId,
              memberId: member.id,
              membershipId: membership.id,
              amount: fee,
              paymentMode,
              paymentStatus: PaymentStatus.PAID,
              paymentDate: new Date(),
              remarks: `Payment for ${plan.name} membership`,
            },
          });
        });

        existingPhones.add(phoneKey);
        imported.push({ row: rowNumber, name: fullName, memberCode });
      } catch (error) {
        console.error(`Failed to import row ${rowNumber}:`, error);
        skipped.push({ row: rowNumber, reason: "Failed to create member" });
      }
    }

    return NextResponse.json({
      message: `Imported ${imported.length} member(s), skipped ${skipped.length} row(s).`,
      imported,
      skipped,
    });
  } catch (error) {
    console.error("Failed to import members:", error);
    return NextResponse.json(
      { error: "Failed to import members. Please try again." },
      { status: 500 }
    );
  }
}