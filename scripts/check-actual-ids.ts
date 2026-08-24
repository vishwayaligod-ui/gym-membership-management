import { prisma } from "../lib/prisma";

async function main() {
  console.log("=== CHECK ACTUAL IDs (READ-ONLY) ===\n");

  // 1. Read ALL gyms
  const gyms = await prisma.gym.findMany({
    select: { id: true, name: true, code: true },
    orderBy: { name: "asc" },
  });

  console.log(`--- ALL GYMS (${gyms.length}) ---`);
  for (const gym of gyms) {
    console.log(`  id: ${gym.id} | name: ${gym.name} | code: ${gym.code}`);
  }

  // 2. Read ALL branches
  const branches = await prisma.branch.findMany({
    select: { id: true, name: true, code: true, gymId: true },
    orderBy: { name: "asc" },
  });

  console.log(`\n--- ALL BRANCHES (${branches.length}) ---`);
  for (const branch of branches) {
    console.log(
      `  id: ${branch.id} | name: ${branch.name} | code: ${branch.code} | gymId: ${branch.gymId}`
    );
  }

  // 3. Find the gym where name = "Elite Fitness Studio"
  const eliteGym = gyms.find((g) => g.name === "Elite Fitness Studio");

  console.log("\n--- ELITE FITNESS STUDIO GYM ---");
  if (!eliteGym) {
    console.log("  NOT FOUND: No gym with name 'Elite Fitness Studio'.");
  } else {
    console.log(`  id: ${eliteGym.id}`);
    console.log(`  name: ${eliteGym.name}`);
    console.log(`  code: ${eliteGym.code}`);

    // 4. Find its branch(es)
    const eliteBranches = branches.filter((b) => b.gymId === eliteGym.id);

    console.log(`\n--- ELITE FITNESS STUDIO BRANCHES (${eliteBranches.length}) ---`);
    if (eliteBranches.length === 0) {
      console.log("  No branches found for this gym.");
    } else {
      for (const branch of eliteBranches) {
        console.log(`  id: ${branch.id} | name: ${branch.name} | code: ${branch.code} | gymId: ${branch.gymId}`);
      }
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