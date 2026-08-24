import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const ELITE_GYM_ID: string = "cccdcb28-e4e7-4c32-a59d-376db54d07b0";
const ELITE_BRANCH_ID: string = "64d535d1-c24f-4a1f-9db5-2c7a0fcf534de";
const FOCUS_GYM_ID: string = "2f151fe2-8d0d-463b-9557-e5025330666";
const FOCUS_BRANCH_ID: string = "f1b5edb8-cfe2-43e8-8e38-f1503e715f95";

async function main() {
  console.log("=".repeat(80));
  console.log("READ-ONLY DEPENDENCY REPORT - Elite Fitness Studio");
  console.log("=".repeat(80));

  // 1. Verify Elite gym
  const eliteGym = await prisma.gym.findUnique({
    where: { id: ELITE_GYM_ID },
    select: { id: true, name: true, code: true, email: true },
  });
  if (!eliteGym) {
    console.log(`\nERROR: Elite gym NOT FOUND: ${ELITE_GYM_ID}`);
    return;
  }
  console.log(`\nElite Gym: ${eliteGym.name} (${eliteGym.code}) - ${eliteGym.email}`);

  // 2. Verify Elite branch
  const eliteBranch = await prisma.branch.findUnique({
    where: { id: ELITE_BRANCH_ID },
    select: { id: true, name: true, code: true, gymId: true },
  });
  if (!eliteBranch) {
    console.log(`\nERROR: Elite branch NOT FOUND: ${ELITE_BRANCH_ID}`);
    return;
  }
  console.log(`Elite Branch: ${eliteBranch.name} (${eliteBranch.code})`);
  if (eliteBranch.gymId !== ELITE_GYM_ID) {
    console.log(`\nWARNING: Elite branch does NOT belong to Elite gym!`);
    return;
  }

  // 3. Verify Focus gym
  const focusGym = await prisma.gym.findUnique({
    where: { id: FOCUS_GYM_ID },
    select: { id: true, name: true, code: true, email: true },
  });
  if (!focusGym) {
    console.log(`\nERROR: Focus Fitness gym NOT FOUND: ${FOCUS_GYM_ID}`);
  } else {
    console.log(`\nFocus Gym: ${focusGym.name} (${focusGym.code}) - ${focusGym.email}`);
  }

  // 4. Verify Focus branch
  const focusBranch = await prisma.branch.findUnique({
    where: { id: FOCUS_BRANCH_ID },
    select: { id: true, name: true, code: true, gymId: true },
  });
  if (!focusBranch) {
    console.log(`\nERROR: Focus Fitness branch NOT FOUND: ${FOCUS_BRANCH_ID}`);
  } else {
    console.log(`Focus Branch: ${focusBranch.name} (${focusBranch.code})`);
  }

  // 5. ID conflict check
  console.log(`\n${"=".repeat(80)}`);
  console.log("ID CONFLICT CHECK");
  console.log("=".repeat(80));
  console.log(`Elite gymId (${ELITE_GYM_ID}) vs Focus gymId (${FOCUS_GYM_ID}): ${ELITE_GYM_ID === FOCUS_GYM_ID ? "CONFLICT!" : "OK - different"}`);
  console.log(`Elite branchId (${ELITE_BRANCH_ID}) vs Focus branchId (${FOCUS_BRANCH_ID}): ${ELITE_BRANCH_ID === FOCUS_BRANCH_ID ? "CONFLICT!" : "OK - different"}`);

  // 6. Count records for Elite gym
  console.log(`\n${"=".repeat(80)}`);
  console.log("ELITE FITNESS STUDIO - RECORD COUNTS (gymId: " + ELITE_GYM_ID + ")");
  console.log("=".repeat(80));

  const counts: Record<string, number> = {};
  counts["Branch"] = await prisma.branch.count({ where: { gymId: ELITE_GYM_ID } });
  counts["User"] = await prisma.user.count({ where: { gymId: ELITE_GYM_ID } });
  counts["Member"] = await prisma.member.count({ where: { gymId: ELITE_GYM_ID } });
  counts["MembershipPlan"] = await prisma.membershipPlan.count({ where: { gymId: ELITE_GYM_ID } });
  counts["Membership"] = await prisma.membership.count({ where: { gymId: ELITE_GYM_ID } });
  counts["Payment"] = await prisma.payment.count({ where: { gymId: ELITE_GYM_ID } });
  counts["Attendance"] = await prisma.attendance.count({ where: { gymId: ELITE_GYM_ID } });
  counts["Expense"] = await prisma.expense.count({ where: { gymId: ELITE_GYM_ID } });
  counts["TrainerProfile"] = await prisma.trainerProfile.count({ where: { gymId: ELITE_GYM_ID } });
  counts["WorkoutPlan"] = await prisma.workoutPlan.count({ where: { gymId: ELITE_GYM_ID } });
  counts["DietPlan"] = await prisma.dietPlan.count({ where: { gymId: ELITE_GYM_ID } });
  counts["PTPackage"] = await prisma.pTPackage.count({ where: { gymId: ELITE_GYM_ID } });
  counts["PTSession"] = await prisma.pTSession.count({ where: { gymId: ELITE_GYM_ID } });
  counts["GymSettings"] = await prisma.gymSettings.count({ where: { gymId: ELITE_GYM_ID } });
  counts["GymSettingsBackup"] = await prisma.gymSettingsBackup.count({ where: { gymId: ELITE_GYM_ID } });

  // 7. Branch-scoped counts
  console.log(`\nBRANCH-SCOPED COUNTS (branchId: ${ELITE_BRANCH_ID})`);
  const branchCounts: Record<string, number> = {};
  branchCounts["User"] = await prisma.user.count({ where: { branchId: ELITE_BRANCH_ID } });
  branchCounts["Member"] = await prisma.member.count({ where: { branchId: ELITE_BRANCH_ID } });
  branchCounts["Membership"] = await prisma.membership.count({ where: { branchId: ELITE_BRANCH_ID } });
  branchCounts["Payment"] = await prisma.payment.count({ where: { branchId: ELITE_BRANCH_ID } });
  branchCounts["Attendance"] = await prisma.attendance.count({ where: { branchId: ELITE_BRANCH_ID } });
  branchCounts["Expense"] = await prisma.expense.count({ where: { branchId: ELITE_BRANCH_ID } });
  branchCounts["WorkoutPlan"] = await prisma.workoutPlan.count({ where: { branchId: ELITE_BRANCH_ID } });
  branchCounts["DietPlan"] = await prisma.dietPlan.count({ where: { branchId: ELITE_BRANCH_ID } });
  branchCounts["PTSession"] = await prisma.pTSession.count({ where: { branchId: ELITE_BRANCH_ID } });

  // 8. Print summary
  console.log(`\n${"=".repeat(80)}`);
  console.log("SUMMARY TABLE");
  console.log("=".repeat(80));
  console.log(`\n${"Table".padEnd(25)} ${"Count".padStart(8)}`);
  console.log("-".repeat(35));
  for (const [table, count] of Object.entries(counts)) {
    console.log(`${table.padEnd(25)} ${String(count).padStart(8)}`);
  }
  const total = Object.values(counts).reduce((s, n) => s + n, 0);
  console.log("-".repeat(35));
  console.log(`${"TOTAL".padEnd(25)} ${String(total).padStart(8)}`);

  console.log(`\n${"Branch-scoped".padEnd(25)} ${"Count".padStart(8)}`);
  console.log("-".repeat(35));
  for (const [table, count] of Object.entries(branchCounts)) {
    console.log(`${table.padEnd(25)} ${String(count).padStart(8)}`);
  }

  // 9. Focus Fitness safety check
  console.log(`\n${"=".repeat(80)}`);
  console.log("FOCUS FITNESS SAFETY CHECK");
  console.log("=".repeat(80));
  if (focusGym) {
    const focusCounts: Record<string, number> = {};
    focusCounts["Branch"] = await prisma.branch.count({ where: { gymId: FOCUS_GYM_ID } });
    focusCounts["User"] = await prisma.user.count({ where: { gymId: FOCUS_GYM_ID } });
    focusCounts["Member"] = await prisma.member.count({ where: { gymId: FOCUS_GYM_ID } });
    focusCounts["MembershipPlan"] = await prisma.membershipPlan.count({ where: { gymId: FOCUS_GYM_ID } });
    focusCounts["Membership"] = await prisma.membership.count({ where: { gymId: FOCUS_GYM_ID } });
    focusCounts["Payment"] = await prisma.payment.count({ where: { gymId: FOCUS_GYM_ID } });
    focusCounts["Attendance"] = await prisma.attendance.count({ where: { gymId: FOCUS_GYM_ID } });
    focusCounts["Expense"] = await prisma.expense.count({ where: { gymId: FOCUS_GYM_ID } });
    focusCounts["TrainerProfile"] = await prisma.trainerProfile.count({ where: { gymId: FOCUS_GYM_ID } });
    focusCounts["WorkoutPlan"] = await prisma.workoutPlan.count({ where: { gymId: FOCUS_GYM_ID } });
    focusCounts["DietPlan"] = await prisma.dietPlan.count({ where: { gymId: FOCUS_GYM_ID } });
    focusCounts["PTPackage"] = await prisma.pTPackage.count({ where: { gymId: FOCUS_GYM_ID } });
    focusCounts["PTSession"] = await prisma.pTSession.count({ where: { gymId: FOCUS_GYM_ID } });
    focusCounts["GymSettings"] = await prisma.gymSettings.count({ where: { gymId: FOCUS_GYM_ID } });
    focusCounts["GymSettingsBackup"] = await prisma.gymSettingsBackup.count({ where: { gymId: FOCUS_GYM_ID } });

    const focusTotal = Object.values(focusCounts).reduce((s, n) => s + n, 0);
    console.log(`\nFocus Fitness (${focusGym.name}) has ${focusTotal} total records.`);
    console.log("These records will NOT be touched.");
  }

  console.log(`\n${"=".repeat(80)}`);
  console.log("REPORT COMPLETE - NO DATA WAS MODIFIED");
  console.log("=".repeat(80));
}

main()
  .catch((error) => {
    console.error("Error generating report:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });