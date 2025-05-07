-- AlterTable
ALTER TABLE "withdrawal_settings" ALTER COLUMN "minimumWithdrawalAmount" DROP DEFAULT,
ALTER COLUMN "withdrawalProcessingFee" DROP DEFAULT,
ALTER COLUMN "withdrawalProcessingTime" DROP DEFAULT,
ALTER COLUMN "isFlatCommission" DROP DEFAULT;

-- CreateTable
CREATE TABLE "security_settings" (
    "id" SERIAL NOT NULL,
    "dataExportBackup" TEXT NOT NULL,
    "sessionTimeout" INTEGER NOT NULL,
    "failedLoginAttempts" INTEGER NOT NULL,
    "passwordExpiry" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "security_settings_pkey" PRIMARY KEY ("id")
);
