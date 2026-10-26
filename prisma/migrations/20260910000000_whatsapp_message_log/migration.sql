-- CreateEnum
CREATE TYPE "public"."WhatsAppMessageType" AS ENUM ('RENEWAL_REMINDER_7_DAYS', 'RENEWAL_REMINDER_3_DAYS', 'RENEWAL_RECEIPT');

-- CreateEnum
CREATE TYPE "public"."WhatsAppMessageStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'SKIPPED');

-- CreateTable
CREATE TABLE "WhatsAppMessageLog" (
    "id" TEXT NOT NULL,
    "gymId" TEXT NOT NULL,
    "branchId" TEXT,
    "memberId" TEXT NOT NULL,
    "membershipId" TEXT,
    "paymentId" TEXT,
    "type" "public"."WhatsAppMessageType" NOT NULL,
    "dedupeKey" TEXT NOT NULL,
    "recipientPhone" TEXT NOT NULL,
    "templateName" TEXT,
    "scheduledFor" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "messageId" TEXT,
    "status" "public"."WhatsAppMessageStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhatsAppMessageLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WhatsAppMessageLog_dedupeKey_key" ON "WhatsAppMessageLog"("dedupeKey");

-- CreateIndex
CREATE INDEX "WhatsAppMessageLog_gymId_idx" ON "WhatsAppMessageLog"("gymId");

-- CreateIndex
CREATE INDEX "WhatsAppMessageLog_memberId_idx" ON "WhatsAppMessageLog"("memberId");

-- CreateIndex
CREATE INDEX "WhatsAppMessageLog_membershipId_idx" ON "WhatsAppMessageLog"("membershipId");

-- CreateIndex
CREATE INDEX "WhatsAppMessageLog_status_idx" ON "WhatsAppMessageLog"("status");

-- CreateIndex
CREATE INDEX "WhatsAppMessageLog_type_scheduledFor_idx" ON "WhatsAppMessageLog"("type", "scheduledFor");

-- AddForeignKey
ALTER TABLE "WhatsAppMessageLog" ADD CONSTRAINT "WhatsAppMessageLog_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "Gym"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsAppMessageLog" ADD CONSTRAINT "WhatsAppMessageLog_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsAppMessageLog" ADD CONSTRAINT "WhatsAppMessageLog_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "Membership"("id") ON DELETE SET NULL ON UPDATE CASCADE;
