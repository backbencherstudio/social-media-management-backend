/*
  Warnings:

  - You are about to drop the column `clicks` on the `post_performances` table. All the data in the column will be lost.
  - You are about to drop the column `engagement_rate` on the `post_performances` table. All the data in the column will be lost.
  - You are about to drop the column `platform` on the `post_performances` table. All the data in the column will be lost.

*/
-- AlterEnum
ALTER TYPE "Status" ADD VALUE 'pending_review';

-- AlterTable
ALTER TABLE "accounts" ADD COLUMN     "access_secret" TEXT,
ADD COLUMN     "api_key" TEXT,
ADD COLUMN     "api_secret" TEXT;

-- AlterTable
ALTER TABLE "post_performances" DROP COLUMN "clicks",
DROP COLUMN "engagement_rate",
DROP COLUMN "platform",
ADD COLUMN     "provider" TEXT,
ADD COLUMN     "status" SMALLINT DEFAULT 1,
ADD COLUMN     "views" INTEGER,
ALTER COLUMN "post_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "posts" ADD COLUMN     "facebook_post_id" TEXT,
ADD COLUMN     "feedback" TEXT,
ADD COLUMN     "instagram_post_id" TEXT,
ADD COLUMN     "linkedin_post_id" TEXT,
ADD COLUMN     "task_id" TEXT,
ADD COLUMN     "twitter_post_id" TEXT,
ALTER COLUMN "status" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "security_settings" ALTER COLUMN "id" SET DEFAULT '1';

-- AlterTable
ALTER TABLE "task_assign" ADD COLUMN     "assigned_by" TEXT DEFAULT 'Admin',
ADD COLUMN     "order_DetailsId" TEXT,
ADD COLUMN     "post_count" INTEGER DEFAULT 0,
ADD COLUMN     "post_type" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "banking_id" TEXT;

-- CreateTable
CREATE TABLE "order_details" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "service_name" TEXT NOT NULL,
    "service_amount_name" TEXT NOT NULL,
    "service_count" DOUBLE PRECISION NOT NULL,
    "service_price" DOUBLE PRECISION NOT NULL,
    "service_tier_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reseller_withdrawals" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),
    "status" SMALLINT DEFAULT 1,
    "reseller_id" TEXT,
    "amount" DOUBLE PRECISION,
    "method" TEXT,

    CONSTRAINT "reseller_withdrawals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DesignFile" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),
    "content" TEXT,
    "status" INTEGER DEFAULT 0,
    "feedback" TEXT,
    "task_id" TEXT,

    CONSTRAINT "DesignFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DesignFileAsset" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "size" INTEGER,
    "design_file_id" TEXT,

    CONSTRAINT "DesignFileAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_Order_DetailsToServiceTier" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_Order_DetailsToServiceTier_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_Order_DetailsToServiceTier_B_index" ON "_Order_DetailsToServiceTier"("B");

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "task_assign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_details" ADD CONSTRAINT "order_details_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_assign" ADD CONSTRAINT "task_assign_order_DetailsId_fkey" FOREIGN KEY ("order_DetailsId") REFERENCES "order_details"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reseller_withdrawals" ADD CONSTRAINT "reseller_withdrawals_reseller_id_fkey" FOREIGN KEY ("reseller_id") REFERENCES "resellers"("reseller_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DesignFile" ADD CONSTRAINT "DesignFile_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "task_assign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DesignFileAsset" ADD CONSTRAINT "DesignFileAsset_design_file_id_fkey" FOREIGN KEY ("design_file_id") REFERENCES "DesignFile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_Order_DetailsToServiceTier" ADD CONSTRAINT "_Order_DetailsToServiceTier_A_fkey" FOREIGN KEY ("A") REFERENCES "order_details"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_Order_DetailsToServiceTier" ADD CONSTRAINT "_Order_DetailsToServiceTier_B_fkey" FOREIGN KEY ("B") REFERENCES "service_tiers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
