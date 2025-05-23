/*
  Warnings:

  - You are about to drop the column `order_type` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the `_OrderAssignees` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('progress', 'completed', 'pending', 'canceled');

-- CreateEnum
CREATE TYPE "Status" AS ENUM ('In_progress', 'completed', 'pending', 'canceled', 'Clint_review');

-- DropForeignKey
ALTER TABLE "_OrderAssignees" DROP CONSTRAINT "_OrderAssignees_A_fkey";

-- DropForeignKey
ALTER TABLE "_OrderAssignees" DROP CONSTRAINT "_OrderAssignees_B_fkey";

-- AlterTable
ALTER TABLE "orders" DROP COLUMN "order_type",
ADD COLUMN     "note" TEXT,
ADD COLUMN     "order_status" "OrderStatus" NOT NULL DEFAULT 'progress',
ADD COLUMN     "pakage_name" TEXT,
ADD COLUMN     "role_id" TEXT,
ADD COLUMN     "role_name" TEXT;

-- DropTable
DROP TABLE "_OrderAssignees";

-- DropEnum
DROP TYPE "OrderType";

-- CreateTable
CREATE TABLE "task_assign" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" TEXT,
    "order_id" TEXT,
    "user_name" TEXT,
    "due_date" TEXT,
    "status" "Status" NOT NULL DEFAULT 'In_progress',

    CONSTRAINT "task_assign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_TaskAssaingees" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_TaskAssaingees_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_TaskAssaingees_B_index" ON "_TaskAssaingees"("B");

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_assign" ADD CONSTRAINT "task_assign_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_assign" ADD CONSTRAINT "task_assign_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TaskAssaingees" ADD CONSTRAINT "_TaskAssaingees_A_fkey" FOREIGN KEY ("A") REFERENCES "task_assign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TaskAssaingees" ADD CONSTRAINT "_TaskAssaingees_B_fkey" FOREIGN KEY ("B") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
