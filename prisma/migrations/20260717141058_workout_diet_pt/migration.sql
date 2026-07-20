-- CreateEnum
CREATE TYPE "public"."PTSessionStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'MISSED', 'CANCELLED');

-- CreateTable
CREATE TABLE "public"."WorkoutPlan" (
    "id" TEXT NOT NULL,
    "gymId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "trainerProfileId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkoutPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DietPlan" (
    "id" TEXT NOT NULL,
    "gymId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "trainerProfileId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "calories" INTEGER,
    "protein" INTEGER,
    "carbs" INTEGER,
    "fat" INTEGER,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DietPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PTPackage" (
    "id" TEXT NOT NULL,
    "gymId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "numberOfSessions" INTEGER NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "durationInDays" INTEGER NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PTPackage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PTSession" (
    "id" TEXT NOT NULL,
    "gymId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "trainerProfileId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "ptPackageId" TEXT NOT NULL,
    "sessionDate" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT,
    "endTime" TEXT,
    "status" "public"."PTSessionStatus" NOT NULL DEFAULT 'SCHEDULED',
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PTSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WorkoutPlan_gymId_idx" ON "public"."WorkoutPlan"("gymId");

-- CreateIndex
CREATE INDEX "WorkoutPlan_branchId_idx" ON "public"."WorkoutPlan"("branchId");

-- CreateIndex
CREATE INDEX "WorkoutPlan_trainerProfileId_idx" ON "public"."WorkoutPlan"("trainerProfileId");

-- CreateIndex
CREATE INDEX "WorkoutPlan_memberId_idx" ON "public"."WorkoutPlan"("memberId");

-- CreateIndex
CREATE INDEX "WorkoutPlan_isActive_idx" ON "public"."WorkoutPlan"("isActive");

-- CreateIndex
CREATE INDEX "DietPlan_gymId_idx" ON "public"."DietPlan"("gymId");

-- CreateIndex
CREATE INDEX "DietPlan_branchId_idx" ON "public"."DietPlan"("branchId");

-- CreateIndex
CREATE INDEX "DietPlan_trainerProfileId_idx" ON "public"."DietPlan"("trainerProfileId");

-- CreateIndex
CREATE INDEX "DietPlan_memberId_idx" ON "public"."DietPlan"("memberId");

-- CreateIndex
CREATE INDEX "DietPlan_isActive_idx" ON "public"."DietPlan"("isActive");

-- CreateIndex
CREATE INDEX "PTPackage_gymId_idx" ON "public"."PTPackage"("gymId");

-- CreateIndex
CREATE INDEX "PTPackage_isActive_idx" ON "public"."PTPackage"("isActive");

-- CreateIndex
CREATE INDEX "PTSession_gymId_idx" ON "public"."PTSession"("gymId");

-- CreateIndex
CREATE INDEX "PTSession_branchId_idx" ON "public"."PTSession"("branchId");

-- CreateIndex
CREATE INDEX "PTSession_trainerProfileId_idx" ON "public"."PTSession"("trainerProfileId");

-- CreateIndex
CREATE INDEX "PTSession_memberId_idx" ON "public"."PTSession"("memberId");

-- CreateIndex
CREATE INDEX "PTSession_ptPackageId_idx" ON "public"."PTSession"("ptPackageId");

-- CreateIndex
CREATE INDEX "PTSession_sessionDate_idx" ON "public"."PTSession"("sessionDate");

-- CreateIndex
CREATE INDEX "PTSession_status_idx" ON "public"."PTSession"("status");

-- AddForeignKey
ALTER TABLE "public"."WorkoutPlan" ADD CONSTRAINT "WorkoutPlan_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "public"."Gym"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkoutPlan" ADD CONSTRAINT "WorkoutPlan_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "public"."Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkoutPlan" ADD CONSTRAINT "WorkoutPlan_trainerProfileId_fkey" FOREIGN KEY ("trainerProfileId") REFERENCES "public"."TrainerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkoutPlan" ADD CONSTRAINT "WorkoutPlan_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "public"."Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DietPlan" ADD CONSTRAINT "DietPlan_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "public"."Gym"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DietPlan" ADD CONSTRAINT "DietPlan_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "public"."Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DietPlan" ADD CONSTRAINT "DietPlan_trainerProfileId_fkey" FOREIGN KEY ("trainerProfileId") REFERENCES "public"."TrainerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DietPlan" ADD CONSTRAINT "DietPlan_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "public"."Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PTPackage" ADD CONSTRAINT "PTPackage_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "public"."Gym"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PTSession" ADD CONSTRAINT "PTSession_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "public"."Gym"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PTSession" ADD CONSTRAINT "PTSession_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "public"."Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PTSession" ADD CONSTRAINT "PTSession_trainerProfileId_fkey" FOREIGN KEY ("trainerProfileId") REFERENCES "public"."TrainerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PTSession" ADD CONSTRAINT "PTSession_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "public"."Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PTSession" ADD CONSTRAINT "PTSession_ptPackageId_fkey" FOREIGN KEY ("ptPackageId") REFERENCES "public"."PTPackage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
