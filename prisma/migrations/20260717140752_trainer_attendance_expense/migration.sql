-- CreateEnum
CREATE TYPE "public"."AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'LEAVE');

-- CreateEnum
CREATE TYPE "public"."ExpenseCategory" AS ENUM ('RENT', 'SALARY', 'UTILITIES', 'MAINTENANCE', 'SUPPLIES', 'MARKETING', 'OTHER');

-- DropForeignKey
ALTER TABLE "public"."Membership" DROP CONSTRAINT "Membership_branchId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Membership" DROP CONSTRAINT "Membership_memberId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Membership" DROP CONSTRAINT "Membership_planId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Payment" DROP CONSTRAINT "Payment_branchId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Payment" DROP CONSTRAINT "Payment_memberId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Payment" DROP CONSTRAINT "Payment_membershipId_fkey";

-- CreateTable
CREATE TABLE "public"."TrainerProfile" (
    "id" TEXT NOT NULL,
    "gymId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "specialization" TEXT,
    "experienceYears" INTEGER,
    "salary" DECIMAL(10,2),
    "joiningDate" TIMESTAMP(3),
    "certifications" TEXT,
    "bio" TEXT,
    "emergencyContact" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Attendance" (
    "id" TEXT NOT NULL,
    "gymId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "attendanceDate" TIMESTAMP(3) NOT NULL,
    "checkIn" TIMESTAMP(3),
    "checkOut" TIMESTAMP(3),
    "status" "public"."AttendanceStatus" NOT NULL DEFAULT 'PRESENT',
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Expense" (
    "id" TEXT NOT NULL,
    "gymId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "category" "public"."ExpenseCategory" NOT NULL,
    "title" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "paymentMode" "public"."PaymentMode" NOT NULL,
    "vendor" TEXT,
    "invoiceNumber" TEXT,
    "expenseDate" TIMESTAMP(3) NOT NULL,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TrainerProfile_userId_key" ON "public"."TrainerProfile"("userId");

-- CreateIndex
CREATE INDEX "TrainerProfile_gymId_idx" ON "public"."TrainerProfile"("gymId");

-- CreateIndex
CREATE INDEX "TrainerProfile_isActive_idx" ON "public"."TrainerProfile"("isActive");

-- CreateIndex
CREATE INDEX "Attendance_gymId_idx" ON "public"."Attendance"("gymId");

-- CreateIndex
CREATE INDEX "Attendance_branchId_idx" ON "public"."Attendance"("branchId");

-- CreateIndex
CREATE INDEX "Attendance_memberId_idx" ON "public"."Attendance"("memberId");

-- CreateIndex
CREATE INDEX "Attendance_attendanceDate_idx" ON "public"."Attendance"("attendanceDate");

-- CreateIndex
CREATE INDEX "Attendance_status_idx" ON "public"."Attendance"("status");

-- CreateIndex
CREATE INDEX "Expense_gymId_idx" ON "public"."Expense"("gymId");

-- CreateIndex
CREATE INDEX "Expense_branchId_idx" ON "public"."Expense"("branchId");

-- CreateIndex
CREATE INDEX "Expense_expenseDate_idx" ON "public"."Expense"("expenseDate");

-- CreateIndex
CREATE INDEX "Expense_category_idx" ON "public"."Expense"("category");

-- CreateIndex
CREATE INDEX "Expense_paymentMode_idx" ON "public"."Expense"("paymentMode");

-- CreateIndex
CREATE INDEX "Branch_gymId_idx" ON "public"."Branch"("gymId");

-- CreateIndex
CREATE INDEX "Member_gymId_idx" ON "public"."Member"("gymId");

-- CreateIndex
CREATE INDEX "Member_branchId_idx" ON "public"."Member"("branchId");

-- CreateIndex
CREATE INDEX "Member_status_idx" ON "public"."Member"("status");

-- CreateIndex
CREATE INDEX "Membership_gymId_idx" ON "public"."Membership"("gymId");

-- CreateIndex
CREATE INDEX "Membership_branchId_idx" ON "public"."Membership"("branchId");

-- CreateIndex
CREATE INDEX "Membership_memberId_idx" ON "public"."Membership"("memberId");

-- CreateIndex
CREATE INDEX "Membership_planId_idx" ON "public"."Membership"("planId");

-- CreateIndex
CREATE INDEX "Membership_status_idx" ON "public"."Membership"("status");

-- CreateIndex
CREATE INDEX "MembershipPlan_gymId_idx" ON "public"."MembershipPlan"("gymId");

-- CreateIndex
CREATE INDEX "Payment_gymId_idx" ON "public"."Payment"("gymId");

-- CreateIndex
CREATE INDEX "Payment_branchId_idx" ON "public"."Payment"("branchId");

-- CreateIndex
CREATE INDEX "Payment_memberId_idx" ON "public"."Payment"("memberId");

-- CreateIndex
CREATE INDEX "Payment_membershipId_idx" ON "public"."Payment"("membershipId");

-- CreateIndex
CREATE INDEX "Payment_paymentStatus_idx" ON "public"."Payment"("paymentStatus");

-- CreateIndex
CREATE INDEX "Payment_paymentDate_idx" ON "public"."Payment"("paymentDate");

-- CreateIndex
CREATE INDEX "User_gymId_idx" ON "public"."User"("gymId");

-- CreateIndex
CREATE INDEX "User_branchId_idx" ON "public"."User"("branchId");

-- AddForeignKey
ALTER TABLE "public"."TrainerProfile" ADD CONSTRAINT "TrainerProfile_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "public"."Gym"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TrainerProfile" ADD CONSTRAINT "TrainerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Membership" ADD CONSTRAINT "Membership_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "public"."Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Membership" ADD CONSTRAINT "Membership_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "public"."Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Membership" ADD CONSTRAINT "Membership_planId_fkey" FOREIGN KEY ("planId") REFERENCES "public"."MembershipPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Payment" ADD CONSTRAINT "Payment_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "public"."Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Payment" ADD CONSTRAINT "Payment_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "public"."Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Payment" ADD CONSTRAINT "Payment_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "public"."Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Attendance" ADD CONSTRAINT "Attendance_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "public"."Gym"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Attendance" ADD CONSTRAINT "Attendance_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "public"."Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Attendance" ADD CONSTRAINT "Attendance_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "public"."Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Attendance" ADD CONSTRAINT "Attendance_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Expense" ADD CONSTRAINT "Expense_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "public"."Gym"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Expense" ADD CONSTRAINT "Expense_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "public"."Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Expense" ADD CONSTRAINT "Expense_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
