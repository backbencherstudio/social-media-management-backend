-- CreateTable
CREATE TABLE "withdrawal_settings" (
    "id" SERIAL NOT NULL,
    "minimumWithdrawalAmount" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "withdrawalProcessingFee" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "withdrawalProcessingTime" TEXT NOT NULL DEFAULT '3-5 Business Days',
    "isFlatCommission" BOOLEAN NOT NULL DEFAULT false,
    "flatCommissionValue" DOUBLE PRECISION,
    "percentageCommissionValue" DOUBLE PRECISION,
    "paymentMethods" TEXT[],

    CONSTRAINT "withdrawal_settings_pkey" PRIMARY KEY ("id")
);
