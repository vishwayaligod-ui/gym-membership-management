import { prisma } from "../lib/prisma";

async function main() {
  console.log("=== GYM OWNER INSPECTION (READ-ONLY) ===\n");

  // 1. Query all GYM_OWNER users
  const gymOwners = await prisma.user.findMany({
    where: { role: "GYM_OWNER" },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      isActive: true,
      gymId: true,
      branchId: true,
      password: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  console.log(`--- ALL GYM_OWNER USERS (${gymOwners.length}) ---`);
  for (const u of gymOwners) {
    console.log(`  email: ${u.email}`);
    console.log(`  fullName: ${u.fullName}`);
    console.log(`  role: ${u.role}`);
    console.log(`  isActive: ${u.isActive}`);
    console.log(`  gymId: ${u.gymId}`);
    console.log(`  branchId: ${u.branchId ?? "(null)"}`);
    console.log(`  createdAt: ${u.createdAt.toISOString()}`);
    console.log(`  updatedAt: ${u.updatedAt.toISOString()}`);
    console.log(`  passwordFieldExists: ${u.password !== null && u.password !== undefined}`);
    console.log(`  passwordIsBcryptHash: ${u.password?.startsWith("$2") === true}`);
    console.log(`  passwordHashLength: ${u.password?.length ?? 0} chars`);
    console.log(`  passwordHashPrefix: ${u.password?.slice(0, 4) ?? "(none)"}... (not printing full hash)`);
    console.log("---");
  }

  // 2. Find the active GYM_OWNER
  const activeOwner = gymOwners.find((u) => u.isActive === true);

  console.log("\n--- ACTIVE GYM_OWNER (PRIMARY) ---");
  if (!activeOwner) {
    console.log("  NOT FOUND: No active GYM_OWNER user exists.");
  } else {
    console.log(`  email: ${activeOwner.email}`);
    console.log(`  role: ${activeOwner.role}`);
    console.log(`  isActive: ${activeOwner.isActive}`);
    console.log(`  gymId: ${activeOwner.gymId}`);
    console.log(`  branchId: ${activeOwner.branchId ?? "(null)"}`);
    console.log(`  passwordFieldExists: ${activeOwner.password !== null && activeOwner.password !== undefined}`);
    console.log(`  passwordIsBcryptHash: ${activeOwner.password?.startsWith("$2") === true}`);
    console.log(`  passwordHashLength: ${activeOwner.password?.length ?? 0} chars`);
    console.log(`  passwordHashPrefix: ${activeOwner.password?.slice(0, 4) ?? "(none)"}... (not printing full hash)`);
  }

  // 3. Also list the gym name for context
  if (activeOwner) {
    const gym = await prisma.gym.findUnique({
      where: { id: activeOwner.gymId },
      select: { id: true, name: true, code: true, status: true },
    });
    if (gym) {
      console.log("\n--- ASSOCIATED GYM ---");
      console.log(`  id: ${gym.id}`);
      console.log(`  name: ${gym.name}`);
      console.log(`  code: ${gym.code}`);
      console.log(`  status: ${gym.status}`);
    }
  }

  console.log("\n=== DONE (READ-ONLY, NO CHANGES MADE) ===");
}

main()
  .catch((e) => {
    console.error("ERROR:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });