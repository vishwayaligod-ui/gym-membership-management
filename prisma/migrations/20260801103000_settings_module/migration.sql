-- CreateTable
CREATE TABLE "GymSettings" (
    "id" TEXT NOT NULL,
    "gymId" TEXT NOT NULL,
    "gymName" TEXT NOT NULL,
    "ownerName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "alternatePhone" TEXT,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "pincode" TEXT NOT NULL,
    "gstNumber" TEXT,
    "website" TEXT,
    "googleBusinessProfileUrl" TEXT,
    "businessHours" TEXT NOT NULL,
    "gymLogo" TEXT,
    "primaryAccentColor" TEXT NOT NULL DEFAULT '#2563EB',
    "secondaryColor" TEXT NOT NULL DEFAULT '#0F172A',
    "brandingLogo" TEXT,
    "favicon" TEXT,
    "defaultMembershipDurationDays" INTEGER NOT NULL DEFAULT 90,
    "defaultFreezeDays" INTEGER NOT NULL DEFAULT 7,
    "allowMultipleActiveMemberships" BOOLEAN NOT NULL DEFAULT false,
    "autoActivateMembership" BOOLEAN NOT NULL DEFAULT true,
    "membershipExpiryReminder" BOOLEAN NOT NULL DEFAULT true,
    "reminderBeforeDays" INTEGER NOT NULL DEFAULT 7,
    "gracePeriodAfterExpiryDays" INTEGER NOT NULL DEFAULT 3,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "currencySymbol" TEXT NOT NULL DEFAULT '₹',
    "taxPercentage" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "lateFee" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "receiptPrefix" TEXT NOT NULL DEFAULT 'RCPT',
    "invoicePrefix" TEXT NOT NULL DEFAULT 'INV',
    "autoGenerateReceiptNumber" BOOLEAN NOT NULL DEFAULT true,
    "allowMultipleCheckIns" BOOLEAN NOT NULL DEFAULT false,
    "lateArrivalThresholdMins" INTEGER NOT NULL DEFAULT 15,
    "workingHoursStart" TEXT NOT NULL DEFAULT '06:00',
    "workingHoursEnd" TEXT NOT NULL DEFAULT '22:00',
    "checkInWindowStart" TEXT NOT NULL DEFAULT '05:30',
    "checkInWindowEnd" TEXT NOT NULL DEFAULT '23:00',
    "attendanceAutoCloseTime" TEXT NOT NULL DEFAULT '23:59',
    "whatsappNotifications" BOOLEAN NOT NULL DEFAULT false,
    "smsNotifications" BOOLEAN NOT NULL DEFAULT false,
    "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "renewalReminder" BOOLEAN NOT NULL DEFAULT true,
    "paymentReminder" BOOLEAN NOT NULL DEFAULT true,
    "birthdayWishes" BOOLEAN NOT NULL DEFAULT false,
    "attendanceReminder" BOOLEAN NOT NULL DEFAULT false,
    "defaultDashboard" TEXT NOT NULL DEFAULT 'overview',
    "defaultLanguage" TEXT NOT NULL DEFAULT 'en',
    "dateFormat" TEXT NOT NULL DEFAULT 'DD/MM/YYYY',
    "timeFormat" TEXT NOT NULL DEFAULT '24h',
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    "requirePasswordChange" BOOLEAN NOT NULL DEFAULT false,
    "sessionTimeoutMinutes" INTEGER NOT NULL DEFAULT 30,
    "twoFactorAuthentication" BOOLEAN NOT NULL DEFAULT false,
    "loginHistoryEnabled" BOOLEAN NOT NULL DEFAULT true,
    "lastBackupAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GymSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GymSettingsBackup" (
    "id" TEXT NOT NULL,
    "gymId" TEXT NOT NULL,
    "label" TEXT,
    "snapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GymSettingsBackup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GymSettings_gymId_key" ON "GymSettings"("gymId");

-- CreateIndex
CREATE INDEX "GymSettings_gymId_idx" ON "GymSettings"("gymId");

-- CreateIndex
CREATE INDEX "GymSettingsBackup_gymId_idx" ON "GymSettingsBackup"("gymId");

-- CreateIndex
CREATE INDEX "GymSettingsBackup_createdAt_idx" ON "GymSettingsBackup"("createdAt");

-- AddForeignKey
ALTER TABLE "GymSettings" ADD CONSTRAINT "GymSettings_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "Gym"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GymSettingsBackup" ADD CONSTRAINT "GymSettingsBackup_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "Gym"("id") ON DELETE CASCADE ON UPDATE CASCADE;
