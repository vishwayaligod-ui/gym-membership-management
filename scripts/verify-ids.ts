import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("=".repeat(80));
  console.log("READ-ONLY: LIST ALL GYMS AND BRANCHES");
  console.log("=".repeat(80));

  const gyms = await prisma.gym.findMany({
    select: {
      id: true,
      name: true,
      code: true,
      email: true,
      status: true,
      createdAt: true,
      branches: {
        select: {
          id: true,
          name: true,
          code: true,
          isActive: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  console.log(`\nTotal gyms: ${gyms.length}`);
  for (const gym of gyms) {
    console.log(`\n--- Gym ---`);
    console.log(`   id:    ${gym.id}`);
    console.log(`   name:  ${gym.name}`);
    console.log(`   code:  ${gym.code}`);
    console.log(`   email: ${gym.email}`);
    console.log(`   status: ${gym.status}`);
    console.log(`   Branches: ${gym.branches.length}`);
    for (const branch of gym.branches) {
      console.log(`     - id: ${branch.id} | name: ${branch.name} | code: ${branch.code} | active: ${branch.isActive}`);
    }
  }

  console.log(`\n${"=".repeat(80)}`);
  console.log("NO DATA WAS MODIFIED");
  console.log("=".repeat(80));
}

main()
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });