/*
  Warnings:

  - You are about to drop the `_TaskAssignments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `admin_reseller` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `conversations` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `messages` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "paymentStatus" AS ENUM ('paid', 'pending', 'due');

-- CreateEnum
CREATE TYPE "ResellerPayemntStat" AS ENUM ('pending', 'paid');

-- DropForeignKey
ALTER TABLE "_TaskAssaingees" DROP CONSTRAINT "_TaskAssaingees_A_fkey";

-- DropForeignKey
ALTER TABLE "_TaskAssaingees" DROP CONSTRAINT "_TaskAssaingees_B_fkey";

-- DropForeignKey
ALTER TABLE "_TaskAssignments" DROP CONSTRAINT "_TaskAssignments_A_fkey";

-- DropForeignKey
ALTER TABLE "_TaskAssignments" DROP CONSTRAINT "_TaskAssignments_B_fkey";

-- DropForeignKey
ALTER TABLE "_resellers" DROP CONSTRAINT "_resellers_A_fkey";

-- DropForeignKey
ALTER TABLE "admin_reseller" DROP CONSTRAINT "admin_reseller_user_id_fkey";

-- DropForeignKey
ALTER TABLE "conversations" DROP CONSTRAINT "conversations_creator_id_fkey";

-- DropForeignKey
ALTER TABLE "conversations" DROP CONSTRAINT "conversations_participant_id_fkey";

-- DropForeignKey
ALTER TABLE "messages" DROP CONSTRAINT "messages_attachment_id_fkey";

-- DropForeignKey
ALTER TABLE "messages" DROP CONSTRAINT "messages_conversation_id_fkey";

-- DropForeignKey
ALTER TABLE "messages" DROP CONSTRAINT "messages_receiver_id_fkey";

-- DropForeignKey
ALTER TABLE "messages" DROP CONSTRAINT "messages_sender_id_fkey";

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "payment_status" "paymentStatus" NOT NULL DEFAULT 'pending';

-- AlterTable
ALTER TABLE "reseller_application" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "task_assign" ADD COLUMN     "reseller_id" TEXT,
ALTER COLUMN "ammount" SET DATA TYPE DOUBLE PRECISION;

-- DropTable
DROP TABLE "_TaskAssignments";

-- DropTable
DROP TABLE "admin_reseller";

-- DropTable
DROP TABLE "conversations";

-- DropTable
DROP TABLE "messages";

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "creator_id" TEXT NOT NULL,
    "participant_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "sender_id" TEXT NOT NULL,
    "receiver_id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" "MessageStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resellers" (
    "reseller_id" TEXT NOT NULL,
    "user_id" TEXT,
    "user_type" TEXT,
    "full_name" TEXT,
    "user_email" TEXT,
    "skills" TEXT[],
    "total_task" INTEGER NOT NULL DEFAULT 0,
    "complete_tasks" INTEGER NOT NULL DEFAULT 0,
    "total_earnings" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "ResellerStatus" NOT NULL DEFAULT 'active',

    CONSTRAINT "resellers_pkey" PRIMARY KEY ("reseller_id")
);

-- CreateTable
CREATE TABLE "resellers_payment" (
    "id" TEXT NOT NULL,
    "reseller_id" TEXT,
    "status" "ResellerPayemntStat" NOT NULL,
    "task_ammount" DOUBLE PRECISION,

    CONSTRAINT "resellers_payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
    "full_name" TEXT,
    "email" TEXT,
    "role" TEXT,
    "password" TEXT,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_AttachmentToMessage" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_AttachmentToMessage_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Team_email_key" ON "Team"("email");

-- CreateIndex
CREATE INDEX "_AttachmentToMessage_B_index" ON "_AttachmentToMessage"("B");

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_participant_id_fkey" FOREIGN KEY ("participant_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "Conversation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resellers" ADD CONSTRAINT "resellers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resellers_payment" ADD CONSTRAINT "resellers_payment_reseller_id_fkey" FOREIGN KEY ("reseller_id") REFERENCES "resellers"("reseller_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AttachmentToMessage" ADD CONSTRAINT "_AttachmentToMessage_A_fkey" FOREIGN KEY ("A") REFERENCES "attachments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AttachmentToMessage" ADD CONSTRAINT "_AttachmentToMessage_B_fkey" FOREIGN KEY ("B") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_resellers" ADD CONSTRAINT "_resellers_A_fkey" FOREIGN KEY ("A") REFERENCES "resellers"("reseller_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TaskAssaingees" ADD CONSTRAINT "_TaskAssaingees_A_fkey" FOREIGN KEY ("A") REFERENCES "resellers"("reseller_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TaskAssaingees" ADD CONSTRAINT "_TaskAssaingees_B_fkey" FOREIGN KEY ("B") REFERENCES "task_assign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
