import bcrypt from "bcryptjs";
import { PrismaClient, Prisma, type Gender, type PaymentMode } from "@prisma/client";

const prisma = new PrismaClient();

const DEMO_GYM = {
  name: "Elite Fitness Studio",
  code: "ELITE01",
  email: "admin@elitefitness.com",
  phone: "+911234567890",
  currency: "INR",
  timezone: "Asia/Kolkata",
  status: "ACTIVE" as const,
};

const DEFAULT_PASSWORD = "Admin@123";

const SUPER_ADMIN = {
  fullName: "Super Admin",
  email: "admin@gym.com",
  role: "SUPER_ADMIN" as const,
};

const OWNER_USER = {
  fullName: "Aarav Mehta",
  email: "owner@elitefitness.com",
  phone: "+919912345678",
  role: "GYM_OWNER" as const,
};

const RECEPTIONIST_USER = {
  fullName: "Sneha Sharma",
  email: "reception@elitefitness.com",
  phone: "+919876543210",
  role: "RECEPTIONIST" as const,
};

const BRANCH = {
  name: "Main Branch",
  code: "MAIN",
  email: "mainbranch@elitefitness.com",
  phone: "+911145678900",
  city: "Bengaluru",
  state: "Karnataka",
  country: "India",
  pincode: "560001",
};

const PLAN_DEFINITIONS = [
  {
    name: "Monthly",
    durationInDays: 30,
    price: 1800,
    joiningFee: 500,
    freezeDays: 2,
    description: "30-day membership for regular training.",
  },
  {
    name: "Quarterly",
    durationInDays: 90,
    price: 4800,
    joiningFee: 500,
    freezeDays: 5,
    description: "90-day membership with better value.",
  },
  {
    name: "Half Yearly",
    durationInDays: 180,
    price: 9000,
    joiningFee: 500,
    freezeDays: 10,
    description: "180-day membership for consistent progress.",
  },
  {
    name: "Annual",
    durationInDays: 365,
    price: 16800,
    joiningFee: 500,
    freezeDays: 20,
    description: "365-day membership with maximum savings.",
  },
] as const;

const FIRST_NAMES_MALE = [
  "Aarav", "Vivaan", "Aditya", "Arjun", "Krishna", "Ishaan", "Rohan", "Karthik", "Rahul", "Varun",
  "Nikhil", "Siddharth", "Aniket", "Yash", "Harsh", "Pranav", "Akash", "Manish", "Deepak", "Vikas",
] as const;

const FIRST_NAMES_FEMALE = [
  "Aanya", "Diya", "Ananya", "Ira", "Myra", "Kiara", "Riya", "Priya", "Neha", "Kavya",
  "Meera", "Sanya", "Pooja", "Nisha", "Tanvi", "Ishita", "Anika", "Shruti", "Sakshi", "Radhika",
] as const;

const LAST_NAMES = [
  "Sharma", "Verma", "Patel", "Singh", "Gupta", "Nair", "Iyer", "Reddy", "Joshi", "Kapoor",
  "Malhotra", "Bose", "Mishra", "Kulkarni", "Choudhary", "Menon", "Pillai", "Saxena", "Khanna", "Desai",
] as const;

const CITIES = [
  { city: "Bengaluru", state: "Karnataka", pincodePrefix: "560" },
  { city: "Mumbai", state: "Maharashtra", pincodePrefix: "400" },
  { city: "Pune", state: "Maharashtra", pincodePrefix: "411" },
  { city: "Hyderabad", state: "Telangana", pincodePrefix: "500" },
  { city: "Chennai", state: "Tamil Nadu", pincodePrefix: "600" },
  { city: "Delhi", state: "Delhi", pincodePrefix: "110" },
  { city: "Ahmedabad", state: "Gujarat", pincodePrefix: "380" },
  { city: "Jaipur", state: "Rajasthan", pincodePrefix: "302" },
] as const;

function pick<T>(arr: readonly T[], idx: number): T {
  return arr[idx % arr.length];
}

function memberCodeFromIndex(index: number): string {
  return `MEM${String(index + 1).padStart(4, "0")}`;
}

function memberEmail(firstName: string, lastName: string, index: number): string {
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}${index + 1}@demoelitefit.in`;
}

function phoneFromIndex(index: number): string {
  // Generates a deterministic Indian mobile number in +91 format.
  return `+9198${String(10000000 + index).padStart(8, "0")}`;
}

function emergencyPhoneFromIndex(index: number): string {
  return `+9197${String(10000000 + index).padStart(8, "0")}`;
}

function pincodeFrom(cityPrefix: string, index: number): string {
  const suffix = String((index % 900) + 100).padStart(3, "0");
  return `${cityPrefix}${suffix}`;
}

function buildMemberSeed(index: number, gymId: string, branchId: string) {
  const genderCycle: Gender[] = ["MALE", "FEMALE", "OTHER"];
  const gender = genderCycle[index % genderCycle.length];

  const firstName =
    gender === "FEMALE"
      ? pick(FIRST_NAMES_FEMALE, index)
      : gender === "OTHER"
        ? pick([...FIRST_NAMES_MALE, ...FIRST_NAMES_FEMALE], index)
        : pick(FIRST_NAMES_MALE, index);

  const lastName = pick(LAST_NAMES, index * 3);
  const cityMeta = pick(CITIES, index * 7);
  const joiningDate = new Date();
  joiningDate.setDate(joiningDate.getDate() - (index % 240));

  const dateOfBirth = new Date();
  dateOfBirth.setFullYear(dateOfBirth.getFullYear() - (18 + (index % 25)));
  dateOfBirth.setMonth((index * 2) % 12);
  dateOfBirth.setDate(((index * 5) % 28) + 1);

  return {
    gymId,
    branchId,
    memberCode: memberCodeFromIndex(index),
    firstName,
    lastName,
    gender,
    dateOfBirth,
    phone: phoneFromIndex(index),
    email: memberEmail(firstName, lastName, index),
    address: `${(index % 180) + 10}, ${cityMeta.city} Fitness Street`,
    emergencyName: `${pick(FIRST_NAMES_MALE, index + 1)} ${pick(LAST_NAMES, index + 9)}`,
    emergencyPhone: emergencyPhoneFromIndex(index),
    joiningDate,
    status: "ACTIVE" as const,
    notes: "Seeded demo member",
    city: cityMeta.city,
    state: cityMeta.state,
    pincode: pincodeFrom(cityMeta.pincodePrefix, index),
  };
}

async function main() {
  const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  const result = await prisma.$transaction(async (tx) => {
    // Keep existing gym creation behavior while making it idempotent.
    const gym = await tx.gym.upsert({
      where: { code: DEMO_GYM.code },
      update: {
        name: DEMO_GYM.name,
        email: DEMO_GYM.email,
        phone: DEMO_GYM.phone,
        currency: DEMO_GYM.currency,
        timezone: DEMO_GYM.timezone,
        status: DEMO_GYM.status,
      },
      create: {
        name: DEMO_GYM.name,
        code: DEMO_GYM.code,
        email: DEMO_GYM.email,
        phone: DEMO_GYM.phone,
        currency: DEMO_GYM.currency,
        timezone: DEMO_GYM.timezone,
        status: DEMO_GYM.status,
      },
    });

    const branch = await tx.branch.upsert({
      where: {
        gymId_code: {
          gymId: gym.id,
          code: BRANCH.code,
        },
      },
      update: {
        name: BRANCH.name,
        email: BRANCH.email,
        phone: BRANCH.phone,
        city: BRANCH.city,
        state: BRANCH.state,
        country: BRANCH.country,
        pincode: BRANCH.pincode,
        isActive: true,
      },
      create: {
        gymId: gym.id,
        name: BRANCH.name,
        code: BRANCH.code,
        email: BRANCH.email,
        phone: BRANCH.phone,
        city: BRANCH.city,
        state: BRANCH.state,
        country: BRANCH.country,
        pincode: BRANCH.pincode,
        isActive: true,
      },
    });

    await tx.user.upsert({
      where: { email: SUPER_ADMIN.email },
      update: {
        fullName: SUPER_ADMIN.fullName,
        role: SUPER_ADMIN.role,
        gymId: gym.id,
        branchId: branch.id,
        isActive: true,
      },
      create: {
        fullName: SUPER_ADMIN.fullName,
        email: SUPER_ADMIN.email,
        password: hashedPassword,
        role: SUPER_ADMIN.role,
        gymId: gym.id,
        branchId: branch.id,
        isActive: true,
      },
    });

    await tx.user.upsert({
      where: { email: OWNER_USER.email },
      update: {
        fullName: OWNER_USER.fullName,
        phone: OWNER_USER.phone,
        role: OWNER_USER.role,
        gymId: gym.id,
        branchId: branch.id,
        isActive: true,
      },
      create: {
        fullName: OWNER_USER.fullName,
        email: OWNER_USER.email,
        phone: OWNER_USER.phone,
        password: hashedPassword,
        role: OWNER_USER.role,
        gymId: gym.id,
        branchId: branch.id,
        isActive: true,
      },
    });

    await tx.user.upsert({
      where: { email: RECEPTIONIST_USER.email },
      update: {
        fullName: RECEPTIONIST_USER.fullName,
        phone: RECEPTIONIST_USER.phone,
        role: RECEPTIONIST_USER.role,
        gymId: gym.id,
        branchId: branch.id,
        isActive: true,
      },
      create: {
        fullName: RECEPTIONIST_USER.fullName,
        email: RECEPTIONIST_USER.email,
        phone: RECEPTIONIST_USER.phone,
        password: hashedPassword,
        role: RECEPTIONIST_USER.role,
        gymId: gym.id,
        branchId: branch.id,
        isActive: true,
      },
    });

    for (const plan of PLAN_DEFINITIONS) {
      const existingPlan = await tx.membershipPlan.findFirst({
        where: {
          gymId: gym.id,
          name: plan.name,
        },
        select: { id: true },
      });

      if (existingPlan) {
        await tx.membershipPlan.update({
          where: { id: existingPlan.id },
          data: {
            durationInDays: plan.durationInDays,
            price: new Prisma.Decimal(plan.price),
            joiningFee: new Prisma.Decimal(plan.joiningFee),
            freezeDays: plan.freezeDays,
            description: plan.description,
            isActive: true,
          },
        });
      } else {
        await tx.membershipPlan.create({
          data: {
            gymId: gym.id,
            name: plan.name,
            durationInDays: plan.durationInDays,
            price: new Prisma.Decimal(plan.price),
            joiningFee: new Prisma.Decimal(plan.joiningFee),
            freezeDays: plan.freezeDays,
            description: plan.description,
            isActive: true,
          },
        });
      }
    }

    const memberSeeds = Array.from({ length: 100 }, (_, idx) => buildMemberSeed(idx, gym.id, branch.id));

    await tx.member.createMany({
      data: memberSeeds.map((member) => ({
        gymId: member.gymId,
        branchId: member.branchId,
        memberCode: member.memberCode,
        firstName: member.firstName,
        lastName: member.lastName,
        gender: member.gender,
        dateOfBirth: member.dateOfBirth,
        phone: member.phone,
        email: member.email,
        address: `${member.address}, ${member.city}, ${member.state} ${member.pincode}`,
        emergencyName: member.emergencyName,
        emergencyPhone: member.emergencyPhone,
        joiningDate: member.joiningDate,
        status: member.status,
        notes: member.notes,
      })),
      skipDuplicates: true,
    });

    const members = await tx.member.findMany({
      where: {
        gymId: gym.id,
      },
      select: {
        id: true,
        joiningDate: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    const plans = await tx.membershipPlan.findMany({
      where: {
        gymId: gym.id,
        name: {
          in: PLAN_DEFINITIONS.map((plan) => plan.name),
        },
      },
      select: {
        id: true,
        name: true,
        durationInDays: true,
        price: true,
        joiningFee: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    const membershipExisting = await tx.membership.findMany({
      where: {
        gymId: gym.id,
      },
      select: {
        memberId: true,
      },
      distinct: ["memberId"],
    });

    const membersWithMembership = new Set(membershipExisting.map((item) => item.memberId));

    const membershipsToCreate = members
      .map((member, idx) => ({ member, idx }))
      .filter(({ member }) => !membersWithMembership.has(member.id))
      .map(({ member, idx }) => {
        const plan = plans[idx % plans.length];
        const startDate = new Date(member.joiningDate);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + plan.durationInDays);

        const discount = new Prisma.Decimal((idx % 5) * 100);
        const amount = new Prisma.Decimal(plan.price);
        const finalAmount = amount.minus(discount);

        return {
          gymId: gym.id,
          branchId: branch.id,
          memberId: member.id,
          planId: plan.id,
          startDate,
          endDate,
          amount,
          discount,
          finalAmount,
          status: "ACTIVE" as const,
          remarks: `Auto-seeded ${plan.name} membership`,
        };
      });

    if (membershipsToCreate.length > 0) {
      await tx.membership.createMany({
        data: membershipsToCreate,
      });
    }

    const allMemberships = await tx.membership.findMany({
      where: {
        gymId: gym.id,
      },
      select: {
        id: true,
        memberId: true,
        finalAmount: true,
      },
    });

    const existingPayments = await tx.payment.findMany({
      where: {
        gymId: gym.id,
      },
      select: {
        id: true,
        membershipId: true,
        createdAt: true,
      },
      orderBy: [
        { membershipId: "asc" },
        { createdAt: "asc" },
      ],
    });

    const paymentIdsToDelete: string[] = [];
    const membershipsWithPayments = new Set<string>();

    for (const payment of existingPayments) {
      if (membershipsWithPayments.has(payment.membershipId)) {
        paymentIdsToDelete.push(payment.id);
      } else {
        membershipsWithPayments.add(payment.membershipId);
      }
    }

    if (paymentIdsToDelete.length > 0) {
      await tx.payment.deleteMany({
        where: {
          id: {
            in: paymentIdsToDelete,
          },
        },
      });
    }

    const paymentModes: PaymentMode[] = ["UPI", "CASH", "CARD", "BANK_TRANSFER"];
    const paymentsToCreate = allMemberships
      .map((membership, idx) => ({ membership, idx }))
      .filter(({ membership }) => !membershipsWithPayments.has(membership.id))
      .map(({ membership, idx }) => {
        const paymentDate = new Date();
        paymentDate.setDate(paymentDate.getDate() - (idx % 60));

        return {
          gymId: gym.id,
          branchId: branch.id,
          memberId: membership.memberId,
          membershipId: membership.id,
          amount: membership.finalAmount,
          paymentMode: paymentModes[idx % paymentModes.length],
          paymentStatus: "PAID" as const,
          transactionId: `TXN${String(idx + 1).padStart(6, "0")}`,
          paymentDate,
          remarks: "Auto-seeded payment",
        };
      });

    if (paymentsToCreate.length > 0) {
      await tx.payment.createMany({
        data: paymentsToCreate,
      });
    }

    const [membersCount, membershipsCount, paymentsCount] = await Promise.all([
      tx.member.count({ where: { gymId: gym.id } }),
      tx.membership.count({ where: { gymId: gym.id } }),
      tx.payment.count({ where: { gymId: gym.id } }),
    ]);

    return {
      gymId: gym.id,
      branchId: branch.id,
      membersCount,
      membershipsCount,
      paymentsCount,
    };
  });

  console.log(`Seed complete for gym ${result.gymId} and branch ${result.branchId}.`);
  console.log(`Members: ${result.membersCount}`);
  console.log(`Memberships: ${result.membershipsCount}`);
  console.log(`Payments: ${result.paymentsCount}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
