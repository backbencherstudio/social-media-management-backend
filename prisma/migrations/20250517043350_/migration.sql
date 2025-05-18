/*
  Warnings:

  - The `status` column on the `subscriptions` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('active', 'canceled', 'expired', 'pending');

-- AlterTable
ALTER TABLE "subscriptions" DROP COLUMN "status",
ADD COLUMN     "status" "SubscriptionStatus" NOT NULL DEFAULT 'active';
