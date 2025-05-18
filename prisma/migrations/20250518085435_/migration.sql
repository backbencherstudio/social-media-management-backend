-- DropForeignKey
ALTER TABLE "email_history_recipients" DROP CONSTRAINT "email_history_recipients_recipient_id_fkey";

-- AddForeignKey
ALTER TABLE "email_history_recipients" ADD CONSTRAINT "email_history_recipients_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
