-- AlterTable
ALTER TABLE "DietPlan" ADD COLUMN     "content" JSONB;

-- AlterTable
ALTER TABLE "GymSettings" ADD COLUMN     "whatsappEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "whatsappPhoneNumberId" TEXT;
