-- CreateEnum
CREATE TYPE "public"."EnquiryStatus" AS ENUM ('PENDING', 'CONTACTED', 'CONVERTED', 'NOT_INTERESTED');

-- CreateEnum
CREATE TYPE "public"."EnquiryFollowUpOutcome" AS ENUM ('CONTACTED', 'NO_ANSWER', 'CALLBACK_REQUESTED', 'CONVERTED', 'NOT_INTERESTED');

-- CreateTable
CREATE TABLE "public"."Enquiry" (
    "id" TEXT NOT NULL,
    "gymId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mobileNumber" TEXT NOT NULL,
    "nextFollowUpAt" TIMESTAMP(3),
    "notes" TEXT,
    "status" "public"."EnquiryStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Enquiry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."EnquiryFollowUp" (
    "id" TEXT NOT NULL,
    "enquiryId" TEXT NOT NULL,
    "outcome" "public"."EnquiryFollowUpOutcome" NOT NULL,
    "notes" TEXT,
    "contactedAt" TIMESTAMP(3) NOT NULL,
    "nextFollowUpAt" TIMESTAMP(3),
    "recordedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EnquiryFollowUp_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Enquiry_gymId_branchId_status_nextFollowUpAt_idx" ON "public"."Enquiry"("gymId", "branchId", "status", "nextFollowUpAt");

-- CreateIndex
CREATE INDEX "Enquiry_branchId_idx" ON "public"."Enquiry"("branchId");

-- CreateIndex
CREATE INDEX "EnquiryFollowUp_enquiryId_contactedAt_idx" ON "public"."EnquiryFollowUp"("enquiryId", "contactedAt");

-- CreateIndex
CREATE INDEX "EnquiryFollowUp_recordedById_idx" ON "public"."EnquiryFollowUp"("recordedById");

-- AddForeignKey
ALTER TABLE "public"."Enquiry" ADD CONSTRAINT "Enquiry_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "public"."Gym"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Enquiry" ADD CONSTRAINT "Enquiry_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "public"."Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EnquiryFollowUp" ADD CONSTRAINT "EnquiryFollowUp_enquiryId_fkey" FOREIGN KEY ("enquiryId") REFERENCES "public"."Enquiry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EnquiryFollowUp" ADD CONSTRAINT "EnquiryFollowUp_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
