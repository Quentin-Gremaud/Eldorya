-- AlterTable
ALTER TABLE "session_actions" ADD COLUMN "narrative_note" TEXT;
ALTER TABLE "session_actions" ADD COLUMN "feedback" TEXT;
ALTER TABLE "session_actions" ADD COLUMN "resolved_at" TIMESTAMP(3);
