import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ---- Unique business identifiers (NOT hardcoded DB IDs) ----
// The Elite gym is located by these exact business identifiers only.
const ELITE_GYM_NAME: string = "Elite Fitness Studio";
const ELITE_GYM_CODE: string = "ELITE01";
// Focus Fitness is protected: it is located by name (never hardcoded).
const FOCUS_GYM_NAME: string = "Focus Fitness";

// Dry-run mode: only pre-flight checks + record counts, NO deletion.
// run with: npx tsx scripts/delete-elite-data.ts --dry-run
const DRY_RUN: boolean = process.argv.includes("--dry-run") || process.argv.includes("--preflight");

// All models that carry a gymId (or are the Gym itself). Order here is only for reporting; deletion order is defined separately.
const GYM_SCOPED_TABLES = [
  "Gym",
  "Branch",
  "User",
  "TrainerProfile",
  "Member",
  "MembershipPlan",
  "Membership",
  "Payment",
  "Attendance",
  "Expense",
  "WorkoutPlan",
  "DietPlan",
  "PTPackage",
  "PTSession",
  "GymSettings",
  "GymSettingsBackup",
] as const;

// Models that also carry a branchId (plus Branch itself which is deleted by id).
const BRANCH_SCOPED_TABLES = [
  "User",
  "Member",
  "Membership",
  "Payment",
  "Attendance",
  "Expense",
  "WorkoutPlan",
  "DietPlan",
  "PTSession",
] as const;

type GymRef = { id: string; name: string; code: string; email: string };
type BranchRef = { id: string; name: string; code: string; gymId: string };

function section(title: string): void {
  console.log(`\n${"=".repeat(80)}`);
  console.log(title);
  console.log("=".repeat(80));
}

function line(label: string, value: string | number): void {
  console.log(`${label.padEnd(48)} ${String(value).padStart(8)}`);
}

/**
 * Locate a gym by its exact unique business identifiers.
 * ABORTS if zero or more than one gym matches.
 */
async function findGymByUnique(name: string, code: string): Promise<GymRef> {
  const matches = await prisma.gym.findMany({
    where: { name, code },
    select: { id: true, name: true, code: true, email: true },
  });
  if (matches.length === 0) {
    throw new Error(`ABORT: Gym NOT FOUND (name="${name}", code="${code}")`);
  }
  if (matches.length > 1) {
    throw new Error(`ABORT: Multiple gyms found (${matches.length}) matching name="${name}", code="${code}"`);
  }
  return matches[0];
}

async function findBranchesByGym(gymId: string): Promise<BranchRef[]> {
  return prisma.branch.findMany({
    where: { gymId },
    select: { id: true, name: true, code: true, gymId: true },
  });
}

async function countByGym(client: PrismaClient, table: string, gymId: string): Promise<number> {
  switch (table) {
    case "Gym":
      return client.gym.count({ where: { id: gymId } });
    case "Branch":
      return client.branch.count({ where: { gymId } });
    case "User":
      return client.user.count({ where: { gymId } });
    case "TrainerProfile":
      return client.trainerProfile.count({ where: { gymId } });
    case "Member":
      return client.member.count({ where: { gymId } });
    case "MembershipPlan":
      return client.membershipPlan.count({ where: { gymId } });
    case "Membership":
      return client.membership.count({ where: { gymId } });
    case "Payment":
      return client.payment.count({ where: { gymId } });
    case "Attendance":
      return client.attendance.count({ where: { gymId } });
    case "Expense":
      return client.expense.count({ where: { gymId } });
    case "WorkoutPlan":
      return client.workoutPlan.count({ where: { gymId } });
    case "DietPlan":
      return client.dietPlan.count({ where: { gymId } });
    case "PTPackage":
      return client.pTPackage.count({ where: { gymId } });
    case "PTSession":
      return client.pTSession.count({ where: { gymId } });
    case "GymSettings":
      return client.gymSettings.count({ where: { gymId } });
    case "GymSettingsBackup":
      return client.gymSettingsBackup.count({ where: { gymId } });
    default:
      throw new Error(`Unknown gym-scoped table: ${table}`);
  }
}

async function countByBranch(client: PrismaClient, table: string, branchId: string): Promise<number> {
  switch (table) {
    case "User":
      return client.user.count({ where: { branchId } });
    case "Member":
      return client.member.count({ where: { branchId } });
    case "Membership":
      return client.membership.count({ where: { branchId } });
    case "Payment":
      return client.payment.count({ where: { branchId } });
    case "Attendance":
      return client.attendance.count({ where: { branchId } });
    case "Expense":
      return client.expense.count({ where: { branchId } });
    case "WorkoutPlan":
      return client.workoutPlan.count({ where: { branchId } });
    case "DietPlan":
      return client.dietPlan.count({ where: { branchId } });
    case "PTSession":
      return client.pTSession.count({ where: { branchId } });
    default:
      throw new Error(`Unknown branch-scoped table: ${table}`);
  }
}

async function snapshotFocus(client: PrismaClient, focusGymId: string): Promise<Record<string, number>> {
  const snapshot: Record<string, number> = {};
  for (const table of GYM_SCOPED_TABLES) {
    if (table === "Gym") continue; // Focus gym existence is verified separately
    snapshot[table] = await countByGym(client, table, focusGymId);
  }
  return snapshot;
}

async function main(): Promise<void> {
  console.log("=".repeat(80));
  console.log(
    DRY_RUN
      ? "DELETE ELITE FITNESS STUDIO — PRE-FLIGHT / DRY-RUN (READ-ONLY)"
      : "DELETE ELITE FITNESS STUDIO DUMMY DATA (FK-SAFE ORDER)"
  );
  console.log("=".repeat(80));

  // =====================================================================
  // STEP 1 — PRE-FLIGHT CHECKS (abort on any unexpected state)
  // =====================================================================
  section("PRE-FLIGHT CHECKS");

  // 1a. Locate the Elite gym DIRECTLY FROM THE DATABASE by name + code.
  const eliteGym = await findGymByUnique(ELITE_GYM_NAME, ELITE_GYM_CODE);
  const eliteGymId: string = eliteGym.id; // actual DB ID returned by the lookup
  console.log(`Elite Gym found:    ${eliteGym.name} (${eliteGym.code}) - ${eliteGym.email}`);
  console.log(`Elite Gym ID (from DB): ${eliteGymId}`);

  // 1b. Locate ALL Elite branches using the actual gymId.
  const eliteBranches = await findBranchesByGym(eliteGymId);
  if (eliteBranches.length === 0) {
    throw new Error(`ABORT: No branches found for Elite gym ${eliteGymId}`);
  }
  const eliteBranchIds: string[] = eliteBranches.map((b) => b.id);
  console.log(`Elite Branch(es) found (${eliteBranches.length}):`);
  for (const b of eliteBranches) {
    console.log(`  - ${b.name} (${b.code}) [${b.id}]`);
  }

  // 1c. Locate Focus Fitness (by name) and protect it. Never hardcoded.
  const focusMatches = await prisma.gym.findMany({
    where: { name: FOCUS_GYM_NAME },
    select: { id: true, name: true, code: true, email: true },
  });
  if (focusMatches.length === 0) {
    throw new Error(`ABORT: Focus Fitness gym NOT FOUND (name="${FOCUS_GYM_NAME}")`);
  }
  if (focusMatches.length > 1) {
    throw new Error(`ABORT: Multiple Focus Fitness gyms found (${focusMatches.length})`);
  }
  const focusGym = focusMatches[0];
  const focusGymId: string = focusGym.id;
  console.log(`Focus Gym found:    ${focusGym.name} (${focusGym.code}) - ${focusGym.email} [${focusGymId}]`);

  const focusBranches = await findBranchesByGym(focusGymId);
  if (focusBranches.length === 0) {
    throw new Error("ABORT: No branches found for Focus Fitness gym");
  }
  const focusBranchIds: string[] = focusBranches.map((b) => b.id);

  // 1d. Safety: Elite and Focus must be distinct gyms.
  if (eliteGymId === focusGymId) {
    throw new Error("ABORT: Elite and Focus resolve to the same gym");
  }

  const totalGymsBefore = await prisma.gym.count();
  const totalBranchesBefore = await prisma.branch.count();
  console.log(`\nGlobal state before deletion: ${totalGymsBefore} gym(s), ${totalBranchesBefore} branch(es)`);

  // =====================================================================
  // STEP 2 — RECORD COUNTS (Elite to be deleted)
  // =====================================================================
  section("ELITE FITNESS STUDIO — RECORDS TO BE DELETED (by gymId)");

  const eliteBefore: Record<string, number> = {};
  for (const table of GYM_SCOPED_TABLES) {
    eliteBefore[table] = await countByGym(prisma, table, eliteGymId);
  }

  console.log(`\n${"Table".padEnd(25)} ${"Count".padStart(8)}`);
  console.log("-".repeat(35));
  for (const table of GYM_SCOPED_TABLES) {
    console.log(`${table.padEnd(25)} ${String(eliteBefore[table]).padStart(8)}`);
  }
  const eliteTotalBefore = Object.values(eliteBefore).reduce((s, n) => s + n, 0);
  console.log("-".repeat(35));
  console.log(`${"TOTAL".padEnd(25)} ${String(eliteTotalBefore).padStart(8)}`);

  if (eliteTotalBefore === 0) {
    throw new Error("ABORT: No Elite records found to delete");
  }

  section("ELITE FITNESS STUDIO — BRANCH-SCOPED RECORDS TO BE DELETED");
  const eliteBranchBefore: Record<string, number> = {};
  for (const table of BRANCH_SCOPED_TABLES) {
    let total = 0;
    for (const bid of eliteBranchIds) {
      total += await countByBranch(prisma, table, bid);
    }
    eliteBranchBefore[table] = total;
  }
  console.log(`\n${"Table".padEnd(25)} ${"Count".padStart(8)}`);
  console.log("-".repeat(35));
  for (const table of BRANCH_SCOPED_TABLES) {
    console.log(`${table.padEnd(25)} ${String(eliteBranchBefore[table]).padStart(8)}`);
  }
  const eliteBranchTotalBefore = Object.values(eliteBranchBefore).reduce((s, n) => s + n, 0);
  console.log("-".repeat(35));
  console.log(`${"TOTAL".padEnd(25)} ${String(eliteBranchTotalBefore).padStart(8)}`);

  // =====================================================================
  // DRY-RUN STOP — no deletion performed
  // =====================================================================
  if (DRY_RUN) {
    section("DRY-RUN COMPLETE — NO DATA DELETED");
    console.log(
      `Pre-flight verified: Elite gym "${eliteGym.name}" (${eliteGym.code}) id=${eliteGymId}, ` +
        `${eliteBranches.length} branch(es). ${eliteTotalBefore} total records would be deleted.`
    );
    console.log("Re-run WITHOUT --dry-run to perform the actual deletion.");
    return;
  }

  const focusBefore = await snapshotFocus(prisma, focusGymId);

  // =====================================================================
  // STEP 3 — DELETE ELITE DATA IN FOREIGN-KEY-SAFE ORDER (single transaction)
  // =====================================================================
  section("DELETING ELITE DATA (FK-safe order, in one transaction)");

  const deleted: Record<string, number> = {};
  await prisma.$transaction(async (tx) => {
    // --- Level 1: Leaf records that depend on Members / TrainerProfiles / Users / Memberships / Plans / Packages ---
    deleted["Payment"] = (await tx.payment.deleteMany({ where: { gymId: eliteGymId } })).count;
    deleted["PTSession"] = (await tx.pTSession.deleteMany({ where: { gymId: eliteGymId } })).count;
    deleted["WorkoutPlan"] = (await tx.workoutPlan.deleteMany({ where: { gymId: eliteGymId } })).count;
    deleted["DietPlan"] = (await tx.dietPlan.deleteMany({ where: { gymId: eliteGymId } })).count;
    deleted["Attendance"] = (await tx.attendance.deleteMany({ where: { gymId: eliteGymId } })).count;
    deleted["Expense"] = (await tx.expense.deleteMany({ where: { gymId: eliteGymId } })).count;
    deleted["Membership"] = (await tx.membership.deleteMany({ where: { gymId: eliteGymId } })).count;

    // --- Level 2: Members, TrainerProfiles, Users ---
    deleted["Member"] = (await tx.member.deleteMany({ where: { gymId: eliteGymId } })).count;
    deleted["TrainerProfile"] = (await tx.trainerProfile.deleteMany({ where: { gymId: eliteGymId } })).count;
    deleted["User"] = (await tx.user.deleteMany({ where: { gymId: eliteGymId } })).count;

    // --- Level 3: Gym-only plans / packages ---
    deleted["MembershipPlan"] = (await tx.membershipPlan.deleteMany({ where: { gymId: eliteGymId } })).count;
    deleted["PTPackage"] = (await tx.pTPackage.deleteMany({ where: { gymId: eliteGymId } })).count;

    // --- Level 4: Settings ---
    deleted["GymSettings"] = (await tx.gymSettings.deleteMany({ where: { gymId: eliteGymId } })).count;
    deleted["GymSettingsBackup"] = (await tx.gymSettingsBackup.deleteMany({ where: { gymId: eliteGymId } })).count;

    // --- Level 5: Elite branch(es) ---
    deleted["Branch"] = (await tx.branch.deleteMany({ where: { gymId: eliteGymId } })).count;

    // --- Level 6: Elite gym itself ---
    deleted["Gym"] = (await tx.gym.deleteMany({ where: { id: eliteGymId } })).count;
  });

  console.log(`\n${"Table".padEnd(25)} ${"Before".padStart(8)} ${"Deleted".padStart(8)}`);
  console.log("-".repeat(45));
  let consistencyOk = true;
  for (const table of GYM_SCOPED_TABLES) {
    const before = eliteBefore[table] ?? 0;
    const delCount = deleted[table] ?? 0;
    const match = before === delCount ? "OK" : "MISMATCH!";
    if (before !== delCount) consistencyOk = false;
    console.log(`${table.padEnd(25)} ${String(before).padStart(8)} ${String(delCount).padStart(8)}   ${match}`);
  }
  const deletedTotal = Object.values(deleted).reduce((s, n) => s + n, 0);
  console.log("-".repeat(45));
  console.log(`${"TOTAL".padEnd(25)} ${String(eliteTotalBefore).padStart(8)} ${String(deletedTotal).padStart(8)}`);
  if (!consistencyOk) throw new Error("ABORT: Deleted counts do not match pre-deletion counts");

  // =====================================================================
  // STEP 4 — READ-ONLY VERIFICATION
  // =====================================================================
  section("READ-ONLY VERIFICATION — GLOBAL GYM/BRANCH STATE");

  const gyms = await prisma.gym.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, code: true },
  });
  const branches = await prisma.branch.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, code: true, gymId: true },
  });

  console.log(`\nGyms remaining (${gyms.length}):`);
  for (const g of gyms) console.log(`  - ${g.name} (${g.code}) [${g.id}]`);
  console.log(`Branches remaining (${branches.length}):`);
  for (const b of branches) console.log(`  - ${b.name} (${b.code}) gymId=${b.gymId}`);

  let allPass = true;
  const check = (condition: boolean, label: string): void => {
    console.log(`${condition ? "PASS" : "FAIL"}  ${label}`);
    if (!condition) allPass = false;
  };

  section("READ-ONLY VERIFICATION — CHECKS");

  // 1. Only 1 Gym remains: Focus Fitness
  check(gyms.length === 1, `Exactly 1 Gym remains (found ${gyms.length})`);
  check(
    gyms.length === 1 && gyms[0].id === focusGymId && gyms[0].name.toLowerCase().includes("focus"),
    "Remaining gym is Focus Fitness"
  );

  // 2. Only Focus Fitness branches remain
  check(branches.length === focusBranchIds.length, `Exactly ${focusBranchIds.length} Branch(es) remain (found ${branches.length})`);
  check(
    branches.every((b) => focusBranchIds.includes(b.gymId)),
    "Remaining branches all belong to Focus Fitness"
  );

  // 3. No Elite records remain by gymId
  section("READ-ONLY VERIFICATION — ELITE LEFTOVER CHECK (gymId)");
  for (const table of GYM_SCOPED_TABLES) {
    const leftover = await countByGym(prisma, table, eliteGymId);
    check(leftover === 0, `${table}: 0 records for Elite gymId (found ${leftover})`);
  }

  // 4. No Elite records remain by branchId
  section("READ-ONLY VERIFICATION — ELITE LEFTOVER CHECK (branchId)");
  for (const bid of eliteBranchIds) {
    for (const table of BRANCH_SCOPED_TABLES) {
      const leftover = await countByBranch(prisma, table, bid);
      check(leftover === 0, `${table}: 0 records for Elite branchId ${bid} (found ${leftover})`);
    }
    const branchById = await prisma.branch.findUnique({ where: { id: bid } });
    check(branchById === null, `Branch ${bid} is deleted`);
  }
  const gymById = await prisma.gym.findUnique({ where: { id: eliteGymId } });
  check(gymById === null, `Gym ${eliteGymId} is deleted`);

  // 5. Focus Fitness data intact (before vs after snapshot)
  section("READ-ONLY VERIFICATION — FOCUS FITNESS INTEGRITY");
  check((await prisma.gym.findUnique({ where: { id: focusGymId } })) !== null, "Focus Fitness gym still exists");
  for (const bid of focusBranchIds) {
    check((await prisma.branch.findUnique({ where: { id: bid } })) !== null, `Focus Fitness branch ${bid} still exists`);
  }

  const focusAfter = await snapshotFocus(prisma, focusGymId);
  for (const table of GYM_SCOPED_TABLES) {
    if (table === "Gym") continue;
    const beforeCount = focusBefore[table] ?? 0;
    const afterCount = focusAfter[table] ?? -1;
    const ok = beforeCount === afterCount;
    check(ok, `Focus ${table}: before=${beforeCount} after=${afterCount} ${ok ? "unchanged" : "CHANGED!"}`);
  }

  // =====================================================================
  // STEP 5 — RESULT SUMMARY
  // =====================================================================
  section("RESULT");
  console.log(`Deleted ${deletedTotal} Elite Fitness Studio records.`);
  if (allPass) {
    console.log("ALL VERIFICATION CHECKS PASSED - Focus Fitness is fully intact.");
  } else {
    console.log("SOME VERIFICATION CHECKS FAILED - review the output above.");
    process.exitCode = 1;
  }
}

main()
  .catch((error) => {
    console.error("\nError:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });