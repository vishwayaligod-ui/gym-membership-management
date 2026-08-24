import { prisma } from "../lib/prisma";
import bcrypt from "bcryptjs";

const TARGET_EMAIL = "vk@gmail.com";
const NEW_PASSWORD = "Gym@2026Reset";

async function main() {
  // Find the user first
  const user = await prisma.user.findUnique({
    where: { email: TARGET_EMAIL },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      gymId: true,
      branchId: true,
      isActive: true,
    },
  });

  if (!user) {
    console.error(`User with email "${TARGET_EMAIL}" not found.`);
    process.exit(1);
  }

  console.log("User found:");
  console.log(`  ID: ${user.id}`);
  console.log(`  Email: ${user.email}`);
  console.log(`  Name: ${user.fullName}`);
  console.log(`  Role: ${user.role}`);
  console.log(`  GymId: ${user.gymId}`);
  console.log(`  BranchId: ${user.branchId}`);
  console.log(`  IsActive: ${user.isActive}`);

  // Hash the new password using bcrypt with cost factor 10 (same as application code)
  const passwordHash = await bcrypt.hash(NEW_PASSWORD, 10);

  // Update ONLY the password field
  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: { password: passwordHash },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      gymId: true,
      branchId: true,
      isActive: true,
      updatedAt: true,
    },
  });

  console.log("\nPassword updated successfully for user:");
  console.log(`  ID: ${updatedUser.id}`);
  console.log(`  Email: ${updatedUser.email}`);
  console.log(`  Name: ${updatedUser.fullName}`);
  console.log(`  Role: ${updatedUser.role}`);
  console.log(`  GymId: ${updatedUser.gymId}`);
  console.log(`  BranchId: ${updatedUser.branchId}`);
  console.log(`  IsActive: ${updatedUser.isActive}`);
  console.log(`  UpdatedAt: ${updatedUser.updatedAt}`);

  // Verify the new password hash matches using bcrypt.compare (same as auth.ts)
  const storedUser = await prisma.user.findUnique({
    where: { email: TARGET_EMAIL },
    select: { password: true },
  });

  if (!storedUser) {
    console.error("Verification failed: User not found after update.");
    process.exit(1);
  }

  const isPasswordValid = await bcrypt.compare(NEW_PASSWORD, storedUser.password);
  if (!isPasswordValid) {
    console.error("Verification failed: Password hash does not match the new password.");
    process.exit(1);
  }

  console.log("Verification successful: New password hash is valid and matches the application's bcrypt hashing method.");
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });