/*
  Warnings:

  - You are about to drop the column `name` on the `website_infos` table. All the data in the column will be lost.
  - Added the required column `time_zone` to the `website_infos` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "website_infos" DROP COLUMN "name",
ADD COLUMN     "site_description" TEXT,
ADD COLUMN     "site_name" TEXT,
ADD COLUMN     "time_zone" TEXT NOT NULL;
