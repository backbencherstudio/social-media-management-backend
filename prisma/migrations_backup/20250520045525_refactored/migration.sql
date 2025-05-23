/*
  Warnings:

  - You are about to drop the column `one_time_payment` on the `subscriptions` table. All the data in the column will be lost.
  - The `status` column on the `subscriptions` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('active', 'canceled', 'expired', 'pending', 'deactive');

-- CreateEnum
CREATE TYPE "OrderType" AS ENUM ('progress', 'completed', 'pending', 'canceled');

-- DropForeignKey
ALTER TABLE "email_history_recipients" DROP CONSTRAINT "email_history_recipients_recipient_id_fkey";

-- AlterTable
ALTER TABLE "subscriptions" DROP COLUMN "one_time_payment",
DROP COLUMN "status",
ADD COLUMN     "status" "SubscriptionStatus" NOT NULL DEFAULT 'active';

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "order_type" "OrderType" NOT NULL DEFAULT 'progress',
    "subscription_id" TEXT,
    "user_id" TEXT,
    "service_tier_id" TEXT,
    "ammount" DOUBLE PRECISION,
    "user_name" TEXT,
    "user_email" TEXT,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "email_history_recipients" ADD CONSTRAINT "email_history_recipients_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_service_tier_id_fkey" FOREIGN KEY ("service_tier_id") REFERENCES "service_tiers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
