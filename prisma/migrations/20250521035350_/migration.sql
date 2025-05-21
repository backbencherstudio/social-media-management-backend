/*
  Warnings:

  - You are about to drop the column `note` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `role_id` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `role_name` on the `orders` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_role_id_fkey";

-- AlterTable
ALTER TABLE "orders" DROP COLUMN "note",
DROP COLUMN "role_id",
DROP COLUMN "role_name";

-- AlterTable
ALTER TABLE "task_assign" ADD COLUMN     "note" TEXT,
ADD COLUMN     "role_id" TEXT,
ADD COLUMN     "role_name" TEXT;

-- AddForeignKey
ALTER TABLE "task_assign" ADD CONSTRAINT "task_assign_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
