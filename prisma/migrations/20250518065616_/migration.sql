-- CreateEnum
CREATE TYPE "OrderType" AS ENUM ('progress', 'completed', 'pending', 'canceled');

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "order_type" "OrderType" NOT NULL DEFAULT 'progress',
    "subscription_id" TEXT,
    "user_id" TEXT,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
