import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const HARDCODED_ELITE_GYM_ID = "cccdcb28-e4e7-4c32-a59d-376db54d07b0";

async function main() {
  console.log("=".repeat(80));
  console.log("READ-ONLY DIAGNOSTIC: WHY DOES DELETE SCRIPT NOT FIND ELITE GYM?");
  console.log("=".repeat(80));

  // 1. Which DB are we connecting to? (host only, no credentials)
  const url = process.env.DATABASE_URL ?? "(none)";
  const hostMatch = url.match(/@([^:/]+)/);
  const dbMatch = url.match(/\/([^?]+)\?/);
  console.log(`\n[1] DATABASE_URL host: ${hostMatch ? hostMatch[1] : "UNKNOWN"}`);
  console.log(`    DATABASE_URL db:   ${dbMatch ? dbMatch[1] : "UNKNOWN"}`);
  console.log(`    (credentials intentionally NOT printed)`);

  // 2. PrismaClient init: no url override -> uses DATABASE_URL from .env
  console.log(`\n[2] PrismaClient initialized with NO url override -> uses DATABASE_URL from .env`);
  console.log(`    (identical to both verify-ids.ts and delete-elite-data.ts)`);

  // 3. Exact findUnique on the hardcoded ID (same call delete script makes)
  console.log(`\n[3] findUnique({ where: { id: "${HARDCODED_ELITE_GYM_ID}" } })`);
  const elite = await prisma.gym.findUnique({
    where: { id: HARDCODED_ELITE_GYM_ID },
    select: { id: true, name: true, code: true, email: true },
  });
  console.log(elite ? `    FOUND: ${JSON.stringify(elite)}` : "    NOT FOUND");

  // 4. List ALL gyms (same as verify-ids.ts) to see the real IDs
  console.log(`\n[4] All gyms via findMany (same query as verify-ids.ts):`);
  const gyms = await prisma.gym.findMany({
    select: { id: true, name: true, code: true },
    orderBy: { createdAt: "asc" },
  });
  console.log(`    Total gyms: ${gyms.length}`);
  for (const g of gyms) {
    console.log(`    - id=${g.id} | name=${g.name} | code=${g.code}`);
  }

  // 5. Compare: does any gym's id match the hardcoded one?
  console.log(`\n[5] Comparison:`);
  const exactMatch = gyms.find((g) => g.id === HARDCODED_ELITE_GYM_ID);
  console.log(`    Hardcoded ID: ${HARDCODED_ELITE_GYM_ID} (len=${HARDCODED_ELITE_GYM_ID.length})`);
  console.log(`    Exact match in DB: ${exactMatch ? "YES" : "NO"}`);
  for (const g of gyms) {
    const same = g.id === HARDCODED_ELITE_GYM_ID;
    console.log(`    DB id ${g.id} (len=${g.id.length}) ${same ? "<-- EXACT MATCH" : ""}`);
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