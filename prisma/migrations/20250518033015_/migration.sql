/*
  Warnings:

  - You are about to drop the column `one_time_payment` on the `subscriptions` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "subscriptions" DROP COLUMN "one_time_payment";
