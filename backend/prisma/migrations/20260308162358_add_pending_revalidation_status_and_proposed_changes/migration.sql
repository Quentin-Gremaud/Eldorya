-- AlterEnum
ALTER TYPE "character_status" ADD VALUE 'pending_revalidation';

-- AlterTable
ALTER TABLE "characters" ADD COLUMN     "proposed_changes" JSONB;

-- AddForeignKey
ALTER TABLE "inventories" ADD CONSTRAINT "inventories_character_id_fkey" FOREIGN KEY ("character_id") REFERENCES "characters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
