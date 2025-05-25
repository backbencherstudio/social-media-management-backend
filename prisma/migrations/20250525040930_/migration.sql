-- CreateEnum
CREATE TYPE "clintStatus" AS ENUM ('active', 'inactive');

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "status" "clintStatus" NOT NULL DEFAULT 'active';
