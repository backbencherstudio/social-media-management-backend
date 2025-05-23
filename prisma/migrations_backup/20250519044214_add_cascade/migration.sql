-- DropForeignKey
ALTER TABLE "ucodes" DROP CONSTRAINT "ucodes_user_id_fkey";

-- AddForeignKey
ALTER TABLE "ucodes" ADD CONSTRAINT "ucodes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
