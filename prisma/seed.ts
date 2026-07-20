import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.user.findUnique({
    where: { email: "admin@gym.com" },
  });

  if (existing) {
    console.log("Default admin already exists.");
    return;
  }

  const hashedPassword = await bcrypt.hash("Admin@123", 10);

  const gym = await prisma.gym.create({
    data: {
      name: "Elite Fitness Studio",
      code: "ELITE01",
      email: "admin@elitefitness.com",
      phone: "+911234567890",
      currency: "INR",
      timezone: "Asia/Kolkata",
      status: "ACTIVE",
    },
  });

  await prisma.user.create({
    data: {
      fullName: "Super Admin",
      email: "admin@gym.com",
      password: hashedPassword,
      role: "SUPER_ADMIN",
      gymId: gym.id,
      isActive: true,
    },
  });

  console.log("Seeded default super admin.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
